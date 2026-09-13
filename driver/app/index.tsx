import React, { useState, useEffect, useRef , useCallback } from 'react';
import {
  Alert,
  View,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  Switch,
  Animated,
  Easing,
  Vibration,
  Image,
  AppState,
  ActivityIndicator,
  NativeModules,
  Modal,
  Platform,
  Linking
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { useRouter, useLocalSearchParams , useFocusEffect } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { getImageUrl } from '../utils/imagekit';

import { initSocket, disconnectSocket, setSocketDriverId, ensureSocketConnected } from '../utils/socket';
import { driverAPI } from '../utils/api';
import { getDriverToken } from '../utils/storage';
import MapView, { Marker, PROVIDER_GOOGLE } from '../utils/mapCompat';
import * as Location from 'expo-location';
import { registerForPushNotificationsAsync } from '../utils/notifications';
import { useDriverAuth } from '../context/DriverAuthContext';
import * as ExpoNotifications from 'expo-notifications';
import { notifee, AndroidImportance } from '../utils/notifee-helper';
import RazorpayCheckout from 'react-native-razorpay';
import * as IntentLauncher from 'expo-intent-launcher';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function DriverDashboard() {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const [isOnline, setIsOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [, setStats] = useState({ earnings: 0, trips: 0, name: '', rating: 0, profileImage: '' });
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
  
  // Naya state Wallet data live lane ke liye
  const [walletData, setWalletData] = useState<any>(null);

  const [activeRide, setActiveRide] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (activeRide) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 0, duration: 1500, useNativeDriver: true })
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [activeRide]);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const radarPulse = useRef(new Animated.Value(0)).current;
  const hasNavigatedRef = useRef(false);
  const isAutoEnablingSearchRef = useRef(false);
  const locationSubRef = useRef<Location.LocationSubscription | null>(null);

  const { rideEnded } = useLocalSearchParams();

  const [driverId, setDriverId] = useState<string | null>(null);
  const { driver: authDriver, refreshProfile, profileVersion } = useDriverAuth();

  const [showPaymentBlockModal, setShowPaymentBlockModal] = useState(false);
  const unpaidRidesDone = walletData?.unpaidRideCount ?? authDriver?.unpaidRideCount ?? 0;
  const pendingDues = Number(walletData?.pendingCommission ?? authDriver?.pendingCommission ?? 0);
  const isBlocked = unpaidRidesDone >= 3 && pendingDues > 0;

  const profileImageSource = React.useMemo(() => {
    if (!authDriver?.profileImage) return null;
    const url = getImageUrl(authDriver.profileImage, { width: 100, height: 100, quality: 80, version: profileVersion });
    console.log("[Dashboard] Profile image URL:", url);
    return { uri: url };
  }, [authDriver?.profileImage, profileVersion]);

  // --- LIVE WALLET DATA API ---
  const fetchWalletData = async () => {
    try {
        const response = await driverAPI.getEarnings('week', undefined, undefined, {
            txPage: 1,
            commPage: 1,
            txLimit: 1,
            commLimit: 1
        });
        if (response.data?.earnings) {
            setWalletData(response.data.earnings);
        }
    } catch (err) {
        console.log("Dashboard fetch wallet error:", err);
    }
  };

  // --- STATS & SOCKET LOGIC ---
  const loadStats = useCallback(async (isChangingOnline = false) => {
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
        if (currentBooking) {
          setActiveRide(currentBooking);
          if (!hasNavigatedRef.current) {
            console.log("Found active booking on dashboard load:", currentBooking);
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
        } // Close if (!hasNavigatedRef.current)
      } else if (!currentBooking) {
          setActiveRide(null);
          // Reset navigation flag when no active booking
          hasNavigatedRef.current = false;
        }
      }
      
      // Refresh auth profile state to sync with backend changes
      await refreshProfile();
    } catch (err) {
      console.log("Dashboard stats error:", err);
    }
  }, [router, refreshProfile]);

  // --- AUTO-REFRESH ON FOCUS ---
  useFocusEffect(
    useCallback(() => {
      // Don't refresh if we are in the middle of an online toggle 
      // but DO refresh on screen focus to catch profile/stats updates
      if (!isTogglingOnlineRef.current) {
        loadStats();
        refreshProfile(); // Also refresh global profile data
        fetchWalletData(); // Naya API call dues check karne ke liye
      }
    }, [loadStats, refreshProfile])
  );

  useEffect(() => {
    if (isOnline && driverId) {
      setSocketDriverId(driverId);
      startLocationTracking();
      initSocket();
      ensureSocketConnected();
    } else {
      stopLocationTracking();
      disconnectSocket();
      setIsSearching(false);
    }
  }, [isOnline, driverId]);

  useEffect(() => {
    if (isOnline && isBlocked) {
      setShowPaymentBlockModal(true);
    }
  }, [isOnline, isBlocked]);

  useEffect(() => {
    // Also keep the initial load for reliability
    loadStats();
    fetchWalletData();

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
    const subscription = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "active") {
        console.log("App foregrounded, reloading stats...");
        if (isOnline && driverId) {
          ensureSocketConnected();
        }
        // On app resume after kill: clean up stale "Driver is Online" notification
        // before dashboard loads. If driver is truly online, startLocationTracking
        // will re-create a fresh foreground service notification.
        try {
          const hasStaleTask = await Location.hasStartedLocationUpdatesAsync('BACKGROUND_LOCATION_TASK').catch(() => false);
          if (!hasStaleTask) {
            // Foreground service is dead (app was killed), but notification may linger
            if (notifee && typeof notifee.cancelNotification === 'function') {
              await notifee.cancelNotification('driver-online-persistent');
            }
            await ExpoNotifications.dismissAllNotificationsAsync();
            console.log("Cleared stale notifications after app kill/restart");
          }
        } catch (e) {
          console.log("Stale notification cleanup error:", e);
        }
        loadStats();
        fetchWalletData();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadStats]);

  // --- SOLUTION B: Battery Optimization Check ---
  const checkAndPromptBatteryOptimization = async (force = false) => {
    if (Platform.OS !== 'android') return; // iOS doesn't have this concept
    try {
      if (!force) {
        const alreadyPrompted = await AsyncStorage.getItem('@battery_opt_prompted');
        if (alreadyPrompted === 'true') return; // Only prompt once automatically
      }

      Alert.alert(
        '🔋 Disable Battery Optimization',
        'Background me ride requests na chhutein, iske liye App Settings me Battery Optimization ko "Unrestricted" ya "Don\'t optimize" par set karein.',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: async () => {
              await AsyncStorage.setItem('@battery_opt_prompted', 'true');
            }
          },
          {
            text: 'Open Settings',
            onPress: async () => {
              await AsyncStorage.setItem('@battery_opt_prompted', 'true');
              try {
                // Primary: Try direct battery optimization intent
                if (IntentLauncher && typeof IntentLauncher.startActivityAsync === 'function') {
                  await IntentLauncher.startActivityAsync(
                    'android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
                    { data: 'package:com.pmup53.driversection' }
                  );
                } else {
                  Linking.openSettings();
                }
              } catch (e) {
                console.log('Battery optimization intent error, opening App Settings:', e);
                // Fallback for Xiaomi/Vivo/Oppo/Samsung: Open App Info Settings page
                Linking.openSettings();
              }
            }
          }
        ]
      );
    } catch (e) {
      console.log('Battery optimization check error:', e);
    }
  };

  const executeGoOnline = async () => {
    let fgStatus = await Location.requestForegroundPermissionsAsync();
    if (fgStatus.status !== 'granted') {
      Alert.alert('Permission Error', 'Foreground location permission is required to go online.');
      return false;
    }

    let bgStatus = await Location.requestBackgroundPermissionsAsync();
    if (bgStatus.status !== 'granted') {
      Alert.alert('Permission Error', 'Background location permission is required to go online.');
      return false;
    }

    // Solution B: Prompt battery optimization on first go-online
    checkAndPromptBatteryOptimization();

    let loc;
    try {
      loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (e) {
      console.log("Error getting current position in pre-setup:", e);
      Alert.alert("Location Error", "Could not get current location. Please ensure GPS is enabled.");
      return false;
    }

    if (!loc || !loc.coords) {
      Alert.alert("Location Error", "Could not get current location coordinates.");
      return false;
    }

    try {
      await driverAPI.updateLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
    } catch (err) {
      console.log("Pre-online location update error:", err);
      Alert.alert("Connection Error", "Failed to update location on server. Please try again.");
      return false;
    }

    setLocation(loc);
    setRegion({
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });

    return true;
  };

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

    // Solution A: Start always-on foreground service — low-power idle mode
    // This keeps the app alive even when driver is just "online" waiting for rides
    // Uses low accuracy + 60s interval to save battery while maintaining foreground service
    try {
      await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
        accuracy: Location.Accuracy.Balanced, // Lower accuracy for idle mode (battery-friendly)
        distanceInterval: 50, // Update every 50 meters when idle
        timeInterval: 60000, // Update every 60 seconds when idle
        foregroundService: {
          notificationTitle: "🟢 Hello-11 Driver Online",
          notificationBody: "Aap online hain • Ride requests aane par ring bajegi",
          notificationColor: "#FFD700",
          killServiceOnDestroy: false, // CRITICAL: Tells Android to keep service alive when app is swiped from recents!
        },
      });
      console.log("Foreground Service Started (idle mode)");
    } catch (e) {
      console.error("Foreground location error:", e);
    }

    // Display Hard-Locked Ongoing Notification via Notifee (Cannot be swiped away by user on Android!)
    try {
      if (notifee && typeof notifee.createChannel === 'function') {
        await notifee.createChannel({
          id: 'driver_online_status',
          name: 'Driver Online Status',
          importance: AndroidImportance.LOW || 2,
          visibility: AndroidVisibility.PUBLIC || 1,
        });

        await notifee.displayNotification({
          id: 'driver-online-persistent',
          title: '🟢 Hello-11 Driver Online',
          body: 'Aap online hain • Ride requests aane par ring bajegi',
          android: {
            channelId: 'driver_online_status',
            asForegroundService: true,
            ongoing: true, // HARD-LOCK: User CANNOT swipe this away!
            autoCancel: false,
            color: '#FFD700',
            pressAction: { id: 'default', launchActivity: 'default' },
          },
        });
        console.log("Notifee hard-locked ongoing notification displayed");
      }
    } catch (e) {
      console.log("Notifee ongoing notification error:", e);
    }

    // Start foreground watcher for real-time updates while app is open
    try {
      locationSubRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000, // Update every 10 seconds
          distanceInterval: 10, // Or every 10 meters
        },
        (loc) => {
          setLocation(loc);
          if (loc?.coords && !isNaN(loc.coords.latitude) && !isNaN(loc.coords.longitude)) {
            setRegion({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
            // Update backend continuously while app is open
            driverAPI.updateLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude
            }).catch(e => console.log("Foreground watch location update error", e));
          }
        }
      );
    } catch(e) {
      console.log("Foreground watch error:", e);
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

    if (locationSubRef.current) {
      locationSubRef.current.remove();
      locationSubRef.current = null;
    }

    // Cancel the persistent "Driver Online" notification
    try {
      if (notifee && typeof notifee.cancelNotification === 'function') {
        await notifee.cancelNotification('driver-online-persistent');
      }
      if (notifee && typeof notifee.stopForegroundService === 'function') {
        await notifee.stopForegroundService();
      }
      console.log("Cancelled driver online notification");
    } catch (e) {
      console.log("Error cancelling online notification:", e);
    }

    // Show "Aap offline ho gaye hain" alert notification
    try {
      await ExpoNotifications.scheduleNotificationAsync({
        content: {
          title: "🔴 Aap Offline ho gaye hain",
          body: "Hello-11: Nayi ride requests paane ke liye app open karke Online switch karein.",
          data: { type: 'driver_offline' },
        },
        trigger: null,
      });
    } catch (e) {
      console.log("Error showing offline notification:", e);
    }
  };

  useEffect(() => {
    if (rideEnded === 'true') {
      setIsSearching(isOnline);
      router.setParams({ rideEnded: undefined });
    }
  }, [rideEnded, isOnline, router]);

  useEffect(() => {
    return () => {
      Vibration.cancel();
    };
  }, []);

  const applySearchState = useCallback((enabled: boolean) => {
    setIsSearching(enabled);
    if (enabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(radarPulse, { toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(radarPulse, { toValue: 0, duration: 0, useNativeDriver: true })
        ])
      ).start();

      Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 10000,
        foregroundService: {
          notificationTitle: "🟢 Hello-11 Driver Online",
          notificationBody: "Aap online hain • Ride requests aane par ring bajegi",
          notificationColor: "#FFD700",
          killServiceOnDestroy: false,
        },
      }).catch(err => console.log("Foreground notification restore error", err));

    } else {
      radarPulse.setValue(0);
      radarPulse.stopAnimation();
    }
  }, [radarPulse]);

  const ensureSearchingEnabled = useCallback(async () => {
    if (isAutoEnablingSearchRef.current || isTogglingAvailabilityRef.current) return;
    if (!isOnline || isSearching) return;
    try {
      isAutoEnablingSearchRef.current = true;
      isTogglingAvailabilityRef.current = true;
      setIsTogglingAvailability(true);
      const res = await driverAPI.toggleAvailability(true);
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
  }, [isOnline, isSearching, applySearchState]);

  useEffect(() => {
    if (isOnline && !isSearching) {
      ensureSearchingEnabled();
    }
  }, [isOnline, isSearching, ensureSearchingEnabled]);


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
          description: 'Commission Pay To Hello11 Admin',
          image: 'https://ik.imagekit.io/hello11/hello11.logo-2-DImgjJtz.png',
          currency: order.currency,
          key: key_id,
          amount: order.amount,
          name: 'Hello11 Cab/Taxi Services',
          order_id: order.id,
          prefill: {
            contact: authDriver?.mobile || '',
            name: authDriver?.name || '',
          },
          theme: { color: '#FFCE38' },
          config: {
            display: {
              blocks: {
                upi: {
                  name: "Pay using UPI",
                  instruments: [{ method: "upi" }]
                }
              },
              sequence: ["block.upi"],
              preferences: {
                show_default_blocks: false
              }
            }
          }
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
            fetchWalletData(); // Refresh data to immediately close modal
          } else {
            Alert.alert("Error", "Payment verification failed. Please contact support.");
          }
        }).catch((error: any) => {
          // Error
          console.log("Razorpay Error:", error);
          Alert.alert("Payment Cancelled", "Aapka payment cancel ho gaya hai ya successful nahi hua.");
        });
      }
    } catch (err: any) {
      console.log("Create Order Error:", err);
      Alert.alert("Error", "Payment shuru karne mein dikkat aayi. Kripya thodi der baad try karein.");
    } finally {
      setIsPayNowLoading(false);
    }
  };

  const handleCancelModal = async () => {
    if (isOnline) {
      try {
        isTogglingOnlineRef.current = true;
        setIsTogglingOnline(true);
        const res = await driverAPI.toggleOnline();
        setIsOnline(res.data.online);
        await refreshProfile();
        applySearchState(false);
      } catch (err) {
        console.log("Modal cancel toggle online error:", err);
      } finally {
        setIsTogglingOnline(false);
        isTogglingOnlineRef.current = false;
      }
    }
    setShowPaymentBlockModal(false);
  };

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar style="dark" />

      <Modal
        visible={showPaymentBlockModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancelModal}
      >
        <View className="flex-1 bg-slate-900/95 justify-center items-center px-6">
          <View className="bg-white p-8 rounded-[32px] items-center shadow-2xl w-full max-w-md">
            
            <View className="w-20 h-20 bg-red-50 border-[4px] border-red-100 rounded-full items-center justify-center mb-6 shadow-sm">
              <Ionicons name="lock-closed" size={36} color="#EF4444" />
            </View>
            
            <Text className="text-2xl font-black text-slate-900 text-center tracking-tight mb-3">
              Commission Pending
            </Text>

            <Text className="text-slate-500 text-center text-sm font-bold mb-8 leading-5 px-2">
              Aapne aakhiri <Text className="text-red-500 font-black">{unpaidRidesDone} rides</Text> ka payment nahi kiya hai. Online jaane ke liye dues clear karein.
            </Text>

            <View className="bg-slate-50 border border-slate-100 w-full p-5 rounded-[20px] mb-8 flex-row justify-between items-center shadow-sm">
              <Text className="text-slate-500 font-black uppercase tracking-widest text-xs">Total Dues</Text>
              <Text className="text-red-500 font-black text-2xl">₹ {pendingDues.toFixed(2)}</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handlePayment} // Automatically handles your Razorpay flow
              disabled={isPayNowLoading}
              className="w-full bg-[#FFD700] py-4 rounded-[20px] flex-row justify-center items-center shadow-xl shadow-yellow-500/30"
            >
              {isPayNowLoading ? (
                <ActivityIndicator color="#0F172A" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#0F172A" />
                  <Text className="text-slate-900 font-black text-sm uppercase tracking-widest ml-2">
                    Pay Dues Now
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleCancelModal}
              disabled={isPayNowLoading}
              className="w-full bg-slate-100 py-4 rounded-[20px] items-center justify-center mt-3 border border-slate-200"
            >
              <Text className="text-slate-600 font-black text-sm uppercase tracking-widest">
                {isOnline ? "Go Offline & Close" : "Close"}
              </Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

      {/* Active Ride Floating Banner for Driver */}
      {activeRide && (
        <Animated.View style={{
          position: 'absolute',
          top: insets.top + 70, // Below the profile icon and status switch
          left: 16,
          right: 16,
          zIndex: 999,
          transform: [
            { scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.02] }) }
          ]
        }}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              const bookingId = activeRide.id || activeRide._id;
              if (activeRide.status === "accepted" || activeRide.status === "driver_assigned") {
                router.push({
                  pathname: "/pickup",
                  params: { 
                    bookingId,
                    pLat: activeRide.pickupLatitude,
                    pLon: activeRide.pickupLongitude,
                    dLat: activeRide.dropLatitude,
                    dLon: activeRide.dropLongitude
                  }
                });
              } else if (activeRide.status === "arrived") {
                router.push({
                  pathname: "/start-ride",
                  params: { bookingId }
                });
              } else if (activeRide.status === "started") {
                router.push({
                  pathname: "/active-ride",
                  params: { 
                    bookingId,
                    pLat: activeRide.pickupLatitude,
                    pLon: activeRide.pickupLongitude,
                    dLat: activeRide.dropLatitude,
                    dLon: activeRide.dropLongitude
                  }
                });
              } else if (activeRide.status === "waiting") {
                router.push({
                  pathname: "/waiting-for-return",
                  params: { bookingId }
                });
              } else if (activeRide.status === "return_ride_started") {
                router.push({
                  pathname: "/active-ride",
                  params: {
                    bookingId,
                    mode: 'return',
                    pLat: activeRide.pickupLatitude,
                    pLon: activeRide.pickupLongitude,
                    dLat: activeRide.dropLatitude,
                    dLon: activeRide.dropLongitude
                  }
                });
              }
            }}
            className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 flex-row items-center justify-between border border-white/20 shadow-2xl"
          >
            <View className="flex-row items-center flex-1">
              <View className="w-10 h-10 rounded-full bg-emerald-500/20 items-center justify-center mr-3 border border-emerald-500/50">
                <Ionicons name="navigate" size={20} color="#34d399" />
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-white font-black text-sm uppercase tracking-wide">Ongoing Ride</Text>
                <Text className="text-emerald-400 font-bold text-xs">
                  {activeRide.status === 'started' || activeRide.status === 'return_ride_started' ? 'On Trip' : 'Action Required'} • Tap to view
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </Animated.View>
      )}

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
                  
                  if (val && isBlocked) {
                    setShowPaymentBlockModal(true);
                    return;
                  }
                  
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

                    if (val) {
                      const setupSuccess = await executeGoOnline();
                      if (!setupSuccess) {
                        isTogglingOnlineRef.current = false;
                        setIsTogglingOnline(false);
                        return;
                      }
                    }

                    const res = await driverAPI.toggleOnline();
                    setIsOnline(res.data.online);
                    await refreshProfile();
                    if (!res.data.online) {
                      applySearchState(false);
                    } else {
                      const shouldSearch = Boolean(res.data.available);
                      applySearchState(shouldSearch);
                      if (!shouldSearch) {
                        await ensureSearchingEnabled();
                      }
                      
                      // Force a full stats sync in the background
                      loadStats(true);
                      fetchWalletData(); // Keep wallet updated on toggle
                      
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
                
                if (isBlocked) {
                  setShowPaymentBlockModal(true);
                  return;
                }
                
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

                  const setupSuccess = await executeGoOnline();
                  if (!setupSuccess) {
                    isTogglingOnlineRef.current = false;
                    setIsTogglingOnline(false);
                    return;
                  }

                  const res = await driverAPI.toggleOnline();
                  setIsOnline(res.data.online);
                  await refreshProfile();
                  
                  if (res.data.online) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    
                    const shouldSearch = Boolean(res.data.available);
                    applySearchState(shouldSearch);
                    if (!shouldSearch) {
                      await ensureSearchingEnabled();
                    }
                    
                    // Force a sync in the background
                    loadStats(true);
                    fetchWalletData();
                    
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
                    await refreshProfile();
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