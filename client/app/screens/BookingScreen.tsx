import React, { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, ScrollView, Dimensions, TextInput, BackHandler 
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, Stack } from "expo-router"; 

const { width } = Dimensions.get('window');

const CAB_TYPES = [
  { id: '1', name: 'Mini', icon: 'car-side', price: '₹12/km' },
  { id: '2', name: 'Sedan', icon: 'car-sedan', price: '₹16/km' },
  { id: '3', name: 'SUV', icon: 'car-suv', price: '₹22/km' },
];

const BookingScreen = () => {
  const [rideMode, setRideMode] = useState<'normal' | 'long'>('normal');
  const [distance, setDistance] = useState('');
  const [selectedCab, setSelectedCab] = useState('1');
  const [bookingType, setBookingType] = useState<'now' | 'schedule'>('now');
  
  const router = useRouter(); 

  // --- YE LOGIC BACK BUTTON PAR HOME SCREEN PAR LE JAYEGA ---
  useEffect(() => {
    const backAction = () => {
      router.replace("/screens/HomeScreen");
      return true; // Isse default back exit stop ho jata hai
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // Cleanup taaki doosri screens affect na hon
  }, []);

  return (
    <View className="flex-1 bg-slate-50">
      {/* Navigation Context Guard */}
      <Stack.Screen options={{ headerShown: false, gestureEnabled: true }} />

      {/* Header Section */}
      <View className="bg-[#FFD700] pt-14 pb-6 px-6 rounded-b-[45px] shadow-lg">
        <Text className="text-3xl font-black text-slate-900 mb-6">Plan Your Trip</Text>

        {/* Ride Mode Selector */}
        <View className="flex-row bg-black/10 p-1.5 rounded-2xl mb-6">
          <TouchableOpacity 
            onPress={() => setRideMode('normal')}
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${rideMode === 'normal' ? 'bg-white shadow-sm' : ''}`}
          >
            <Ionicons name="navigate-circle" size={18} color={rideMode === 'normal' ? "#000" : "#475569"} />
            <Text className={`font-black ml-2 ${rideMode === 'normal' ? 'text-black' : 'text-slate-600'}`}>NORMAL</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => router.push("/screens/BScreen1")} 
            className={`flex-1 py-3 rounded-xl items-center flex-row justify-center ${rideMode === 'long' ? 'bg-white shadow-sm' : ''}`}
          >
            <MaterialCommunityIcons name="map-marker-distance" size={18} color={rideMode === 'long' ? "#000" : "#475569"} />
            <Text className={`font-black ml-2 ${rideMode === 'long' ? 'text-black' : 'text-slate-600'}`}>LONG DISTANCE</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        
        {/* --- CONDITION 1: NORMAL RIDE --- */}
        {rideMode === 'normal' && (
          <View className="space-y-6">
            <View className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100">
              <Text className="text-lg font-black text-slate-900 mb-4">Current Status</Text>
              <View className="flex-row items-center justify-between mb-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                 <View className="flex-row items-center">
                    <View className="bg-green-100 p-2 rounded-lg"><Ionicons name="time" size={20} color="#16A34A" /></View>
                    <View className="ml-3">
                        <Text className="text-[10px] font-black text-slate-400 uppercase">Est. Arrival</Text>
                        <Text className="font-bold text-slate-900">4-6 Minutes</Text>
                    </View>
                 </View>
                 <View className="h-8 w-[1px] bg-slate-200" />
                 <View className="items-end">
                    <Text className="text-[10px] font-black text-slate-400 uppercase">Nearby</Text>
                    <Text className="font-bold text-slate-900">12 Drivers</Text>
                 </View>
              </View>
              
              <Text className="text-[10px] font-black text-slate-400 uppercase mb-2">Destination</Text>
              <View className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex-row items-center">
                <Ionicons name="search" size={20} color="#94A3B8" />
                <TextInput placeholder="Where are you going?" className="flex-1 ml-3 font-bold text-slate-800" />
              </View>
            </View>

            <View className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex-row items-center">
               <View className="bg-[#FFD700]/20 p-4 rounded-full border-4 border-white shadow-sm">
                  <Ionicons name="person" size={28} color="#000" />
               </View>
               <View className="ml-4 flex-1">
                  <Text className="text-xs font-black text-slate-400 uppercase">Top Driver for you</Text>
                  <Text className="text-xl font-black text-slate-900">Arjun Singh</Text>
                  <View className="flex-row items-center mt-1">
                     <Ionicons name="star" size={14} color="#F59E0B" />
                     <Text className="text-slate-600 font-bold ml-1 text-xs">4.9 • Swift Dzire</Text>
                  </View>
               </View>
               <TouchableOpacity className="bg-slate-900 p-3.5 rounded-2xl">
                  <Ionicons name="call" size={20} color="#FFF" />
               </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Action & Schedule Panel */}
        <View className="mt-8 bg-slate-900 p-6 rounded-[40px] shadow-2xl">
          <View className="flex-row bg-slate-800 p-1.5 rounded-2xl mb-6">
            <TouchableOpacity onPress={() => setBookingType('now')} className={`flex-1 py-3 rounded-xl items-center ${bookingType === 'now' ? 'bg-[#FFD700]' : ''}`}>
              <Text className={`font-black ${bookingType === 'now' ? 'text-black' : 'text-slate-400'}`}>RIDE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setBookingType('schedule')} className={`flex-1 py-3 rounded-xl items-center ${bookingType === 'schedule' ? 'bg-[#FFD700]' : ''}`}>
              <Text className={`font-black ${bookingType === 'schedule' ? 'text-black' : 'text-slate-400'}`}>SCHEDULE</Text>
            </TouchableOpacity>
          </View>

          {bookingType === 'schedule' && (
            <TouchableOpacity className="flex-row items-center justify-center mb-6 space-x-2 border-b border-slate-700 pb-4">
              <Ionicons name="calendar" size={18} color="#FFD700" />
              <Text className="text-white font-bold text-base italic">Today, 08:30 PM</Text>
              <Ionicons name="chevron-down" size={14} color="#FFD700" />
            </TouchableOpacity>
          )}

          <TouchableOpacity className="bg-white py-5 rounded-2xl items-center shadow-lg active:scale-95">
            <Text className="text-black font-black text-lg tracking-[2px]">
              CONFIRM {rideMode.toUpperCase()} RIDE
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default BookingScreen;