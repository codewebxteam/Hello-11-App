import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Switch,
  SafeAreaView,
  StatusBar as RNStatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isTablet = width > 768;
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);
  const router = useRouter();

  return (
    <View className="flex-1 bg-slate-100">
      <StatusBar style="dark" />

      {/* --- MAP BACKGROUND (Global) --- */}
      <View className="absolute inset-0 bg-[#E2E8F0] items-center justify-center overflow-hidden">
        {/* Soft Modern Pattern */}
        <View className="absolute w-[150%] h-[150%] opacity-[0.03]">
          <View className="absolute top-[30%] left-[10%] w-[800px] h-[800px] border-[50px] border-slate-900 rounded-full" />
          <View className="absolute top-[20%] right-[20%] w-[400px] h-[400px] bg-slate-900 rounded-full" />
        </View>
        <View className="bg-white/60 px-6 py-2 rounded-full border border-white/50 shadow-sm">
          <Text className="text-slate-500 font-bold text-xs tracking-[3px] uppercase">
            {isOnline ? 'Searching Area...' : 'Map Offline'}
          </Text>
        </View>
      </View>

      {/* --- HEADER --- */}
      <View
        style={{ paddingTop: STATUSBAR_HEIGHT ? STATUSBAR_HEIGHT + 20 : 60 }}
        className="px-6 w-full z-10"
      >
        <View className={`flex-row justify-between items-start ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>

          <TouchableOpacity
            className="w-12 h-12 bg-white rounded-full items-center justify-center shadow-lg shadow-slate-200 border border-slate-50 active:scale-95"
            onPress={() => router.push("/profile")}
          >
            <Ionicons name="person" size={24} color="#1E293B" />
          </TouchableOpacity>

          {/* Status Card (Center/Right) */}
          <View className="bg-white rounded-[24px] p-2 pl-5 pr-2 flex-row items-center shadow-xl shadow-slate-200 border border-slate-50">
            <View className="mr-4">
              <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider text-right">Status</Text>
              <Text className={`text-base font-black ${isOnline ? 'text-green-600' : 'text-slate-400'}`}>
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <View className="bg-slate-50 rounded-[20px] px-1 py-1">
              <Switch
                value={isOnline}
                onValueChange={setIsOnline}
                trackColor={{ false: "#E2E8F0", true: "#1E293B" }}
                thumbColor={isOnline ? "#FFD700" : "#94A3B8"}
                ios_backgroundColor="#334155"
              />
            </View>
          </View>

        </View>
      </View>

      {/* --- BOTTOM SHEET AREA --- */}
      <View className="absolute bottom-0 w-full z-20">

        {!isOnline ? (
          // === OFFLINE STATE ===
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
          // === ONLINE STATE ===
          <View className={`bg-white rounded-t-[40px] px-6 pt-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>

            {/* Drag Handle */}
            <View className="self-center w-12 h-1.5 bg-slate-100 rounded-full mb-6" />

            {/* Main Stats Row */}
            <View className="flex-row justify-between mb-8 overflow-visible">
              <View className="flex-1 bg-slate-50 p-4 rounded-[26px] border border-slate-100 mr-3 items-start justify-between min-h-[110px]">
                <View className="bg-green-100 p-2 rounded-full">
                  <Ionicons name="cash" size={18} color="#16A34A" />
                </View>
                <View>
                  <Text className="text-slate-900 text-2xl font-black">₹850</Text>
                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Earnings</Text>
                </View>
              </View>

              <View className="flex-1 bg-slate-50 p-4 rounded-[26px] border border-slate-100 items-start justify-between min-h-[110px]">
                <View className="bg-blue-100 p-2 rounded-full">
                  <Ionicons name="speedometer" size={18} color="#2563EB" />
                </View>
                <View>
                  <Text className="text-slate-900 text-2xl font-black">4</Text>
                  <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Trips Completed</Text>
                </View>
              </View>
            </View>

            {/* Active Action / Status */}
            <View className="bg-[#FFD700] rounded-[24px] p-5 flex-row items-center justify-between shadow-lg shadow-yellow-500/20">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-black/10 rounded-full items-center justify-center">
                  <Ionicons name="pulse" size={24} color="#1E293B" />
                </View>
                <View className="ml-4">
                  <Text className="text-slate-900 font-black text-lg">Finding Rides...</Text>
                  <Text className="text-slate-800 text-xs opacity-70 font-semibold">High demand zone</Text>
                </View>
              </View>
              <View className="bg-slate-900 px-3 py-1.5 rounded-lg">
                <Text className="text-white text-[9px] font-bold">RADAR ON</Text>
              </View>
            </View>

          </View>
        )}
      </View>
    </View>
  );
}