import React, { useState, useEffect, useRef } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
  Platform,
  Animated,
  Easing,
  Vibration,
  StatusBar as RNStatusBar,
  ToastAndroid,
  Image,
  AppState,
  ActivityIndicator,
  NativeModules
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { getImageUrl } from '../utils/imagekit';

import { initSocket, disconnectSocket } from '../utils/socket';
import { driverAPI } from '../utils/api';
import { getDriverToken } from '../utils/storage';
import MapView, { Marker, PROVIDER_GOOGLE } from '../utils/mapCompat';
import * as Location from 'expo-location';
import { registerForPushNotificationsAsync, sendLocalNotification } from '../utils/notifications';
import { useDriverAuth } from '../context/DriverAuthContext';
import RazorpayCheckout from 'react-native-razorpay';

import { Modal } from 'react-native';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [stats, setStats] = useState({ earnings: 0, trips: 0, name: '', rating: 0, profileImage: '' });
  const [location, setLocation] = useState<any>(null);
  const [region, setRegion] = useState<any>({
    latitude: 26.8467, // Default to Lucknow, Uttar Pradesh
    longitude: 80.9462,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const isTogglingAvailabilityRef = useRef(false);
  const isTogglingOnlineRef = useRef(false);
  const [isPayNowLoading, setIsPayNowLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const radarPulse = useRef(new Animated.Value(0)).current;
  const requestSlide = useRef(new Animated.Value(height)).current;
  const timerLine = useRef(new Animated.Value(1)).current;
  const hasNavigatedRef = useRef(false);
  const isAutoEnablingSearchRef = useRef(false);

  // --- NEW EXPO-AUDIO PLAYER ---
  const player = useAudioPlayer('https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3'); // Using a stable test audio URL

  const { rideEnded } = useLocalSearchParams();

  const [driverId, setDriverId] = useState<string | null>(null);
  const { driver: authDriver, refreshProfile, profileVersion } = useDriverAuth();

  const profileImageSource = React.useMemo(() => {
    if (!authDriver?.profileImage) return null;
    const url = getImageUrl(authDriver.profileImage, { width: 100, height: 100, quality: 80, version: profileVersion });
    console.log("[Dashboard] Profile image URL:", url);
    return { uri: url };
  }, [authDriver?.profileImage, profileVersion]);

  // --- STATS & SOCKET LOGIC ---
  const loadStats = async (isChangingOnline = false) => {
    try {
      const token = await getDriverToken();
      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      const response = await driverAPI.getDashboard();
      if (response.data && response.data.dashboard) {
        const { stats: dashStats, driver, currentBooking } = response.data.dashboard;
        setStats({
          earnings: dashStats.totalEarnings || 0,
          trips: dashStats.totalTrips || 0,
          name: driver.name || '',
          rating: driver.rating || 5.0,
          profileImage: driver.profileImage || ''
        });
        setDriverId(driver.id);
        
        // Skip updating online status if we are in the middle of a toggle to avoid flip-back flicker
        if (!isChangingOnline) {
          setIsOnline(driver.online || false);
        }
        
        setIsSearching(driver.available || false);

        // Check for active booking and redirect ONLY on initial load OR app foregrounding
        if (currentBooking && !hasNavigatedRef.current) {
          console.log("Found active booking on dashboard load:", currentBooking);
          setHasActiveRide(true);
          hasNavigatedRef.current = true; // Mark as navigated

          const bookingId = currentBooking.id || currentBooking._id;

          if (currentBooking.status === "accepted" || currentBooking.status === "driver_assigned") {
            router.push({
              pathname: "/pickup",
              params: { 
                bookingId,
                pLat: currentBooking.pickupLatitude,
                pLon: currentBooking.pickupLongitude,
                dLat: currentBooking.dropLatitude,
                dLon: currentBooking.dropLongitude
              }
            });
          } else if (currentBooking.status === "arrived") {
            router.push({
              pathname: "/start-ride",
              params: { bookingId }
            });
          } else if (currentBooking.status === "started") {
            router.push({
              pathname: "/active-ride",
              params: { 
                bookingId,
                pLat: currentBooking.pickupLatitude,
                pLon: currentBooking.pickupLongitude,
                dLat: currentBooking.dropLatitude,
                dLon: currentBooking.dropLongitude
              }
            });
          } else if (currentBooking.status === "waiting") {
            router.push({
              pathname: "/waiting-for-return",
              params: { bookingId }
            });
          } else if (currentBooking.status === "return_ride_started") {
            router.push({
              pathname: "/active-ride",
              params: {
                bookingId,
                mode: 'return',
                pLat: currentBooking.pickupLatitude,
                pLon: currentBooking.pickupLongitude,
                dLat: currentBooking.dropLatitude,
                dLon: currentBooking.dropLongitude
              }
            });
          }
        } else if (!currentBooking) {
          // Reset navigation flag when no active booking
          hasNavigatedRef.current = false;
        }
      }
      
      // Refresh auth profile state to sync with backend changes
      await refreshProfile();
    } catch (err) {
      console.log("Dashboard stats error:", err);
    }
  };

  // --- AUTO-REFRESH ON FOCUS ---
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [isOnline, driverId])
  );

  useEffect(() => {
    if (isOnline && driverId) {
      startLocationTracking();
      const setupSocket = async () => {
        const socket = await initSocket();

        socket.on("connect", () => {
          console.log("Socket connected, emitting join for driver:", driverId);
          socket.emit("join", driverId);
        });

        if (socket.connected) {
          console.log("Socket already connected, emitting join immediately:", driverId);
          socket.emit("join", driverId);
        }

      };
      setupSocket();
    } else {
      stopLocationTracking();
      disconnectSocket();
      setIsSearching(false);
    }
  }, [isOnline, driverId]);

  useFocusEffect(
    useCallback(() => {
      // Don't refresh if we are in the middle of an online toggle 
      // but DO refresh on screen focus to catch profile/stats updates
      if (!isTogglingOnlineRef.current) {
        loadStats();
        refreshProfile(); // Also refresh global profile data
      }
    }, [refreshProfile])
  );

  useEffect(() => {
    // Also keep the initial load for reliability
    loadStats();

    const configureAudio = async () => {
      try {
        await Audio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log("Audio config error:", e);
      }
    };
    configureAudio();

    // --- APPSTATE LISTENER FOR RE-SYNCING ---
    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        console.log("App foregrounded, reloading stats...");
        loadStats();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const startLocationTracking = async () => {
    let fgStatus = await Location.requestForegroundPermissionsAsync();
    if (fgStatus.status !== 'granted') {
      Alert.alert('Permission Error', 'Foreground location permission is required.');
      return;
    }

    let bgStatus = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus.status !== 'granted') {
      Alert.alert('Permission Error', 'Background location permission is required to keep you online in lock-screen.');
    }

    let loc;
    try {
      loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (e) {
      console.log("Error getting current position:", e);
      Alert.alert("Location Error", "Could not get current location. Please ensure GPS is enabled.");
      return;
    }
    setLocation(loc);

    if (loc?.coords && !isNaN(loc.coords.latitude) && !isNaN(loc.coords.longitude)) {
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    // Update location on backend
    try {
      if (loc && loc.coords) {
        await driverAPI.updateLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude
        });
      }
    } catch (err) {
      console.log("Initial location update error:", err);
    }

    // Start a foreground service to keep JS running forever
    try {
      await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 10000,
        foregroundService: {
          notificationTitle: "Driver is Online",
          notificationBody: "Waiting for new ride requests...",
          notificationColor: "#FFD700",
        },
      });
      console.log("Foreground Service Started");
    } catch (e) {
      console.error("Foreground location error:", e);
    }
  };

  const stopLocationTracking = async () => {
    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync('BACKGROUND_LOCATION_TASK');
        console.log("Foreground Service Stopped");
      }
    } catch (e) {
      console.error("Error stopping location updates:", e);
    }
  };

  useEffect(() => {
    if (rideEnded === 'true') {
      setHasActiveRide(false);
      setIsSearching(isOnline);
      router.setParams({ rideEnded: undefined });
    }
  }, [rideEnded, isOnline]);

  useEffect(() => {
    return () => {
      Vibration.cancel();
    };
  }, []);

  async function playChime() {
    try {
      // Always play chime to alert driver of incoming ride, even in background
      player.loop = true;
      player.volume = 1.0;
      player.play();
    } catch (e) { console.log("Audio logic error:", e); }
  }

  const applySearchState = (enabled: boolean) => {
    setIsSearching(enabled);
    if (enabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(radarPulse, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(radarPulse, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();
    } else {
      radarPulse.setValue(0);
      radarPulse.stopAnimation();
    }
  };

  const ensureSearchingEnabled = async () => {
    if (isAutoEnablingSearchRef.current || isTogglingAvailabilityRef.current) return;
    if (!isOnline || isSearching) return;
    try {
      isAutoEnablingSearchRef.current = true;
      isTogglingAvailabilityRef.current = true;
      setIsTogglingAvailability(true);
      const res = await driverAPI.toggleAvailability();
      const enabled = Boolean(res?.data?.available);
      applySearchState(enabled);
      if (!enabled) {
        console.log("Auto-search enable returned disabled state from backend.");
      }
    } catch (err) {
      console.log("Auto-enable searching error:", err);
    } finally {
      setIsTogglingAvailability(false);
      isTogglingAvailabilityRef.current = false;
      isAutoEnablingSearchRef.current = false;
    }
  };

  useEffect(() => {
    if (isOnline && !isSearching) {
      ensureSearchingEnabled();
    }
  }, [isOnline, isSearching]);


  const handlePayment = async () => {
    try {
      setIsPayNowLoading(true);
      const razorpayNative =
        (NativeModules as any)?.RNRazorpayCheckout ||
        (NativeModules as any)?.RazorpayCheckout;
      if (
        !razorpayNative ||
        !RazorpayCheckout ||
        typeof (RazorpayCheckout as any).open !== "function"
      ) {
        Alert.alert(
          "Razorpay Unavailable",
          "Payment SDK is not loaded in this build. Use a Dev Build / APK (not Expo Go) and rebuild the app."
        );
        return;
      }
      const res = await driverAPI.createPaymentOrder();
      
      if (res.data.success) {
        const { order, key_id } = res.data;
        
        const options = {
          description: 'Hello-11 Pending Commission Payment',
          image: 'https://i.imgur.com/39go7K2.png', // Replace with your logo
          currency: order.currency,
          key: key_id,
          amount: order.amount,
          name: 'Hello-11 Driver',
          order_id: order.id,
          prefill: {
            contact: authDriver?.mobile || '',
            name: authDriver?.name || '',
          },
          theme: { color: '#FFD700' }
        };

        RazorpayCheckout.open(options).then(async (data: any) => {
          // Success
          const verifyRes = await driverAPI.verifyPaymentVerify({
            razorpay_order_id: data.razorpay_order_id,
            razorpay_payment_id: data.razorpay_payment_id,
            razorpay_signature: data.razorpay_signature
          });
          
          if (verifyRes.data.success) {
            Alert.alert("Success", "Payment successful! You are now unblocked.");
            refreshProfile();
          } else {
            Alert.alert("Error", "Payment verification failed. Please contact support.");
          }
        }).catch((error: any) => {
          // Error
          console.log("Razorpay Error:", error);
          Alert.alert(`Payment failed`, error.description || "Payment cancelled");
        });
      }
    } catch (err: any) {
      console.log("Create Order Error:", err);
      Alert.alert("Error", err.message || "Failed to start payment process");
    } finally {
      setIsPayNowLoading(false);
    }
  };

  const isBlocked = (authDriver?.unpaidRideCount || 0) >= 3 && (authDriver?.pendingCommission || 0) > 0;

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar style="dark" />

      {/* Payment Blocking Modal */}
      <Modal
        visible={isBlocked}
        transparent={true}
        animationType="slide"
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white rounded-[40px] p-8 items-center shadow-2xl">
            <View className="w-20 h-20 bg-amber-100 rounded-full items-center justify-center mb-6">
              <Ionicons name="wallet-outline" size={40} color="#B45309" />
            </View>
            
            <Text className="text-2xl font-black text-slate-900 text-center mb-2 italic">Payment Blocked!</Text>
            <Text className="text-slate-500 text-center mb-8 px-4 font-medium leading-5">
              Aapne 3 rides ka commission pay nahi kiya hai. Agli ride lene ke liye kripya pending amount pay karein.
            </Text>

            <View className="bg-slate-50 w-full p-6 rounded-3xl mb-8 border border-slate-100">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Unpaid Rides</Text>
                <Text className="text-slate-900 font-black text-lg">{authDriver?.unpaidRideCount}</Text>
              </View>
              <View className="h-[1px] bg-slate-200 w-full mb-4" />
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Total Pending</Text>
                <Text className="text-amber-600 font-black text-2xl">₹{authDriver?.pendingCommission}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handlePayment}
              disabled={isPayNowLoading}
              className="w-full h-16 bg-[#1E293B] rounded-2xl flex-row items-center justify-center shadow-lg"
            >
              {isPayNowLoading ? (
                <ActivityIndicator color="#FFD700" />
              ) : (
                <>
                  <Ionicons name="card-outline" size={20} color="#FFD700" />
                  <Text className="text-[#FFD700] font-black text-base ml-3 tracking-[2px] uppercase">Pay Full Amount</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={() => router.push("/profile")}
              className="mt-6 py-2"
            >
              <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest underline">Go to Profile</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="absolute inset-0 bg-slate-200">
        <MapView
          style={{ width, height }}
          region={region}
          showsUserLocation={false}
          showsMyLocationButton={false}
          provider={PROVIDER_GOOGLE}
        >
          {location?.coords && (
            <Marker 
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude
              }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View className="items-center justify-center">
                <View className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-lg border-2 border-[#FFD700]">
                  <Ionicons name="car-sport" size={20} color="#1E293B" />
                </View>
                <View className="bg-[#FFD700] px-2 py-0.5 rounded-full mt-1 border border-white shadow-sm">
                  <Text className="text-[7px] font-black uppercase text-slate-900 tracking-tighter">HELLO 11</Text>
                </View>
              </View>
            </Marker>
          )}
        </MapView>
        


        {isSearching && (
          <View className="absolute inset-0 items-center justify-center pointer-events-none">
            <Animated.View
              style={{
                transform: [{ scale: radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3.5] }) }],
                opacity: radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
              }}
              className="w-48 h-48 border-4 border-[#FFD700] rounded-full"
            />
          </View>
        )}

        <View className="absolute top-32 self-center bg-white/90 px-6 py-2 rounded-full border border-white shadow-sm">
          <Text className="text-slate-800 font-bold text-xs tracking-[3px] uppercase">
            {isSearching ? 'Searching Area...' : isOnline ? 'Ready for trips' : 'Map Offline'}
          </Text>
        </View>
      </View>

      <SafeAreaView edges={['top']} className="px-6 w-full z-10">
        <View className={`flex-row justify-between items-start ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-slate-50"
            onPress={() => router.push("/profile")}
          >
            {profileImageSource ? (
              <Image 
                source={profileImageSource} 
                className="w-full h-full rounded-full" 
              />
            ) : (
              <Ionicons name="person" size={24} color="#1E293B" />
            )}
          </TouchableOpacity>

          <View className="bg-white rounded-[24px] p-2 pl-5 pr-2 flex-row items-center shadow-xl border border-slate-50">
            <View className="mr-4">
              <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider text-right">Status</Text>
              <Text className={`text-base font-black ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <View className="flex-row items-center">
              {isTogglingOnline && <ActivityIndicator size="small" color="#1E293B" style={{ marginRight: 8 }} />}
              <Switch
                value={isOnline}
                onValueChange={async (val) => {
                  if (isTogglingOnlineRef.current) return;
                  
                  // Safety check: Cannot go online if not verified
                  if (val && !authDriver?.isVerified) {
                    const hasDocs = authDriver?.documents && (
                      authDriver.documents.license || 
                      authDriver.documents.insurance || 
                      authDriver.documents.registration
                    );
                    const hasNote = authDriver?.verificationNote && authDriver.verificationNote.trim().length > 0;

                    let title = "Verification Required";
                    let msg = "Verify hone ke baad hi aap online ja sakte ho. Please complete your documents.";

                    if (hasNote) {
                      title = "Account Rejected";
                      msg = `${authDriver.verificationNote}\n\nContact to Admin for more details.`;
                    } else if (hasDocs) {
                      title = "Under Review";
                      msg = "Document Uploaded. Waiting for Admin Approval.";
                    }

                    Alert.alert(
                      title, 
                      msg,
                      [{ text: hasDocs ? "View Documents" : "Complete Now", onPress: () => router.push("/documents") }]
                    );
                    return;
                  }

                  try {
                    isTogglingOnlineRef.current = true;
                    setIsTogglingOnline(true);
                    const res = await driverAPI.toggleOnline();
                    setIsOnline(res.data.online);
                    if (!res.data.online) {
                      applySearchState(false);
                    } else {
                      const shouldSearch = Boolean(res.data.available);
                      applySearchState(shouldSearch);
                      if (!shouldSearch) {
                        await ensureSearchingEnabled();
                      }
                      
                      // 2. Force a full stats sync in the background
                      loadStats(true);
                      
                      const token = await registerForPushNotificationsAsync();
                      if (token) {
                        await driverAPI.updateVehicle({ pushToken: token });
                      }
                    }
                  } catch (err) {
                    console.log("Toggle online error:", err);
                  } finally {
                    setIsTogglingOnline(false);
                    isTogglingOnlineRef.current = false;
                  }
                }}
                disabled={isTogglingOnline}
                trackColor={{ false: "#E2E8F0", true: "#1E293B" }}
                thumbColor={isOnline ? "#FFD700" : "#94A3B8"}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>

      <View className="absolute bottom-0 w-full z-20">
        {!isOnline ? (
          <LinearGradient
            colors={['#1E293B', '#0F172A']} // Premium Slate to Deep Navy
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: (insets?.bottom || 0) + 40 }}
            className={`px-8 pt-10 shadow-2xl ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}
          >
            <View className="self-center w-12 h-1.5 bg-white/10 rounded-full mb-8" />
            <Text className="text-white text-3xl font-black mb-3 text-center italic tracking-tighter">You are Offline</Text>
            <Text className="text-slate-400 text-center mb-10 leading-6 px-6 font-medium">
              Go online to start receiving ride requests and maximize your daily earnings.
            </Text>

            <TouchableOpacity
              onPress={async () => {
                if (isTogglingOnlineRef.current) return;
                
                // Safety check: Cannot go online if not verified
                if (!authDriver?.isVerified) {
                  const hasDocs = authDriver?.documents && (
                    authDriver.documents.license || 
                    authDriver.documents.insurance || 
                    authDriver.documents.registration
                  );
                  const hasNote = authDriver?.verificationNote && authDriver.verificationNote.trim().length > 0;

                  let title = "Verification Required";
                  let msg = "Verify hone ke baad hi aap online ja sakte ho. Please complete your documents.";

                  if (hasNote) {
                    title = "Account Rejected";
                    msg = `${authDriver.verificationNote}\n\nContact to Admin for more details.`;
                  } else if (hasDocs) {
                    title = "Under Review";
                    msg = "Document Uploaded. Waiting for Admin Approval.";
                  }

                  Alert.alert(
                    title, 
                    msg,
                    [{ text: hasDocs ? "View Documents" : "Complete Now", onPress: () => router.push("/documents") }]
                  );
                  return;
                }

                try {
                  isTogglingOnlineRef.current = true;
                  setIsTogglingOnline(true);
                  const res = await driverAPI.toggleOnline();
                  setIsOnline(res.data.online);
                  if (res.data.online) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    
                    const shouldSearch = Boolean(res.data.available);
                    applySearchState(shouldSearch);
                    if (!shouldSearch) {
                      await ensureSearchingEnabled();
                    }
                    
                    // 2. Force a sync in the background
                    loadStats(true);
                    
                    const token = await registerForPushNotificationsAsync();
                    if (token) {
                      await driverAPI.updateVehicle({ pushToken: token });
                    }
                  }
                } catch (err) {
                  console.log("Button toggle online error:", err);
                } finally {
                  setIsTogglingOnline(false);
                  isTogglingOnlineRef.current = false;
                }
              }}
              activeOpacity={0.8}
              disabled={isTogglingOnline}
              style={{ width: '100%', height: 64, marginTop: 10 }}
            >
              <View
                style={{ width: '100%', height: '100%', backgroundColor: isTogglingOnline ? '#334155' : '#FFD700', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 22 }}
              >
                <View style={{ backgroundColor: isTogglingOnline ? '#475569' : '#0F172A', padding: 6, borderRadius: 20, marginRight: 12 }}>
                  {isTogglingOnline ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="power" size={16} color="#FFD700" />
                  )}
                </View>
                <Text style={{ color: isTogglingOnline ? '#94A3B8' : '#0F172A', fontWeight: '900', fontSize: 18, letterSpacing: 3, textTransform: 'uppercase' }}>
                  {isTogglingOnline ? 'CONNECTING...' : 'GO ONLINE'}
                </Text>
              </View>
            </TouchableOpacity>
          </LinearGradient>
        ) : (
          (
            <LinearGradient
              colors={['#1E293B', '#0F172A']} // Premium Slate to Deep Navy (Consistent with Offline)
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ borderTopLeftRadius: 40, borderTopRightRadius: 40, paddingBottom: (insets?.bottom || 0) + 32 }}
              className={`px-6 pt-6 shadow-2xl ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}
            >
              <View className="self-center w-12 h-1.5 bg-white/10 rounded-full mb-6" />

              {/* Vehicle Status Card */}
              <View className="mb-6 bg-white/5 border border-white/10 rounded-[28px] p-4 flex-row items-center">
                <View className="w-12 h-12 bg-[#FFD700] rounded-2xl items-center justify-center shadow-lg shadow-yellow-500/20">
                  <Ionicons name="car-sport" size={24} color="#0F172A" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-white font-black text-sm uppercase tracking-wider">{authDriver?.vehicleModel || 'No Model'}</Text>
                  <View className="flex-row items-center mt-0.5">
                    <View className="bg-white/10 px-2 py-0.5 rounded-md">
                      <Text className="text-slate-400 text-[10px] font-black">{authDriver?.vehicleNumber || 'No Plate'}</Text>
                    </View>
                    <View className="ml-3 bg-green-500/20 px-2 py-0.5 rounded-md border border-green-500/30">
                      <Text className="text-green-400 text-[8px] font-black uppercase tracking-widest">
                        {authDriver?.vehicleType === '5seater' ? 'Standard' : 'Premium'}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity 
                   onPress={() => router.push("/edit-vehicle")}
                   className="w-10 h-10 bg-white/10 rounded-full items-center justify-center active:bg-white/20"
                >
                  <Ionicons name="settings-outline" size={18} color="white" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={() => {}}
                activeOpacity={0.7}
                disabled
                style={{ width: '100%', height: 72, marginBottom: 24 }}
              >
                <View
                   style={{ width: '100%', height: '100%', padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: isSearching ? '#334155' : '#FFD700', borderRadius: 24 }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {isTogglingAvailability ? (
                      <ActivityIndicator color={isSearching ? "white" : "black"} />
                    ) : (
                      <Ionicons name={isSearching ? "sync" : "pulse"} size={22} color={isSearching ? "white" : "black"} />
                    )}
                    <View style={{ marginLeft: 16 }}>
                      <Text style={{ fontWeight: '900', fontSize: 16, color: isSearching ? 'white' : '#0F172A' }}>
                        {isTogglingAvailability ? 'ENABLING AUTO SEARCH...' : (isSearching ? 'Waiting for Riders...' : 'Auto-Finding Rides')}
                      </Text>
                      <Text style={{ color: isSearching ? '#94A3B8' : '#334155', fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
                        {isSearching ? 'Searching active area' : 'Auto search will start shortly'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={isSearching ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"} />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={async () => {
                  if (isTogglingOnlineRef.current) return;
                  try {
                    isTogglingOnlineRef.current = true;
                    setIsTogglingOnline(true);
                    const res = await driverAPI.toggleOnline();
                    setIsOnline(res.data.online);
                    if (!res.data.online) {
                      setIsSearching(false);
                      radarPulse.setValue(0);
                      radarPulse.stopAnimation();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                  } catch (err) {
                    console.log("Go Offline error:", err);
                  } finally {
                    setIsTogglingOnline(false);
                    isTogglingOnlineRef.current = false;
                  }
                }}
                disabled={isTogglingOnline}
                style={{ width: '100%', height: 56, borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 20 }}
              >
                <View
                  style={{ width: '100%', height: '100%', alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: 'rgba(239, 68, 68, 0.08)', borderRadius: 20 }}
                >
                  {isTogglingOnline ? (
                    <ActivityIndicator size="small" color="#EF4444" />
                  ) : (
                    <Ionicons name="power-outline" size={18} color="#EF4444" />
                  )}
                  <Text style={{ color: '#EF4444', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 3, marginLeft: 12 }}>
                    {isTogglingOnline ? 'DISCONNECTING...' : 'Go Offline'}
                  </Text>
                </View>
              </TouchableOpacity>
            </LinearGradient>
          )
        )}
      </View>

      {!authDriver?.isVerified && (
        <View 
          pointerEvents="box-none"
          className="absolute inset-0 z-[100]"
        >
          <TouchableOpacity 
            activeOpacity={0.95}
            onPress={() => {
              console.log("[Dashboard] Card pressed - Navigating to documents");
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/documents");
            }}
            style={{ top: (insets?.top || 0) + 84 }}
            className="mx-6 bg-[#FFFBEB] px-6 py-8 rounded-[36px] border border-amber-200 shadow-2xl items-center justify-center elevation-5"
          >
            {(() => {
              const hasDocs = authDriver?.documents && (
                authDriver.documents.license || 
                authDriver.documents.insurance || 
                authDriver.documents.registration
              );
              const hasNote = authDriver?.verificationNote && authDriver.verificationNote.trim().length > 0;

              return (
                <>
                  <View className={`w-14 h-14 rounded-full items-center justify-center mb-4 ${hasNote ? 'bg-red-100' : 'bg-amber-100'}`}>
                    <Ionicons 
                      name={hasNote ? "alert-circle" : hasDocs ? "sync-circle" : "shield-half"} 
                      size={32} 
                      color={hasNote ? "#B91C1C" : "#B45309"} 
                    />
                  </View>
                  
                  <Text className={`font-black text-sm uppercase tracking-[3px] mb-2 ${hasNote ? 'text-red-700' : 'text-[#92400E]'}`}>
                    {hasNote ? 'Account Rejected' : hasDocs ? 'Under Review' : 'Account Inactive'}
                  </Text>
                  
                  <View className="items-center mb-6">
                    <Text className={`${hasNote ? 'text-red-600' : 'text-[#B45309]'} text-[11px] font-bold uppercase text-center leading-5 px-4`}>
                      {hasNote 
                        ? `${authDriver.verificationNote}\n\nContact to Admin for more details.` 
                        : hasDocs 
                           ? "Document Uploaded. Waiting for Admin Approval." 
                           : "Verification pending. Verify hone ke baad hi aap ride accept kar sakte ho."}
                    </Text>
                  </View>

                  <View 
                    className={`w-full py-4 rounded-2xl shadow-lg items-center flex-row justify-center ${hasNote ? 'bg-red-600' : 'bg-[#92400E]'}`}
                  >
                    <Ionicons name={hasDocs ? "document-text" : "cloud-upload"} size={18} color="white" />
                    <Text className="text-white text-xs font-black uppercase tracking-[2px] ml-2">
                      {hasNote ? 'Fix Documents' : hasDocs ? 'View Documents' : 'Complete Verification'}
                    </Text>
                  </View>
                </>
              );
            })()}
          </TouchableOpacity>
        </View>
      )}

    </View>
  );
}
