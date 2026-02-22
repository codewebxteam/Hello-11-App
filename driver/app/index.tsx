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
  Image
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';

import { initSocket, disconnectSocket } from '../utils/socket';
import { driverAPI } from '../utils/api';
import { getDriverToken } from '../utils/storage';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false);
  const [rideData, setRideData] = useState<any>(null);
  const [stats, setStats] = useState({ earnings: 0, trips: 0, name: '', rating: 0, profileImage: '' });
  const [location, setLocation] = useState<any>(null);
  const [region, setRegion] = useState<any>(null);
  const [sound, setSound] = useState<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const radarPulse = useRef(new Animated.Value(0)).current;
  const requestSlide = useRef(new Animated.Value(height)).current;
  const timerLine = useRef(new Animated.Value(1)).current;
  const hasNavigatedRef = useRef(false);

  const { rideEnded } = useLocalSearchParams();

  const [driverId, setDriverId] = useState<string | null>(null);

  // --- STATS & SOCKET LOGIC ---
  const loadStats = async () => {
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
        setIsOnline(driver.online || false);
        setIsSearching(driver.available || false);

        // Check for active booking and redirect ONLY on initial load
        if (currentBooking && !hasNavigatedRef.current) {
          console.log("Found active booking on dashboard load:", currentBooking);
          setHasActiveRide(true);
          hasNavigatedRef.current = true; // Mark as navigated

          if (currentBooking.status === "accepted" || currentBooking.status === "driver_assigned" || currentBooking.status === "arrived") {
            router.push({
              pathname: "/pickup",
              params: { bookingId: currentBooking.id }
            });
          } else if (currentBooking.status === "started") {
            router.push({
              pathname: "/active-ride",
              params: { bookingId: currentBooking.id }
            });
          }
        } else if (!currentBooking) {
          // Reset navigation flag when no active booking
          hasNavigatedRef.current = false;
        }
      }
    } catch (err) {
      console.log("Dashboard stats error:", err);
    }
  };

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

        socket.on("newRideRequest", (data: any) => {
          console.log("New ride request received:", data);
          setRideData(data);
          playChime();
          startRideRequest();
        });

        socket.on("rideRequestCancelled", (data: any) => {
          console.log("Ride request cancelled by user:", data);
          // If the cancelled ride is the one currently showing, close it
          setRideData((currentRide: any) => {
            if (currentRide && (currentRide._id === data.bookingId || currentRide.id === data.bookingId)) {
              closeRequest();
              return null;
            }
            return currentRide;
          });
        });
      };
      setupSocket();
    } else {
      stopLocationTracking();
      disconnectSocket();
      setIsSearching(false);
      closeRequest();
    }
  }, [isOnline, driverId]);

  useEffect(() => {
    loadStats();
  }, []);

  const startLocationTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission to access location was denied');
      return;
    }

    let loc = await Location.getCurrentPositionAsync({});
    setLocation(loc);

    if (!isNaN(loc.coords.latitude) && !isNaN(loc.coords.longitude)) {
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }

    // Update location on backend
    try {
      await driverAPI.updateLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude
      });
    } catch (err) {
      console.log("Initial location update error:", err);
    }

    // Watch for location changes
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 10000,
      },
      async (newLoc) => {
        const { latitude, longitude } = newLoc.coords;
        setLocation(newLoc);

        if (!isNaN(latitude) && !isNaN(longitude)) {
          setRegion((prev: any) => ({
            latitude: latitude,
            longitude: longitude,
            latitudeDelta: prev?.latitudeDelta || 0.01,
            longitudeDelta: prev?.longitudeDelta || 0.01,
          }));
        }

        try {
          await driverAPI.updateLocation({
            latitude,
            longitude
          });
        } catch (err) {
          console.log("Watch location update error:", err);
        }
      }
    );
  };

  const stopLocationTracking = () => {
    // Location watching is handled by expo within the component lifecycle mostly, 
    // but in a production app we'd save and remove the subscription.
  };

  useEffect(() => {
    if (rideEnded === 'true') {
      setHasActiveRide(false);
      setIncomingRequest(false);
      setIsSearching(isOnline);
      router.setParams({ rideEnded: undefined });
    }
  }, [rideEnded, isOnline]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { });
      }
      Vibration.cancel();
    };
  }, []);

  async function playChime() {
    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => { });
      }
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' }
      );
      soundRef.current = newSound;
      setSound(newSound);
      await newSound.setIsLoopingAsync(true);
      await newSound.setVolumeAsync(0.3);
      await newSound.playAsync();
    } catch (e) { console.log("Audio logic error:", e); }
  }

  const handleRadarPress = async () => {
    if (isSearching) return;

    try {
      const res = await driverAPI.toggleAvailability();
      if (res.data.available) {
        setIsSearching(true);
        Animated.loop(
          Animated.sequence([
            Animated.timing(radarPulse, {
              toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.out(Easing.ease),
            }),
            Animated.timing(radarPulse, { toValue: 0, duration: 0, useNativeDriver: true })
          ])
        ).start();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err) {
      console.log("Toggle availability error:", err);
    }
  };

  const startRideRequest = () => {
    setIncomingRequest(true);
    timerLine.setValue(1);
    Vibration.vibrate([0, 500, 500, 500], true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.spring(requestSlide, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }).start();

    Animated.timing(timerLine, {
      toValue: 0,
      duration: 30000, // 30 seconds to accept
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) closeRequest();
    });
  };

  const closeRequest = () => {
    Vibration.cancel();
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => { });
      soundRef.current.unloadAsync().catch(() => { });
      soundRef.current = null;
    }
    setSound(null);
    timerLine.stopAnimation();
    Animated.timing(requestSlide, { toValue: height, duration: 250, useNativeDriver: true }).start(() => setIncomingRequest(false));
  };

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar style="dark" />

      <View className="absolute inset-0 bg-slate-200">
        {region ? (
          <MapView
            style={{ width, height }}
            region={region}
            showsUserLocation={true}
            showsMyLocationButton={false}
            provider={PROVIDER_GOOGLE}
          >
          </MapView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className="text-slate-400 font-bold">Getting Location...</Text>
          </View>
        )}

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

        <View className="absolute top-24 self-center bg-white/90 px-6 py-2 rounded-full border border-white shadow-sm">
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
            {stats.profileImage ? (
              <Image source={{ uri: stats.profileImage }} className="w-full h-full rounded-full" />
            ) : (
              <Ionicons name="person" size={24} color="#1E293B" />
            )}
          </TouchableOpacity>

          {stats.name && (
            <View className="ml-3 bg-white/80 px-4 py-2 rounded-2xl border border-white shadow-sm flex-1">
              <Text className="text-slate-400 text-[8px] font-black uppercase tracking-wider">Welcome</Text>
              <Text className="text-slate-900 font-black text-sm">{stats.name}</Text>
            </View>
          )}

          <View className="bg-white rounded-[24px] p-2 pl-5 pr-2 flex-row items-center shadow-xl border border-slate-50">
            <View className="mr-4">
              <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider text-right">Status</Text>
              <Text className={`text-base font-black ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={async (val) => {
                try {
                  const res = await driverAPI.toggleOnline();
                  setIsOnline(res.data.online);
                  if (!res.data.online) setIsSearching(false);
                } catch (err) {
                  console.log("Toggle online error:", err);
                }
              }}
              trackColor={{ false: "#E2E8F0", true: "#1E293B" }}
              thumbColor={isOnline ? "#FFD700" : "#94A3B8"}
            />
          </View>
        </View>
      </SafeAreaView>

      <View className="absolute bottom-0 w-full z-20">
        {!isOnline ? (
          <View className={`bg-white rounded-t-[40px] px-8 pt-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>
            <Text className="text-slate-900 text-3xl font-black mb-2 text-center">You are Offline</Text>
            <Text className="text-slate-500 text-center mb-10 leading-6 px-4">
              Go online to start receiving ride requests and maximize your daily earnings.
            </Text>

            <TouchableOpacity
              onPress={async () => {
                try {
                  const res = await driverAPI.toggleOnline();
                  setIsOnline(res.data.online);
                  if (res.data.online) {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                } catch (err) {
                  console.log("Button toggle online error:", err);
                }
              }}
              activeOpacity={0.9}
              className="bg-slate-900 w-full py-5 rounded-[22px] items-center shadow-xl shadow-slate-900/20 flex-row justify-center"
            >
              <View className="bg-[#FFD700] p-1 rounded-full mr-3">
                <Ionicons name="power" size={16} color="#000" />
              </View>
              <Text className="text-white font-black text-lg tracking-[2px]">GO ONLINE</Text>
            </TouchableOpacity>
          </View>
        ) : (
          !incomingRequest && (
            <View className={`bg-white rounded-t-[40px] px-6 pt-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>
              <View className="self-center w-12 h-1.5 bg-slate-100 rounded-full mb-6" />
              <View className="flex-row justify-between mb-8">
                <View className="flex-1 bg-slate-50 p-4 rounded-[26px] border border-slate-100 mr-3">
                  <Ionicons name="cash" size={18} color="#16A34A" />
                  <Text className="text-slate-900 text-2xl font-black mt-2 italic">₹{stats.earnings}</Text>
                  <Text className="text-slate-400 text-[9px] font-black uppercase">Earnings</Text>
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-[26px] border border-slate-100">
                  <Ionicons name="speedometer" size={18} color="#2563EB" />
                  <Text className="text-slate-900 text-2xl font-black mt-2 italic">{stats.trips}</Text>
                  <Text className="text-slate-400 text-[9px] font-black uppercase">Trips Done</Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={handleRadarPress}
                disabled={isSearching}
                className={`rounded-[24px] p-5 flex-row items-center justify-between shadow-lg ${isSearching ? 'bg-slate-800' : 'bg-[#FFD700]'}`}
              >
                <View className="flex-row items-center">
                  <Ionicons name={isSearching ? "sync" : "pulse"} size={24} color={isSearching ? "white" : "black"} />
                  <View className="ml-4">
                    <Text className={`font-black text-lg ${isSearching ? 'text-white' : 'text-slate-900'}`}>
                      {isSearching ? 'Waiting for Riders...' : 'Start Finding Rides'}
                    </Text>
                    <Text className={`${isSearching ? 'text-slate-400' : 'text-slate-800'} text-xs font-semibold`}>
                      {isSearching ? 'High demand zone' : 'Tap to scan area'}
                    </Text>
                  </View>
                </View>
                <View className="bg-slate-900 px-3 py-1.5 rounded-lg"><Text className="text-white text-[9px] font-bold">RADAR ON</Text></View>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>

      {incomingRequest && (
        <Animated.View
          style={{
            transform: [{ translateY: requestSlide }],
            paddingBottom: insets.bottom + 10
          }}
          className="absolute bottom-0 w-full z-50 px-4"
        >
          <View className="bg-[#0F172A] rounded-[40px] p-6 shadow-2xl border border-slate-700/50 overflow-hidden">
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <Animated.View
                style={{
                  width: timerLine.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: '#FFD700'
                }}
                className="h-full"
              />
            </View>

            <View className="flex-row justify-between items-start mb-6 mt-4">
              <View>
                <View className="flex-row items-center mb-1 flex-wrap gap-2">
                  <View className="bg-[#FFD700] px-2 py-0.5 rounded-md">
                    <Text className="text-[#0F172A] text-[10px] font-black uppercase">Premium</Text>
                  </View>
                  {rideData?.rideType === 'outstation' && (
                    <View className="bg-orange-500 px-2 py-0.5 rounded-md">
                      <Text className="text-white text-[10px] font-black uppercase">🛣️ Outstation</Text>
                    </View>
                  )}
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Incoming Ride</Text>
                </View>
                <Text className="text-white text-5xl font-black italic tracking-tighter">₹{rideData?.fare || 0}</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Estimated Fare</Text>
              </View>

              <View className="items-end">
                <View className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center border border-slate-700 mb-1">
                  <Ionicons name="person" size={24} color="#CBD5E1" />
                </View>
                <View className="flex-row items-center bg-slate-800/80 px-2 py-1 rounded-lg">
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text className="text-white text-[10px] font-bold ml-1">{rideData?.passenger?.rating || '5.0'}</Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800/50 p-5 rounded-[24px] mb-6 border border-slate-700/50">
              <View className="flex-row justify-between mb-6 pb-4 border-b border-slate-700/50">
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Distance</Text>
                  <Text className="text-white font-black text-base">{rideData?.distance || 0} KM</Text>
                </View>
                <View className="w-[1px] h-8 bg-slate-700 self-center" />
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Type</Text>
                  <Text className="text-white font-black text-xs uppercase">{rideData?.rideType || 'Standard'}</Text>
                </View>
              </View>

              <View className="space-y-6">
                <View className="flex-row">
                  <View className="items-center mr-3 pt-1">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
                    <View className="w-[1px] h-8 bg-slate-700 my-1" />
                    <Ionicons name="location" size={16} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <View className="mb-4">
                      <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Pickup</Text>
                      <Text className="text-white font-bold text-sm leading-5" numberOfLines={1}>{rideData?.pickup || 'Unknown'}</Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Dropoff</Text>
                      <Text className="text-white font-bold text-sm leading-5" numberOfLines={1}>{rideData?.drop || 'Unknown'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={closeRequest}
                className="flex-1 bg-slate-800 py-4 rounded-[20px] items-center border border-slate-700 active:bg-slate-700"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase tracking-widest">Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    const bookingId = rideData?.bookingId;
                    if (!bookingId) {
                      Alert.alert("Error", "Booking ID not found");
                      return;
                    }

                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                    await driverAPI.acceptBooking(bookingId);

                    closeRequest();
                    setHasActiveRide(true);
                    router.push({
                      pathname: "/pickup",
                      params: { bookingId: bookingId }
                    });
                  } catch (err: any) {
                    console.error("Accept ride error:", err);
                    Alert.alert("Error", err.response?.data?.message || "Failed to accept ride. It might have been taken by another driver.");
                    closeRequest();
                  }
                }}
                className="flex-[2] bg-[#FFD700] py-4 rounded-[20px] items-center shadow-lg shadow-yellow-500/20 active:bg-[#FCD34D]"
              >
                <Text className="text-[#0F172A] font-black text-sm uppercase tracking-[3px]">Accept Ride</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}