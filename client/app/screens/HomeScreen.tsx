import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ScrollView,
  Platform,
  Animated,
  Keyboard,
  BackHandler,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  AppState,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

// Notification imports disabled temporarily for Expo Go SDK 53 testing
// import { registerForPushNotificationsAsync, sendLocalNotification } from "../../utils/notifications";

import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import ProfileScreen from "./ProfileScreen";
import SearchingRideOverlay from "../../components/SearchingRideOverlay";
import DriverAssignedOverlay from "../../components/DriverAssignedOverlay";
import ActivitySection from "../../components/ActivitySection";

import { userAPI, bookingAPI, notificationAPI, locationAPI } from "../../utils/api";
import { useAuth } from "../../context/AuthContext";
import { showToast } from "../../components/NotificationToast";

const HomeScreen = () => {
  const { width } = useWindowDimensions();
  const isSmallPhone = width < 360;
  const router = useRouter();
  
  const [displayName, setDisplayName] = useState("User");
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user: authUser, refreshProfile } = useAuth();

  // Card entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Scroll-based headline fade: measured dynamically so it works on all phones
  const scrollY = useRef(new Animated.Value(0)).current;
  const [headerMeasuredHeight, setHeaderMeasuredHeight] = useState(0);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (authUser) {
          setDisplayName(authUser.name || "User");
        } else {
          await refreshProfile();
        }

        const userData = authUser;
        if (!userData) return;

        const { initSocket } = require("../../utils/socket");
        const socket = await initSocket();

        socket.on("connect", () => {
          socket.emit("join", userData._id || userData.id);
        });

        if (socket.connected) {
          socket.emit("join", userData._id || userData.id);
        }

        socket.on("rideAccepted", (data: any) => {
          const booking = data?.booking || {};
          const isScheduled = booking.bookingType === "schedule";
          const scheduledTime = booking.scheduledDate ? new Date(booking.scheduledDate).getTime() : null;
          const isFutureScheduled = isScheduled && !!scheduledTime && scheduledTime > Date.now();
          const isRideReadyNow = booking.scheduledRideReady === true || !isFutureScheduled;

          setAssignedDriver(booking.driver || null);
          setActiveBookingId(booking.id || null);
          setIsSearching(false);

          if (!isRideReadyNow) return;

          router.push({
            pathname: "/screens/LiveRideTrackingScreen",
            params: {
              bookingId: booking.id,
              pLat: booking.pickupLatitude,
              pLon: booking.pickupLongitude,
              dLat: booking.dropLatitude,
              dLon: booking.dropLongitude
            }
          });
        });

        socket.on("bookingCancelledByDriver", () => clearBookingState());
        socket.on("bookingCancelledByUser", () => clearBookingState());

        socket.on("newNotification", (data: any) => {
          if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
          else setUnreadCount(prev => prev + 1);
          
          if (data.notification.type.startsWith('ride_')) {
            const toastType = data.notification.type === 'ride_cancelled' ? 'error' : 'success';
            showToast(data.notification.title, data.notification.body, toastType as any);
          }
        });

        socket.on("unreadCountUpdate", (data: any) => {
          if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
        });

        try {
          const notifRes = await notificationAPI.getNotifications();
          setUnreadCount(notifRes.data.unreadCount || 0);
        } catch (e) {}

        await checkActiveBooking();

      } catch (err) {
        console.error("Home error", err);
      }
    };

    const checkActiveBooking = async () => {
      try {
        const res = await bookingAPI.getActiveBooking();
        if (res.data.success && res.data.booking) {
          const b = res.data.booking;
          router.replace({
            pathname: "/screens/LiveRideTrackingScreen",
            params: {
              bookingId: b._id,
              pLat: b.pickupLatitude,
              pLon: b.pickupLongitude,
              dLat: b.dropLatitude,
              dLon: b.dropLongitude
            }
          });
        }
      } catch (err) {}
    };

    fetchUser();
    fetchCurrentLocation();

    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") checkActiveBooking();
    });

    return () => {
      subscription.remove();
      const { getSocket } = require("../../utils/socket");
      const socket = getSocket();
      if (socket) {
        socket.off("newNotification");
        socket.off("unreadCountUpdate");
        socket.off("rideAccepted");
        socket.off("bookingCancelledByDriver");
        socket.off("bookingCancelledByUser");
      }
    };
  }, []);

  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDriverAssigned, setIsDriverAssigned] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [activeTab, setActiveTab] = useState("Home");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [mapRegion, setMapRegion] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'source' | 'destination' | null>(null);
  const [sourceSelection, setSourceSelection] = useState<{start: number, end: number} | undefined>(undefined);
  const [destSelection, setDestSelection] = useState<{start: number, end: number} | undefined>(undefined);
  const [sourceCoords, setSourceCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const fetchCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast("Permission Denied", "Location permission is required.", "error");
        setIsLoadingLocation(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      
      setSourceCoords({ lat: latitude.toString(), lon: longitude.toString() });
      setPickupCoords({ latitude, longitude });
      setMapRegion({ latitude, longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 });

      const res = await locationAPI.reverseGeocode(latitude, longitude);
      if (res.data?.success && res.data.data?.display_name) {
        setSource(res.data.data.display_name);
        setSourceSelection({ start: 0, end: 0 }); // show address from start, not tail
      }
    } catch (err: any) {
      showToast("Error", "Could not fetch current address.", "error");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  useEffect(() => {
    if (sourceCoords) {
      const sLat = parseFloat(sourceCoords.lat);
      const sLon = parseFloat(sourceCoords.lon);
      setPickupCoords({ latitude: sLat, longitude: sLon });

      if (destCoords) {
        const dLat = parseFloat(destCoords.lat);
        const dLon = parseFloat(destCoords.lon);
        setDropCoords({ latitude: dLat, longitude: dLon });
      } else {
        setRouteCoords([]);
        setDropCoords(null);
      }
    } else {
      setRouteCoords([]);
      setPickupCoords(null);
      setDropCoords(null);
    }
  }, [sourceCoords, destCoords]);

  const clearBookingState = () => {
    setIsSearching(false);
    setIsDriverAssigned(false);
    setActiveBookingId(null);
    setAssignedDriver(null);
    setIsCancelling(false);
  };

  useEffect(() => {
    const query = activeInput === 'source' ? source : destination;
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const userLat = sourceCoords ? parseFloat(sourceCoords.lat) : undefined;
        const userLon = sourceCoords ? parseFloat(sourceCoords.lon) : undefined;
        const response = await locationAPI.getAutocomplete(query, userLat, userLon);
        setSuggestions(response.data.data);
      } catch (err) {}
    }, 500);

    return () => clearTimeout(timer);
  }, [source, destination, activeInput, sourceCoords]);

  useEffect(() => {
    let backPressCount = 0;
    const backAction = () => {
      if (activeTab !== "Home") {
        setActiveTab("Home");
        return true;
      }
      if (backPressCount === 0) {
        backPressCount++;
        if (Platform.OS === 'android') ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        setTimeout(() => { backPressCount = 0; }, 2000);
        return true;
      } else {
        BackHandler.exitApp();
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'Activity') {
      router.push({ pathname: '/screens/HistoryScreen' });
      setActiveTab('Home');
    }
  }, [activeTab]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // ─── DYNAMIC HEADER HEIGHT ────────────────────────────────────────────────
  // We measure the actual rendered yellow header via onLayout so the white card
  // overlap is always pixel-perfect regardless of phone size, notch height, or
  // OS font scaling. CARD_OVERLAP is how many px the white card visually
  // "bites into" the yellow section.
  const CARD_OVERLAP = isSmallPhone ? 36 : 52;
  // Fallback while layout hasn't fired yet (prevents flicker)
  const headerHeight = headerMeasuredHeight > 0 ? headerMeasuredHeight : (isSmallPhone ? 220 : 250);

  // Headline fade-out: starts fading after 20px scroll, fully gone by 80px
  const headlineFade = scrollY.interpolate({
    inputRange: [0, 20, 80],
    outputRange: [1, 0.6, 0],
    extrapolate: 'clamp',
  });
  // Headline also blurs upward slightly as it fades
  const headlineTranslate = scrollY.interpolate({
    inputRange: [0, 80],
    outputRange: [0, -12],
    extrapolate: 'clamp',
  });

  const insets = useSafeAreaInsets();

  const TabItem = ({ name, icon, label }: { name: string, icon: any, label: string }) => (
    <TouchableOpacity
      className="items-center justify-center pt-2 w-1/4"
      onPress={() => {
        if (name === "Schedule") {
          router.push({ pathname: "/screens/BookingScreen", params: { mode: 'schedule' } });
          return;
        }
        if (name === "Activity" || name === "History") {
          router.push({ pathname: "/screens/HistoryScreen" });
          return;
        }
        setActiveTab(name);
      }}
    >
      <Ionicons name={activeTab === name ? icon : `${icon}-outline`} size={24} color={activeTab === name ? "#1E293B" : "#94A3B8"} />
      <Text maxFontSizeMultiplier={1.2} className={`text-[11px] font-bold mt-1 ${activeTab === name ? "text-slate-800" : "text-slate-400"}`}>{label}</Text>
      {activeTab === name && <View className="w-1 h-1 rounded-full bg-slate-800 mt-1" />}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#ffffff' }}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {activeTab === "Home" && (
        <>
          {/*
           * ─── FIX EXPLAINED ────────────────────────────────────────────────────
           * ROOT CAUSE: On Android, KeyboardAvoidingView with behavior="height"/
           * undefined causes the parent View to shrink, dragging the yellow header
           * DOWN and making the white card (which only has a negative marginTop)
           * appear to slide BEHIND the yellow section.
           *
           * THE FIX:
           * 1. The yellow header is `position: 'absolute'` with zIndex: 0 / elevation: 0.
           *    It can NEVER push anything. It is purely a painted background layer.
           * 2. The ScrollView fills the entire screen (flex:1) and sits above the
           *    header in z-order (zIndex: 10, elevation: 10).
           * 3. The ScrollView has a paddingTop equal to (HEADER_VISIBLE_HEIGHT - CARD_OVERLAP).
           *    This creates the visual gap for the yellow header to show through, while
           *    the white card then "overlaps" it by CARD_OVERLAP pixels.
           * 4. KeyboardAvoidingView is REMOVED entirely. On Android it is the #1
           *    cause of this bug. ScrollView with keyboardShouldPersistTaps="handled"
           *    handles all keyboard interactions correctly without layout shifts.
           * ──────────────────────────────────────────────────────────────────────
           */}

          {/* ── LAYER 1: Yellow Header — absolute, always behind everything ── */}
          <View
            onLayout={(e) => {
              const h = e.nativeEvent.layout.height;
              if (h > 0) setHeaderMeasuredHeight(h);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFD700',
              borderBottomLeftRadius: isSmallPhone ? 36 : 50,
              borderBottomRightRadius: isSmallPhone ? 36 : 50,
              zIndex: 0,
              elevation: 0,
              overflow: 'hidden',
              // Add bottom padding so rounded edge + card overlap area is always visible
              paddingBottom: CARD_OVERLAP + 8,
            }}
          >
            {/* Subtle white oval glow at bottom of header */}
            <View
              style={{
                position: 'absolute',
                bottom: '-20%',
                alignSelf: 'center',
                width: '150%',
                height: '20%',
                backgroundColor: 'white',
                borderRadius: 999,
                opacity: 0.1,
                transform: [{ scaleX: 1.3 }],
              }}
            />

            <SafeAreaView style={{ paddingHorizontal: isSmallPhone ? 16 : 24, paddingTop: 4 }}>
              {/* Top row: greeting + notification bell */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 13, color: '#1E293B', fontWeight: '500', opacity: 0.7 }}>Hello,</Text>
                  <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 18, color: '#1E293B', fontWeight: '900', letterSpacing: -0.5 }}>{displayName}</Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: 'white',
                    padding: 12,
                    borderRadius: 999,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 3,
                    position: 'relative',
                  }}
                  onPress={() => router.push("/screens/NotificationsScreen")}
                >
                  <Ionicons name="notifications-outline" size={24} color="#1E293B" />
                  {unreadCount > 0 && (
                    <View style={{
                      position: 'absolute', top: 8, right: 8,
                      backgroundColor: '#EF4444',
                      borderRadius: 999, width: 12, height: 12,
                      borderWidth: 1.5, borderColor: 'white',
                    }} />
                  )}
                </TouchableOpacity>
              </View>

              {/* Headline — fades + slides up as user scrolls */}
              <Animated.View
                style={{
                  marginTop: isSmallPhone ? 14 : 20,
                  opacity: headlineFade,
                  transform: [{ translateY: headlineTranslate }],
                }}
              >
                <Text
                  maxFontSizeMultiplier={1.1}
                  style={{
                    fontSize: isSmallPhone ? 24 : 28,
                    lineHeight: isSmallPhone ? 30 : 36,
                    fontWeight: '900',
                    color: '#1E293B',
                    fontStyle: 'italic',
                  }}
                >
                  {`Where are you\ngoing today?`}
                </Text>
              </Animated.View>
            </SafeAreaView>
          </View>

          {/* ── LAYER 2: Scrollable content — sits ON TOP of the yellow header ── */}
          <Animated.ScrollView
            ref={scrollViewRef}
            style={{ flex: 1, zIndex: 10, elevation: 10 }}
            contentContainerStyle={{
              // Dynamic: measured header height minus overlap = correct card start position
              paddingTop: headerHeight > 0 ? headerHeight - CARD_OVERLAP : (isSmallPhone ? 180 : 210),
              paddingHorizontal: isSmallPhone ? 16 : 24,
              paddingBottom: 120,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
            scrollEventThrottle={16}
          >
            {/* ── WHITE SEARCH CARD ── */}
            <Animated.View
              style={[
                {
                  backgroundColor: 'white',
                  borderRadius: 35,
                  padding: isSmallPhone ? 16 : 24,
                  borderWidth: 1,
                  borderColor: '#F8FAFC',
                  // Android: elevation creates drop shadow AND puts this above header (elevation:0)
                  elevation: 12,
                  // iOS shadow
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.10,
                  shadowRadius: 20,
                  // Ensure it's above the yellow layer on both platforms
                  zIndex: 100,
                },
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              {/* ── SOURCE INPUT ── */}
              <View style={{ marginBottom: 16 }}>
                <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 11, fontWeight: '900', color: '#3B82F6', marginBottom: 8, marginLeft: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  From where
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 2,
                    borderColor: activeInput === 'source' ? '#3B82F6' : '#F1F5F9',
                  }}
                >
                  <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#3B82F6', marginRight: 12 }} />
                  <TextInput
                    maxFontSizeMultiplier={1.2}
                    style={{ flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '700', textAlign: 'left' }}
                    placeholder="Current Location"
                    placeholderTextColor="#94A3B8"
                    value={source}
                    selection={sourceSelection}
                    onChangeText={(txt) => {
                      setSource(txt);
                      setActiveInput('source');
                      setSourceSelection(undefined); // free cursor when user is typing
                    }}
                    onFocus={() => {
                      setActiveInput('source');
                      setSourceSelection({ start: 0, end: 0 }); // jump to start on focus
                    }}
                    onSelectionChange={() => setSourceSelection(undefined)} // release after first render
                    textAlignVertical="center"
                    selectTextOnFocus={false}
                  />
                  {source.length > 0 && (
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => { setSource(""); setSourceCoords(null); setSuggestions([]); }}>
                      <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Use Current Location shortcut */}
                {activeInput === 'source' && (
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 14,
                      borderWidth: 1,
                      borderColor: '#EFF6FF',
                      marginTop: 8,
                      backgroundColor: '#EFF6FF',
                      borderRadius: 16,
                    }}
                    onPress={() => {
                      fetchCurrentLocation();
                      setSuggestions([]);
                      setActiveInput(null);
                      Keyboard.dismiss();
                    }}
                  >
                    <Ionicons name="navigate-outline" size={20} color="#3B82F6" />
                    <Text maxFontSizeMultiplier={1.2} style={{ color: '#3B82F6', fontSize: 15, fontWeight: '700', marginLeft: 12, flex: 1 }}>
                      Use Current Location
                    </Text>
                    {isLoadingLocation && <ActivityIndicator size="small" color="#3B82F6" />}
                  </TouchableOpacity>
                )}

                {/* Source suggestions */}
                {suggestions.length > 0 && activeInput === 'source' && (
                  <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 8, marginTop: 8, borderWidth: 1, borderColor: '#F1F5F9', maxHeight: 180, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {suggestions.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}
                          onPress={() => {
                            setSource(item.display_name);
                            setSourceCoords({ lat: item.lat, lon: item.lon });
                            setSourceSelection({ start: 0, end: 0 }); // force text to show from start
                            setSuggestions([]);
                            setActiveInput(null);
                            Keyboard.dismiss();
                          }}
                        >
                          <Ionicons name="pin-outline" size={18} color="#64748B" />
                          <Text maxFontSizeMultiplier={1.2} style={{ color: '#334155', fontSize: 14, fontWeight: '500', marginLeft: 12, flex: 1 }} numberOfLines={1}>
                            {item.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* Subtle divider between inputs (no dashed line per requirements) */}
              <View style={{ height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 4, marginBottom: 16 }} />

              {/* ── DESTINATION INPUT ── */}
              <View style={{ marginBottom: 8 }}>
                <Text maxFontSizeMultiplier={1.2} style={{ fontSize: 11, fontWeight: '900', color: '#F97316', marginBottom: 8, marginLeft: 4, letterSpacing: 1.5, textTransform: 'uppercase' }}>
                  Where to go
                </Text>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: 'white',
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    borderWidth: 2,
                    borderColor: activeInput === 'destination' ? '#F97316' : '#F1F5F9',
                  }}
                >
                  <Ionicons name="location" size={20} color="#F97316" style={{ marginRight: 12 }} />
                  <TextInput
                    maxFontSizeMultiplier={1.2}
                    style={{ flex: 1, fontSize: 15, color: '#1E293B', fontWeight: '700', textAlign: 'left' }}
                    placeholder="Enter Destination"
                    placeholderTextColor="#94A3B8"
                    value={destination}
                    selection={destSelection}
                    onChangeText={(txt) => {
                      setDestination(txt);
                      setActiveInput('destination');
                      setDestSelection(undefined); // free cursor when user is typing
                    }}
                    onFocus={() => {
                      setActiveInput('destination');
                      setDestSelection({ start: 0, end: 0 }); // jump to start on focus
                    }}
                    onSelectionChange={() => setDestSelection(undefined)}
                    textAlignVertical="center"
                    selectTextOnFocus={false}
                  />
                  {destination.length > 0 && (
                    <TouchableOpacity style={{ padding: 4 }} onPress={() => { setDestination(""); setDestCoords(null); setSuggestions([]); }}>
                      <Ionicons name="close-circle" size={20} color="#CBD5E1" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Destination suggestions */}
                {suggestions.length > 0 && activeInput === 'destination' && (
                  <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 8, marginTop: 8, marginBottom: 8, borderWidth: 1, borderColor: '#F1F5F9', maxHeight: 180, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, zIndex: 20 }}>
                    <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                      {suggestions.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: idx < suggestions.length - 1 ? 1 : 0, borderBottomColor: '#F1F5F9' }}
                          onPress={() => {
                            setDestination(item.display_name);
                            setDestCoords({ lat: item.lat, lon: item.lon });
                            setDestSelection({ start: 0, end: 0 }); // force text to show from start
                            setSuggestions([]);
                            setActiveInput(null);
                            Keyboard.dismiss();
                          }}
                        >
                          <Ionicons name="pin-outline" size={18} color="#64748B" />
                          <Text maxFontSizeMultiplier={1.2} style={{ color: '#334155', fontSize: 14, fontWeight: '500', marginLeft: 12, flex: 1 }} numberOfLines={1}>
                            {item.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* ── SEARCH RIDE BUTTON ── */}
              <TouchableOpacity
                style={{
                  backgroundColor: '#1E293B',
                  paddingVertical: 16,
                  borderRadius: 18,
                  alignItems: 'center',
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: 8,
                }}
                activeOpacity={0.8}
                onPress={async () => {
                  Keyboard.dismiss();
                  if (destination.trim() && sourceCoords && destCoords) {
                    try {
                      const res = await locationAPI.calculateDistanceAndRecommend(
                        Number(sourceCoords.lat), Number(sourceCoords.lon),
                        Number(destCoords.lat), Number(destCoords.lon)
                      );

                      const { distanceKm, recommendation } = res.data.data;

                      if (recommendation === 'cab') {
                        router.push({
                          pathname: "/screens/BookingScreen",
                          params: {
                            pickup: source,
                            drop: destination,
                            pLat: sourceCoords.lat,
                            pLon: sourceCoords.lon,
                            dLat: destCoords.lat,
                            dLon: destCoords.lon,
                            dist: distanceKm.toString()
                          }
                        });
                      } else {
                        router.push({
                          pathname: "/screens/OutstationBookingScreen",
                          params: {
                            pickup: source,
                            drop: destination,
                            pLat: sourceCoords.lat,
                            pLon: sourceCoords.lon,
                            dLat: destCoords.lat,
                            dLon: destCoords.lon,
                            dist: distanceKm.toString()
                          }
                        });
                      }
                    } catch (err: any) {
                      const errorMessage = err.message || err.response?.data?.message || "";
                      const existingBookingId = err.bookingId || err.response?.data?.bookingId;

                      if (errorMessage.includes("already have an active ride") && existingBookingId) {
                        Alert.alert(
                          "Active Ride Found",
                          "You have a ride in progress. Do you want to view it or cancel it?",
                          [
                            { text: "Close", style: "cancel" },
                            {
                              text: "Cancel Request",
                              style: "destructive",
                              onPress: async () => {
                                try {
                                  await bookingAPI.cancelBooking(existingBookingId);
                                  showToast("Success", "Ride request cancelled.", "success");
                                } catch (cancelErr) {
                                  showToast("Error", "Failed to cancel. Try viewing the ride instead.", "error");
                                }
                              }
                            },
                            {
                              text: "View Ride",
                              onPress: () => {
                                setActiveBookingId(existingBookingId);
                                router.push({
                                  pathname: "/screens/LiveRideTrackingScreen",
                                  params: {
                                    bookingId: existingBookingId,
                                    pLat: err.response?.data?.booking?.pickupLatitude || '',
                                    pLon: err.response?.data?.booking?.pickupLongitude || '',
                                    dLat: err.response?.data?.booking?.dropLatitude || '',
                                    dLon: err.response?.data?.booking?.dropLongitude || ''
                                  }
                                });
                              }
                            }
                          ]
                        );
                      } else {
                        showToast("Error", "Failed to calculate distance. Try again.", "error");
                      }
                    }
                  } else if (!destination.trim()) {
                    if (Platform.OS === 'android') {
                      ToastAndroid.show("Please enter a destination", ToastAndroid.SHORT);
                    }
                  } else {
                    alert("Please select locations from the search suggestions.");
                  }
                }}
              >
                <Text maxFontSizeMultiplier={1.2} style={{ color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 }}>Search Ride</Text>
                <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>

            {/* ── QUICK ACCESS BUTTONS ── */}
            <Animated.View style={{ marginTop: 28, marginBottom: 16, opacity: fadeAnim }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    padding: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    marginRight: 8,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                  onPress={() => {
                    if (Platform.OS === 'android') ToastAndroid.show("Start a Trip", ToastAndroid.SHORT);
                  }}
                >
                  <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 999, marginBottom: 8 }}>
                    <Ionicons name="car" size={24} color="#1E293B" />
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ color: '#1E293B', fontWeight: '800', fontSize: 12 }}>Trip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    padding: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    marginHorizontal: 4,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                  onPress={() => {
                    if (Platform.OS === 'android') ToastAndroid.show("Book Intercity", ToastAndroid.SHORT);
                  }}
                >
                  <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 999, marginBottom: 8 }}>
                    <Ionicons name="map" size={24} color="#1E293B" />
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ color: '#1E293B', fontWeight: '800', fontSize: 12 }}>Intercity</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    backgroundColor: 'white',
                    padding: 16,
                    borderRadius: 20,
                    alignItems: 'center',
                    marginLeft: 8,
                    borderWidth: 1,
                    borderColor: '#F1F5F9',
                    elevation: 2,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 4,
                  }}
                  onPress={() => {
                    router.push({ pathname: "/screens/BookingScreen", params: { mode: 'schedule' } });
                  }}
                >
                  <View style={{ backgroundColor: '#F8FAFC', padding: 12, borderRadius: 999, marginBottom: 8 }}>
                    <Ionicons name="calendar" size={24} color="#1E293B" />
                  </View>
                  <Text maxFontSizeMultiplier={1.2} style={{ color: '#1E293B', fontWeight: '800', fontSize: 12 }}>Reserve</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.ScrollView>
        </>
      )}

      {activeTab === "Profile" && <ProfileScreen />}

      {activeTab === "Activity" && (
        <ActivitySection onBookRide={() => setActiveTab("Home")} />
      )}

      {/* Bottom Tab Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          width: '100%',
          backgroundColor: 'white',
          flexDirection: 'row',
          justifyContent: 'space-around',
          alignItems: 'center',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          paddingBottom: Math.max(insets.bottom, 20),
          paddingTop: 10,
          elevation: 25,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          zIndex: 50,
        }}
      >
        <TabItem name="Home" icon="home" label="Home" />
        <TabItem name="Schedule" icon="calendar" label="Ride" />
        <TabItem name="Activity" icon="list" label="History" />
        <TabItem name="Profile" icon="person" label="Profile" />
      </View>

      {/* Ride Searching Overlay */}
      <SearchingRideOverlay
        isVisible={isSearching}
        onCancel={async () => {
          if (isCancelling) return;
          setIsCancelling(true);
          if (activeBookingId) {
            try {
              await bookingAPI.cancelBooking(activeBookingId);
            } catch (err) {}
          }
          clearBookingState();
        }}
        pickupLocation={source || "Current Location"}
        dropLocation={destination || "Select Destination"}
        rideMode="Standard"
      />

      {/* Driver Assigned Overlay */}
      <DriverAssignedOverlay
        isVisible={isDriverAssigned}
        onClose={() => {
          setIsDriverAssigned(false);
          setActiveBookingId(null);
        }}
        onCallDriver={() => {
          if (assignedDriver?.mobile) {
            const { Linking } = require("react-native");
            Linking.openURL(`tel:${assignedDriver.mobile}`);
          }
        }}
        onCancel={async () => {
          if (isCancelling) return;
          setIsCancelling(true);
          if (activeBookingId) {
            try {
              await bookingAPI.cancelBooking(activeBookingId);
            } catch (err) {}
          }
          clearBookingState();
        }}
        driverName={assignedDriver?.name}
        carModel={assignedDriver?.vehicleModel}
        carNumber={assignedDriver?.vehicleNumber}
        rating={assignedDriver?.rating?.toString()}
        profileImage={assignedDriver?.profileImage}
        onBookRide={() => {
          setIsDriverAssigned(false);
          router.push({
            pathname: "/screens/LiveRideTrackingScreen",
            params: {
              bookingId: activeBookingId,
              pLat: assignedDriver?.pickupLatitude || '',
              pLon: assignedDriver?.pickupLongitude || '',
              dLat: assignedDriver?.dropLatitude || '',
              dLon: assignedDriver?.dropLongitude || ''
            }
          });
        }}
      />
    </View>
  );
};

export default HomeScreen;