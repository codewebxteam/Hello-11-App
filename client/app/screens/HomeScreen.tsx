import React, { useState, useEffect, useRef } from "react";
import {
  Text,
  View,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  ScrollView,
  Platform,
  Animated,
  KeyboardAvoidingView,
  Keyboard,
  BackHandler,
  ToastAndroid,
  Alert,
  ActivityIndicator,
  AppState
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { registerForPushNotificationsAsync, sendLocalNotification } from "../../utils/notifications";
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
  const params = useLocalSearchParams();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("User");
  const [assignedDriver, setAssignedDriver] = useState<any>(null);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user: authUser, refreshProfile } = useAuth();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        if (authUser) {
          console.log("[Home] fetchUser: using authUser", authUser.name);
          setDisplayName(authUser.name || "User");
        } else {
          console.log("[Home] fetchUser: authUser missing, triggering refresh...");
          await refreshProfile();
        }

        const userData = authUser;
        if (!userData) {
          console.warn("Home: No user data available for socket connection");
          return;
        }

        // Initialize Socket and join user room
        const { initSocket } = require("../../utils/socket");
        const socket = await initSocket();

        socket.on("connect", () => {
          console.log("Socket connected, joining user room:", userData._id || userData.id);
          socket.emit("join", userData._id || userData.id);
        });

        if (socket.connected) {
          socket.emit("join", userData._id || userData.id);
        }

        socket.on("rideAccepted", (data: any) => {
          console.log("RIDE ACCEPTED:", data);
          const booking = data?.booking || {};
          const isScheduled = booking.bookingType === "schedule";
          const scheduledTime = booking.scheduledDate ? new Date(booking.scheduledDate).getTime() : null;
          const isFutureScheduled = isScheduled && !!scheduledTime && scheduledTime > Date.now();
          const isRideReadyNow = booking.scheduledRideReady === true || !isFutureScheduled;

          setAssignedDriver(booking.driver || null);
          setActiveBookingId(booking.id || null);
          setIsSearching(false);

          if (!isRideReadyNow) {
            sendLocalNotification(
              "Driver Assigned For Scheduled Ride",
              `Driver ${booking?.driver?.name || ""} assigned. Ride will start at scheduled time.`
            );
            return;
          }

          sendLocalNotification(
            "Ride Accepted",
            `${booking?.driver?.name || "Driver"} is on the way in a ${booking?.driver?.vehicleModel || "car"}`
          );

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

        socket.on("bookingCancelledByDriver", (data: any) => {
          console.log("Booking cancelled by driver:", data);
          sendLocalNotification("Ride Cancelled", "The driver has cancelled your ride request.");
          clearBookingState();
        });

        socket.on("bookingCancelledByUser", (data: any) => {
          console.log("Booking cancelled by user (sync):", data);
          clearBookingState();
        });

        socket.on("newNotification", (data: any) => {
          console.log("NEW NOTIFICATION RECEIVED:", data);
          // Sync with real unread count from backend if available
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          } else {
            setUnreadCount(prev => prev + 1);
          }
          // Show toast for critical ride notifications
          if (data.notification.type.startsWith('ride_')) {
            const toastType =
              data.notification.type === 'ride_cancelled'
                ? 'error'
                : data.notification.type === 'ride_completed' || data.notification.type === 'ride_accepted'
                  ? 'success'
                  : 'info';
            showToast(data.notification.title, data.notification.body, toastType as any);
            sendLocalNotification(data.notification.title, data.notification.body);
          }
        });

        socket.on("unreadCountUpdate", (data: any) => {
          console.log("UNREAD COUNT SYNC:", data);
          if (data.unreadCount !== undefined) {
            setUnreadCount(data.unreadCount);
          }
        });

        // Initial unread count fetch
        try {
          const notifRes = await notificationAPI.getNotifications();
          setUnreadCount(notifRes.data.unreadCount || 0);
        } catch (e) {
          console.log("Unread count fetch error", e);
        }

        // Register for push notifications
        try {
          const token = await registerForPushNotificationsAsync();
          if (token) {
            await userAPI.updateProfile({ pushToken: token });
            console.log("Push token registered successfully");
          }
        } catch (tokenErr) {
          console.log("Push token registration failed", tokenErr);
        }

        // --- RIDE PERSISTENCE ---
        await checkActiveBooking();

      } catch (err) {
        console.error("Home: fetch profile or socket error", err);
      }
    };

    const checkActiveBooking = async () => {
      try {
        const res = await bookingAPI.getActiveBooking();
        if (res.data.success && res.data.booking) {
          const b = res.data.booking;
          console.log("ACTIVE BOOKING FOUND (Persistence):", b._id, b.status);

          // Redirect to Live Ride Tracking screen
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
      } catch (err) {
        console.error("Persistence check error:", err);
      }
    };

    fetchUser();
    fetchCurrentLocation();

    // AppState listener for background/foreground persistence
    const subscription = AppState.addEventListener("change", nextAppState => {
      if (nextAppState === "active") {
        console.log("App foregrounded - checking for active ride");
        checkActiveBooking();
      }
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

  // Map state
  const [mapRegion, setMapRegion] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const [pickupCoords, setPickupCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [dropCoords, setDropCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [activeInput, setActiveInput] = useState<'source' | 'destination' | null>(null);
  const [sourceCoords, setSourceCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: string; lon: string } | null>(null);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);


  // Function to fetch current location and reverse geocode
  const fetchCurrentLocation = async () => {
    try {
      setIsLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        showToast("Permission Denied", "Location permission is required to fetch current address.", "error");
        setIsLoadingLocation(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;
      setSourceCoords({ lat: latitude.toString(), lon: longitude.toString() });
      setPickupCoords({ latitude, longitude });
      setMapRegion({
        latitude,
        longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });

      const res = await locationAPI.reverseGeocode(latitude, longitude);
      if (res.data?.success && res.data.data?.display_name) {
        setSource(res.data.data.display_name);
      }
    } catch (err: any) {
      console.error("Fetch Location Error", err);
      showToast("Error", "Could not fetch current address.", "error");
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Update map whenever source/dest coords change
  useEffect(() => {
    if (sourceCoords) {
      const sLat = parseFloat(sourceCoords.lat);
      const sLon = parseFloat(sourceCoords.lon);
      setPickupCoords({ latitude: sLat, longitude: sLon });

      if (destCoords) {
        const dLat = parseFloat(destCoords.lat);
        const dLon = parseFloat(destCoords.lon);
        setDropCoords({ latitude: dLat, longitude: dLon });
        // Fit map to show both points
        const midLat = (sLat + dLat) / 2;
        const midLon = (sLon + dLon) / 2;
        setMapRegion({
          latitude: midLat,
          longitude: midLon,
          latitudeDelta: Math.abs(sLat - dLat) * 2.2 + 0.02,
          longitudeDelta: Math.abs(sLon - dLon) * 2.2 + 0.02,
        });
        // Fetch driving route
        locationAPI.getDirections(sLat, sLon, dLat, dLon)
          .then((res) => {
            if (res.data?.data?.geometry?.coordinates) {
              const coords = res.data.data.geometry.coordinates
                .filter((c: any) => Array.isArray(c) && c.length >= 2)
                .map((c: any) => ({ latitude: Number(c[1]), longitude: Number(c[0]) }));
              if (coords.length > 0) setRouteCoords(coords);
            }
          })
          .catch(() => { });
      } else {
        // Only source selected — show pickup pin, clear route/drop
        setRouteCoords([]);
        setDropCoords(null);
        setMapRegion((prev: any) => prev ?? {
          latitude: sLat,
          longitude: sLon,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
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

  // Debounced search logic
  useEffect(() => {
    const query = activeInput === 'source' ? source : destination;
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        // Pass user location so backend restricts to India and biases to 50km radius
        const userLat = sourceCoords ? parseFloat(sourceCoords.lat) : undefined;
        const userLon = sourceCoords ? parseFloat(sourceCoords.lon) : undefined;
        const response = await locationAPI.getAutocomplete(query, userLat, userLon);
        setSuggestions(response.data.data);
      } catch (err) {
        console.error("Autocomplete error", err);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [source, destination, activeInput, sourceCoords]);

  // --- DOUBLE BACK PRESS TO EXIT LOGIC ---
  useEffect(() => {
    let backPressCount = 0;

    const backAction = () => {
      if (activeTab !== "Home") {
        setActiveTab("Home");
        return true;
      }

      if (backPressCount === 0) {
        backPressCount++;
        if (Platform.OS === 'android') {
          ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
        }

        setTimeout(() => {
          backPressCount = 0;
        }, 2000);
        return true;
      } else {
        BackHandler.exitApp();
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [activeTab]);

  // If activeTab becomes 'Activity' (e.g., from deep-link or previous state),
  // redirect to the unified History screen to keep UX consistent.
  useEffect(() => {
    if (activeTab === 'Activity') {
      router.push({ pathname: '/screens/HistoryScreen' });
      setActiveTab('Home');
    }
  }, [activeTab]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: Platform.OS !== 'web' }),
    ]).start();
  }, []);

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const hideSub = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleFocus = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 120, animated: true });
    }, 100);
  };

  const TabItem = ({ name, icon, label }: { name: string, icon: any, label: string }) => (
    <TouchableOpacity
      className="items-center justify-center pt-2 w-1/4"
      onPress={() => {
        if (name === "Schedule") {
          router.push({ pathname: "/screens/BookingScreen", params: { mode: 'schedule' } });
          return;
        }

        // Open unified History screen when History/Activity tab is tapped
        if (name === "Activity" || name === "History") {
          router.push({ pathname: "/screens/HistoryScreen" });
          return;
        }

        setActiveTab(name);
      }}
    >
      <Ionicons
        name={activeTab === name ? icon : `${icon}-outline`}
        size={24}
        color={activeTab === name ? "#1E293B" : "#94A3B8"}
      />
      <Text className={`text-[11px] font-bold mt-1 ${activeTab === name ? "text-slate-800" : "text-slate-400"}`}>
        {label}
      </Text>
      {activeTab === name && <View className="w-1 h-1 rounded-full bg-slate-800 mt-1" />}
    </TouchableOpacity>
  );

  const insets = useSafeAreaInsets();

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {activeTab === "Home" && (
        <>
          <View className={`${isSmallPhone ? 'min-h-[320px] rounded-b-[36px] pb-8' : 'min-h-[350px] rounded-b-[50px] pb-10'} bg-[#FFD700] z-10 relative overflow-hidden`}>
            <View className="absolute -bottom-[20%] self-center w-[150%] h-[20%] bg-white rounded-[100%] scale-x-[1.3] opacity-10" />

            <SafeAreaView className={`flex-1 ${isSmallPhone ? 'px-4 pt-1' : 'px-6 pt-1'}`}>
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-base text-slate-800 font-medium opacity-70">Hello,</Text>
                  <Text className="text-3xl text-slate-800 font-black tracking-tight">{displayName}</Text>
                </View>
                <TouchableOpacity
                  className="bg-white p-3 rounded-full shadow-sm elevation-3 relative"
                  onPress={() => router.push("/screens/NotificationsScreen")}
                >
                  <Ionicons name="notifications-outline" size={24} color="#1E293B" />
                  {unreadCount > 0 && (
                    <View className="absolute top-2 right-2 bg-red-500 rounded-full min-w-[18px] h-[18px] items-center justify-center border-2 border-white px-1">
                      <Text className="text-white text-[9px] font-black">{unreadCount}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View className={`${isSmallPhone ? 'mt-5' : 'mt-8'}`}>
                <Text className={`${isSmallPhone ? 'text-[32px] leading-9' : 'text-4xl leading-[44px]'} font-black text-slate-800 italic`}>Where are you{"\n"}going today?</Text>
                <Text className="text-base text-slate-800 mt-3 mb-5 font-semibold opacity-75">Book your ride with Hello11</Text>
              </View>
            </SafeAreaView>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            className={`flex-1 z-20 ${isSmallPhone ? '-mt-12' : '-mt-16'}`}
          >
            <ScrollView
              ref={scrollViewRef}
              contentContainerClassName={`${isSmallPhone ? 'px-4' : 'px-6'} ${isKeyboardVisible ? 'pb-56' : 'pb-32'}`}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            >
              <Animated.View
                className={`bg-white rounded-[35px] ${isSmallPhone ? 'p-4' : 'p-6'} shadow-2xl shadow-slate-300 border border-slate-50 z-50 elevation-10`}
                style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
              >
                <View className="mb-4">
                  <View className="flex-row items-center mb-2.5">
                    <View className="w-8 items-center">
                      <View className="w-2.5 h-2.5 rounded-full bg-blue-500 border-2 border-blue-200" />
                      <View className="w-[2px] h-9 bg-slate-200 my-1 border-dashed" />
                    </View>
                    <View className="flex-1 ml-3 border-b border-slate-100 pb-2">
                      <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">From where</Text>
                      <TextInput
                        className="text-base text-slate-800 font-semibold mt-0.5"
                        placeholder="Current Location"
                        placeholderTextColor="#94A3B8"
                        value={source}
                        onChangeText={(txt) => {
                          setSource(txt);
                          setActiveInput('source');
                        }}
                        onFocus={() => {
                          handleFocus();
                          setActiveInput('source');
                        }}
                      />
                    </View>
                  </View>

                  <View className="flex-row items-center mb-2.5">
                    <View className="w-8 items-center pt-1"><Ionicons name="location" size={20} color="#F97316" /></View>
                    <View className="flex-1 ml-3 border-b border-slate-100 pb-2">
                      <Text className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Where to go</Text>
                      <TextInput
                        className="text-base text-slate-800 font-semibold mt-0.5"
                        placeholder="Enter Destination"
                        placeholderTextColor="#94A3B8"
                        value={destination}
                        onChangeText={(txt) => {
                          setDestination(txt);
                          setActiveInput('destination');
                        }}
                        onFocus={() => {
                          handleFocus();
                          setActiveInput('destination');
                        }}
                      />
                    </View>
                  </View>

                  {suggestions.length > 0 && activeInput === 'destination' && (
                    <View className="bg-slate-50 rounded-2xl p-2 mt-2 mb-2 border border-slate-100 shadow-sm z-20">
                      {suggestions.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          className="flex-row items-center p-3 border-b border-slate-200/50 last:border-0"
                          onPress={() => {
                            setDestination(item.display_name);
                            setDestCoords({ lat: item.lat, lon: item.lon });
                            setSuggestions([]);
                            setActiveInput(null);
                            Keyboard.dismiss();
                          }}
                        >
                          <Ionicons name="pin-outline" size={16} color="#64748B" />
                          <Text className="text-slate-700 text-sm font-medium ml-3 flex-1" numberOfLines={1}>
                            {item.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Hints / Suggestions List */}
                  {activeInput === 'source' && (
                    <TouchableOpacity
                      className="flex-row items-center p-3 border-b border-slate-200/50 bg-blue-50/50 rounded-t-xl"
                      onPress={() => {
                        fetchCurrentLocation();
                        setSuggestions([]);
                        setActiveInput(null);
                        Keyboard.dismiss();
                      }}
                    >
                      <Ionicons name="navigate-outline" size={16} color="#3B82F6" />
                      <Text className="text-blue-600 text-sm font-bold ml-3 flex-1">
                        Use Current Location
                      </Text>
                      {isLoadingLocation && <ActivityIndicator size="small" color="#3B82F6" />}
                    </TouchableOpacity>
                  )}

                  {suggestions.length > 0 && activeInput === 'source' && (
                    <View className="bg-slate-50 rounded-2xl p-2 mt-2 border border-slate-100 shadow-sm">
                      {suggestions.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          className="flex-row items-center p-3 border-b border-slate-200/50 last:border-0"
                          onPress={() => {
                            setSource(item.display_name);
                            setSourceCoords({ lat: item.lat, lon: item.lon });
                            setSuggestions([]);
                            setActiveInput(null);
                            Keyboard.dismiss();
                          }}
                        >
                          <Ionicons name="pin-outline" size={16} color="#64748B" />
                          <Text className="text-slate-700 text-sm font-medium ml-3 flex-1" numberOfLines={1}>
                            {item.display_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  className="bg-slate-800 py-4 rounded-[18px] items-center flex-row justify-center active:opacity-90"
                  activeOpacity={0.8}
                  onPress={async () => {
                    Keyboard.dismiss();
                    if (destination.trim() && sourceCoords && destCoords) {
                      try {
                        const res = await locationAPI.calculateDistanceAndRecommend(
                          parseFloat(sourceCoords.lat), parseFloat(sourceCoords.lon),
                          parseFloat(destCoords.lat), parseFloat(destCoords.lon)
                        );

                        const { distanceKm, recommendation } = res.data.data;

                        if (recommendation === 'cab') {
                          // Instead of creating booking immediately, redirect to BookingScreen
                          // so the user can see Fare and Distance before confirmation.
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
                          // Redirect to Outstation/Rental with pre-filled coords
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
                        console.error("Home Search Error", err);
                        // API interceptor returns 'data' directly on error, so err is the response body
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
                                    console.error("Cancel Error:", cancelErr);
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
                          showToast("Error", "Failed to calculate distance or create booking. Try again.", "error");
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
                  <Text className="text-white text-lg font-extrabold tracking-wide">Search Ride</Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFF" style={{ marginLeft: 8 }} />
                </TouchableOpacity>

              </Animated.View>

              <Animated.View className="mt-8" style={[{ opacity: fadeAnim }]}>
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-black text-slate-800 italic tracking-tighter">Your Travel Feed</Text>
                </View>

                <View className="flex-row gap-4">
                  <View className="flex-1 bg-indigo-600 p-5 rounded-[35px] shadow-xl shadow-indigo-200 relative overflow-hidden">
                    <View className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full" />
                    <View className="bg-white/20 self-start p-2 rounded-2xl mb-3">
                      <Ionicons name="gift" size={22} color="#FFF" />
                    </View>
                    <Text className="text-white font-black text-lg mt-1 italic tracking-tighter">Round-Trip Joy</Text>
                    <Text className="text-white/90 text-[11px] font-bold mt-1">Grab a flat 50% discount on every return journey!</Text>
                  </View>

                  <View className="flex-1 bg-slate-900 p-5 rounded-[35px] shadow-xl shadow-slate-400 relative overflow-hidden">
                    <View className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/5 rounded-full" />
                    <View className="bg-white/10 self-start p-2 rounded-2xl mb-3">
                      <Ionicons name="time" size={22} color="#FFD700" />
                    </View>
                    <Text className="text-white font-black text-lg mt-1 italic tracking-tighter">Relax, We&apos;ll Wait</Text>
                    <Text className="text-white/90 text-[11px] font-bold mt-1">Enjoy 12 mins of complimentary wait time per KM.</Text>
                  </View>
                </View>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </>
      )}

      {activeTab === "Profile" && <ProfileScreen />}

      {activeTab === "Activity" && (
        <ActivitySection onBookRide={() => setActiveTab("Home")} />
      )}

      {/* Bottom Tab Bar */}
      <View
        className="absolute bottom-0 w-full bg-white flex-row justify-around items-center border-t border-slate-100 shadow-2xl elevation-[25] z-50"
        style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 10 }}
      >
        <TabItem name="Home" icon="home" label="Home" />
        <TabItem name="Activity" icon="list" label="History" />
        <TabItem name="Schedule" icon="calendar" label="Schedule" />
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
            } catch (err) {
              console.error("Searching cancel error:", err);
            }
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
            } catch (err) {
              console.error("Assigned cancel error:", err);
            }
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
