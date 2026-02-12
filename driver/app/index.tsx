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
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
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
  const [sound, setSound] = useState<any>(null);
  const router = useRouter();

  const radarPulse = useRef(new Animated.Value(0)).current;
  const requestSlide = useRef(new Animated.Value(height)).current;
  const timerLine = useRef(new Animated.Value(1)).current; // For Progress Bar

  // --- UPDATED SOUND LOGIC (Warning Free) ---
  async function playChime() {
    try {
      // Audio mode configure karna zaroori hai
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3' }
      );
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
      duration: 15000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) closeRequest();
    });
  };

  const closeRequest = () => {
    if (sound) { sound.stopAsync(); sound.unloadAsync(); setSound(null); }
    Vibration.cancel();
    timerLine.stopAnimation();
    Animated.timing(requestSlide, { toValue: height, duration: 250, useNativeDriver: true }).start(() => setIncomingRequest(false));
  };

  return (
    <SafeAreaProvider>
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
                onValueChange={(val) => { setIsOnline(val); if(!val) { setIsSearching(false); Vibration.cancel(); } }}
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

        {/* --- ASSEMBLED RIDE REQUEST CARD (Warnings Removed) --- */}
        {incomingRequest && (
          <Animated.View style={{ transform: [{ translateY: requestSlide }] }} className="absolute bottom-0 w-full z-50 p-4">
            <View className="bg-slate-900 rounded-[50px] p-8 shadow-2xl border border-white/10 overflow-hidden">
              
              {/* TOP PROGRESS BAR */}
              <View className="absolute top-0 left-0 right-0 h-1 bg-white/5">
                <Animated.View 
                  style={{
                    width: timerLine.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                    backgroundColor: '#FFD700'
                  }}
                  className="h-full"
                />
              </View>

              <View className="flex-row justify-between items-center mb-8 px-1 mt-2">
                  <View>
                     <Text className="text-[#A5B4FC] text-[10px] font-black uppercase tracking-widest">Premium Sedan</Text>
                     <Text className="text-white text-5xl font-black italic mt-1 tracking-tighter">₹420</Text>
                  </View>
                  <View className="bg-green-500/10 px-4 py-1.5 rounded-full border border-green-500/20">
                     <Text className="text-green-400 text-[10px] font-black uppercase tracking-widest">Online Paid</Text>
                  </View>
              </View>

              {/* Trip Details Section */}
              <View className="bg-white/5 p-6 rounded-[35px] mb-8 border border-white/5">
                <View className="flex-row items-center mb-8 justify-between px-2">
                   <View className="items-start flex-1"><Text className="text-slate-500 text-[9px] font-black uppercase">Pickup</Text><Text className="text-white font-bold text-lg">1.2 KM</Text></View>
                   <View className="w-[1px] h-8 bg-white/10 mx-2" />
                   <View className="items-start flex-1"><Text className="text-slate-500 text-[9px] font-black uppercase">Distance</Text><Text className="text-white font-bold text-lg">12.5 KM</Text></View>
                   <View className="w-[1px] h-8 bg-white/10 mx-2" />
                   <View className="items-start flex-1"><Text className="text-slate-500 text-[9px] font-black uppercase">Est. Time</Text><Text className="text-white font-bold text-lg">28 MIN</Text></View>
                </View>

                <View className="space-y-6">
                  <View className="flex-row items-start">
                    <View className="items-center mr-4 mt-1">
                      <View className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white/20 shadow-sm shadow-blue-400" />
                      <View className="w-[1.5px] h-10 bg-white/10 my-1" />
                      <Ionicons name="location" size={20} color="#EF4444" />
                    </View>
                    <View className="flex-1">
                      <View className="mb-6">
                          <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Pickup Point</Text>
                          <Text className="text-white font-bold text-[15px]" numberOfLines={1}>Hazratganj Crossing, Lucknow</Text>
                      </View>
                      <View>
                          <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Drop Location</Text>
                          <Text className="text-white font-bold text-[15px]" numberOfLines={1}>Terminal 2, Amausi Airport</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Actions Section */}
              <View className="flex-row items-center px-1">
                <TouchableOpacity onPress={closeRequest} className="flex-1 bg-white/10 py-5 rounded-[26px] items-center mr-4 border border-white/5">
                  <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Ignore</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { closeRequest(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); }} className="flex-[2.5] bg-[#FFD700] py-5 rounded-[26px] items-center shadow-xl shadow-yellow-500/40">
                  <Text className="text-black font-black text-sm uppercase tracking-[4px]">Accept Ride</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}
      </View>
    </SafeAreaProvider>
  );
}