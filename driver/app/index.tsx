import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Dimensions, Switch, BackHandler 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');
const isTablet = width > 768;

export default function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(true);
  const router = useRouter();

  // --- SMART BACK NAVIGATION TO PASSENGER APP (Optional) OR EXIT ---
  useEffect(() => {
    const backAction = () => {
      // Kyunki ye independent app hai, back exit karega ya alert dega
      return false; 
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <StatusBar style="dark" />

      {/* --- RESPONSIVE PREMIUM HEADER --- */}
      <View className="bg-[#FFD700] pt-16 pb-10 px-6 rounded-b-[50px] shadow-2xl shadow-yellow-500/30">
        <View className={`self-center w-full flex-row justify-between items-start ${isTablet ? 'max-w-2xl' : ''}`}>
          <View>
            <Text className="text-slate-800 text-[11px] font-black uppercase tracking-[3px] opacity-60">Revenue Today</Text>
            <Text className="text-slate-900 text-4xl font-black mt-2 tracking-tighter italic">₹3,450.50</Text>
            <View className="flex-row items-center mt-3 bg-white/40 self-start px-3 py-1.5 rounded-full">
              <Ionicons name="trending-up" size={14} color="#0F172A" />
              <Text className="text-[#0F172A] text-[11px] font-extrabold ml-1.5">+15% Peak hour</Text>
            </View>
          </View>
          
          <View className="items-center bg-white/20 p-3 rounded-3xl border border-white/30">
            <Text className={`text-[10px] font-black mb-2 tracking-widest ${isOnline ? 'text-slate-900' : 'text-slate-500'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </Text>
            <Switch 
              value={isOnline} 
              onValueChange={setIsOnline}
              thumbColor={isOnline ? "#000" : "#f4f3f4"}
              trackColor={{ false: "#D1D5DB", true: "#00000044" }}
            />
          </View>
        </View>

        {/* DRIVER STATS CARD */}
        <View className={`self-center w-full flex-row justify-between mt-10 bg-white/50 p-5 rounded-[30px] border border-white/40 ${isTablet ? 'max-w-2xl' : ''}`}>
          <View className="items-center flex-1">
            <Ionicons name="star" size={18} color="#000" />
            <Text className="text-slate-900 font-black text-lg mt-1">4.9</Text>
            <Text className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Rating</Text>
          </View>
          <View className="w-[1px] h-8 bg-black/10 self-center" />
          <View className="items-center flex-1">
            <Ionicons name="time" size={18} color="#000" />
            <Text className="text-slate-900 font-black text-lg mt-1">7.5h</Text>
            <Text className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Duty</Text>
          </View>
          <View className="w-[1px] h-8 bg-black/10 self-center" />
          <View className="items-center flex-1">
            <Ionicons name="car" size={18} color="#000" />
            <Text className="text-slate-900 font-black text-lg mt-1">14</Text>
            <Text className="text-slate-600 text-[9px] font-black uppercase tracking-widest">Trips</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-6" contentContainerStyle={{ paddingTop: 25, paddingBottom: 150 }} showsVerticalScrollIndicator={false}>
        <View className={`self-center w-full ${isTablet ? 'max-w-2xl' : ''}`}>
          <Text className="text-slate-400 text-[11px] font-black tracking-[2px] mb-5 ml-2 uppercase opacity-60">Incoming Order</Text>

          {/* --- LUXURY TRIP CARD --- */}
          <View className="bg-white rounded-[45px] p-8 shadow-2xl shadow-slate-200 border border-slate-50 relative overflow-hidden">
            <View className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700] opacity-10 rounded-bl-[100px]" />

            <View className="flex-row items-center justify-between mb-8">
              <View className="flex-row items-center flex-1">
                <View className="w-16 h-16 bg-slate-50 rounded-3xl items-center justify-center border border-slate-100">
                  <Ionicons name="person" size={32} color="#1E293B" />
                </View>
                <View className="ml-4 flex-1">
                  <Text className="text-slate-900 text-2xl font-black tracking-tighter italic">Shivansh D.</Text>
                  <Text className="text-green-600 text-[10px] font-black uppercase">Top Rated User</Text>
                </View>
              </View>
              <Text className="text-slate-900 text-3xl font-black">₹420</Text>
            </View>

            {/* Route Section */}
            <View className="mb-10 space-y-2">
              <View className="flex-row items-center">
                <View className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
                <Text className="flex-1 text-slate-700 font-bold text-base ml-4" numberOfLines={1}>Hazratganj Metro (1.5 km)</Text>
              </View>
              <View className="w-[1px] h-6 bg-slate-100 ml-[5px] my-1" />
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color="#EF4444" />
                <Text className="flex-1 text-slate-700 font-bold text-base ml-3" numberOfLines={1}>Airport Terminal 2</Text>
              </View>
            </View>

            {/* Action Buttons - Equal Spacing */}
            <View className="flex-row">
              <TouchableOpacity className="flex-1 bg-slate-50 py-5 rounded-[22px] items-center border border-slate-100 active:bg-slate-100 mr-4">
                <Text className="text-slate-400 font-black text-xs uppercase tracking-widest">Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-slate-900 py-5 rounded-[22px] items-center shadow-xl shadow-slate-900/40 active:opacity-90">
                <Text className="text-[#FFD700] font-black text-xs uppercase tracking-[3px]">Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- BOTTOM DOCK --- */}
      <View className={`absolute bottom-10 self-center w-[90%] bg-white h-20 rounded-[35px] flex-row justify-around items-center border border-slate-100 shadow-2xl ${isTablet ? 'max-w-2xl' : ''}`}>
        <TouchableOpacity className="items-center">
          <Ionicons name="wallet-outline" size={24} color="#FFD700" />
          <Text className="text-slate-800 text-[9px] font-black mt-1 uppercase">Bank</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="map-outline" size={24} color="#94A3B8" />
          <Text className="text-slate-400 text-[9px] font-black mt-1 uppercase">Areas</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="settings-outline" size={24} color="#94A3B8" />
          <Text className="text-slate-400 text-[9px] font-black mt-1 uppercase">Profile</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}