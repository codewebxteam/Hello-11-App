import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
  Platform,
  Animated,
  Easing,
  Vibration,
  StatusBar as RNStatusBar
} from 'react-native';
// WARNING 1 FIX: react-native wali SafeAreaView hata kar context wali use kar rahe hain
import { SafeAreaView, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
// WARNING 2 FIX: Expo-AV deprecated hai, isliye hum sirf Audio capability use karenge
import { Audio } from 'expo-av';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(false);
  const [hasActiveRide, setHasActiveRide] = useState(false); // New state to prevent loop
  const [sound, setSound] = useState<any>(null);
  const soundRef = useRef<Audio.Sound | null>(null); // Ref to track sound for unmount cleanup
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const radarPulse = useRef(new Animated.Value(0)).current;
  const requestSlide = useRef(new Animated.Value(height)).current;
  const timerLine = useRef(new Animated.Value(1)).current; // For Progress Bar

  // --- AUTO REQUEST SIMULATION ---
  React.useEffect(() => {
    let timer: any;
    // Only trigger if online, no request is pending, and NO active ride
    if (isOnline && !incomingRequest && !hasActiveRide) {
      timer = setTimeout(() => {
        playChime(); // Play sound with the request
        startRideRequest();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [isOnline, incomingRequest, hasActiveRide]);

  const { rideEnded } = useLocalSearchParams();

  // --- HANDLE RIDE END ---
  React.useEffect(() => {
    if (rideEnded === 'true') {
      setHasActiveRide(false);
      setIncomingRequest(false);
      setIsSearching(true); // Auto start searching again

      // Clear param to prevent loop (though usually safe on simple back, but good practice if params persist)
      router.setParams({ rideEnded: undefined });
    }
  }, [rideEnded]);

  // --- CLEANUP SOUND ON UNMOUNT ---
  React.useEffect(() => {
    return () => {
      // Cleanup sound on unmount
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { });
      }
    };
  }, []);

  // --- UPDATED SOUND LOGIC (Warning Free) ---
  async function playChime() {
    try {
      // Unload previous sound if any
      if (soundRef.current) {
        await soundRef.current.unloadAsync().catch(() => { });
      }

      // Audio mode configure karna zaroori hai
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

  const handleRadarPress = () => {
    if (isSearching) return;
    setIsSearching(true);
    playChime();

    Animated.loop(
      Animated.sequence([
        Animated.timing(radarPulse, {
          toValue: 1, duration: 2000, useNativeDriver: true, easing: Easing.out(Easing.ease),
        }),
        Animated.timing(radarPulse, { toValue: 0, duration: 0, useNativeDriver: true })
      ])
    ).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setTimeout(() => {
      setIsSearching(false);
      startRideRequest();
    }, 4500);
  };

  const startRideRequest = () => {
    setIncomingRequest(true);
    timerLine.setValue(1);

    Vibration.vibrate([0, 400, 200, 400], true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    Animated.spring(requestSlide, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }).start();

    // Start 15-second progress bar
    Animated.timing(timerLine, {
      toValue: 0,
      duration: 120000, // 2 minutes
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) closeRequest();
    });
  };

  const closeRequest = () => {
    // Safe sound cleanup
    if (soundRef.current) {
      soundRef.current.stopAsync().catch(() => { });
      soundRef.current.unloadAsync().catch(() => { });
      soundRef.current = null;
    }
    setSound(null);

    Vibration.cancel();
    timerLine.stopAnimation();
    Animated.timing(requestSlide, { toValue: height, duration: 250, useNativeDriver: true }).start(() => setIncomingRequest(false));
  };

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar style="dark" />

      {/* --- MAP BACKGROUND & RADAR --- */}
      <View className="absolute inset-0 bg-[#E2E8F0] items-center justify-center overflow-hidden">
        {isSearching && (
          <Animated.View
            style={{
              transform: [{ scale: radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 3.5] }) }],
              opacity: radarPulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
            }}
            className="absolute w-64 h-64 border-2 border-[#FFD700] rounded-full"
          />
        )}
        <View className="bg-white/60 px-6 py-2 rounded-full border border-white/50 shadow-sm">
          <Text className="text-slate-500 font-bold text-xs tracking-[3px] uppercase">
            {isSearching ? 'Searching Area...' : isOnline ? 'Ready for trips' : 'Map Offline'}
          </Text>
        </View>
      </View>

      {/* --- HEADER (SAFE AREA FIXED) --- */}
      <SafeAreaView edges={['top']} className="px-6 w-full z-10">
        <View className={`flex-row justify-between items-start ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>
          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg border border-slate-50"
            onPress={() => router.push("/profile")}
          >
            <Ionicons name="person" size={24} color="#1E293B" />
          </TouchableOpacity>

          <View className="bg-white rounded-[24px] p-2 pl-5 pr-2 flex-row items-center shadow-xl border border-slate-50">
            <View className="mr-4">
              <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider text-right">Status</Text>
              <Text className={`text-base font-black ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={(val) => {
                setIsOnline(val);
                if (!val) {
                  setIsSearching(false);
                  closeRequest(); // Ensure request and sound are closed when going offline
                }
              }}
              trackColor={{ false: "#E2E8F0", true: "#1E293B" }}
              thumbColor={isOnline ? "#FFD700" : "#94A3B8"}
            />
          </View>
        </View>
      </SafeAreaView>

      {/* --- BOTTOM AREA --- */}
      <View className="absolute bottom-0 w-full z-20">
        {!isOnline ? (
          <View className={`bg-white rounded-t-[40px] px-8 pt-8 pb-12 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>
            <Text className="text-slate-900 text-3xl font-black mb-2 text-center">You are Offline</Text>
            <Text className="text-slate-500 text-center mb-10 leading-6 px-4">
              Go online to start receiving ride requests and maximize your daily earnings.
            </Text>

            <TouchableOpacity
              onPress={() => setIsOnline(true)}
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
                  <Text className="text-slate-900 text-2xl font-black mt-2 italic">₹850</Text>
                  <Text className="text-slate-400 text-[9px] font-black uppercase">Earnings</Text>
                </View>
                <View className="flex-1 bg-slate-50 p-4 rounded-[26px] border border-slate-100">
                  <Ionicons name="speedometer" size={18} color="#2563EB" />
                  <Text className="text-slate-900 text-2xl font-black mt-2 italic">4</Text>
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
                    <Text className={`font-black text-lg ${isSearching ? 'text-white' : 'text-slate-900'}`}>Finding Rides...</Text>
                    <Text className={`${isSearching ? 'text-slate-400' : 'text-slate-800'} text-xs font-semibold`}>High demand zone</Text>
                  </View>
                </View>
                <View className="bg-slate-900 px-3 py-1.5 rounded-lg"><Text className="text-white text-[9px] font-bold">RADAR ON</Text></View>
              </TouchableOpacity>
            </View>
          )
        )}
      </View>

      {/* --- ASSEMBLED RIDE REQUEST CARD (Redesigned & Safe Area Fixed) --- */}
      {incomingRequest && (
        <Animated.View
          style={{
            transform: [{ translateY: requestSlide }],
            paddingBottom: insets.bottom + 10 // Safe area padding
          }}
          className="absolute bottom-0 w-full z-50 px-4"
        >
          <View className="bg-[#0F172A] rounded-[40px] p-6 shadow-2xl border border-slate-700/50 overflow-hidden">

            {/* TOP PROGRESS BAR */}
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <Animated.View
                style={{
                  width: timerLine.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: '#FFD700'
                }}
                className="h-full"
              />
            </View>

            {/* Header Section */}
            <View className="flex-row justify-between items-start mb-6 mt-4">
              <View>
                <View className="flex-row items-center mb-1">
                  <View className="bg-[#FFD700] px-2 py-0.5 rounded-md mr-2">
                    <Text className="text-[#0F172A] text-[10px] font-black uppercase">Premium</Text>
                  </View>
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Incoming Ride</Text>
                </View>
                <Text className="text-white text-5xl font-black italic tracking-tighter">₹420</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Estimated Fare</Text>
              </View>

              {/* Rating/User Placeholder */}
              <View className="items-end">
                <View className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center border border-slate-700 mb-1">
                  <Ionicons name="person" size={24} color="#CBD5E1" />
                </View>
                <View className="flex-row items-center bg-slate-800/80 px-2 py-1 rounded-lg">
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text className="text-white text-[10px] font-bold ml-1">4.8</Text>
                </View>
              </View>
            </View>

            {/* Trip Details Section - Modernized */}
            <View className="bg-slate-800/50 p-5 rounded-[24px] mb-6 border border-slate-700/50">
              {/* Stats Row */}
              <View className="flex-row justify-between mb-6 pb-4 border-b border-slate-700/50">
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Distance</Text>
                  <Text className="text-white font-black text-base">12.5 KM</Text>
                </View>
                <View className="w-[1px] h-8 bg-slate-700 self-center" />
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Pickup</Text>
                  <Text className="text-white font-black text-base">1.2 KM</Text>
                </View>
                <View className="w-[1px] h-8 bg-slate-700 self-center" />
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Time</Text>
                  <Text className="text-white font-black text-base">28 Min</Text>
                </View>
              </View>

              {/* Locations */}
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
                      <Text className="text-white font-bold text-sm leading-5" numberOfLines={1}>Hazratganj Crossing, Lucknow</Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Dropoff</Text>
                      <Text className="text-white font-bold text-sm leading-5" numberOfLines={1}>Terminal 2, Amausi Airport</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Actions Section */}
            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={closeRequest}
                className="flex-1 bg-slate-800 py-4 rounded-[20px] items-center border border-slate-700 active:bg-slate-700"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase tracking-widest">Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  closeRequest();
                  setHasActiveRide(true); // Stop the simulation loop
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  router.push("/pickup");
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