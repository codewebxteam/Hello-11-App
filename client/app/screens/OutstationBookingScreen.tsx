
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Dimensions, TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

const FLEET_DATA = [
  { id: '1', name: 'MINI', price: '₹12/km', label: 'ECO' },
  { id: '2', name: 'SEDAN', price: '₹16/km', label: 'PRO' },
  { id: '3', name: 'SUV', price: '₹22/km', label: 'LUX' },
];

const OutstationBookingScreen = () => {
  const router = useRouter();
  const [distance, setDistance] = useState('');
  const [selectedCab, setSelectedCab] = useState('1');
  const [bookingType, setBookingType] = useState<'now' | 'schedule'>('now');

  return (
    <View className="flex-1 bg-slate-50">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* HEADER SECTION */}
      <View className="bg-[#FFD700] pt-12 pb-8 px-5 rounded-b-[40px] shadow-sm">
        <View className="flex-row items-center justify-between mb-5">
          <TouchableOpacity onPress={() => router.back()} className="bg-white/50 p-2 rounded-xl">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-base font-black text-black">OUTSTATION RIDE</Text>
          <View className="w-10" />
        </View>

        {/* LOCATION CARD */}
        <View className="bg-white p-4 rounded-[25px] shadow-lg elevation-5">
          <View className="flex-row items-center h-[45px]">
            <View className="w-2 h-2 rounded-full bg-blue-500 mr-4" />
            <TextInput
              placeholder="Enter Pickup Location"
              className="flex-1 font-bold text-sm text-slate-800"
              placeholderTextColor="#94A3B8"
            />
          </View>
          <View className="w-[1px] h-2.5 bg-slate-200 ml-[3px]" />
          <View className="flex-row items-center h-[45px]">
            <Ionicons name="location" size={18} color="#ef4444" style={{ marginRight: 10 }} />
            <TextInput
              placeholder="Enter Drop Destination"
              className="flex-1 font-bold text-sm text-slate-800"
              placeholderTextColor="#94A3B8"
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerClassName="p-5 pb-32" showsVerticalScrollIndicator={false}>

        {/* DISTANCE BOX */}
        <View className="flex-row items-center bg-white p-4 rounded-[20px] mb-6 border border-slate-200">
          <Ionicons name="map-outline" size={20} color="#6366f1" />
          <TextInput
            placeholder="Estimated Distance"
            keyboardType="numeric"
            value={distance}
            onChangeText={setDistance}
            className="flex-1 ml-2.5 font-bold text-[15px] text-slate-800"
            placeholderTextColor="#94A3B8"
          />
          {distance !== '' && <Text className="font-black text-slate-500">KM</Text>}
        </View>

        <Text className="text-xs font-black text-slate-500 mb-4 ml-1">SELECT YOUR VEHICLE</Text>

        {/* FLEET GRID */}
        <View className="flex-row justify-between mb-8">
          {FLEET_DATA.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => setSelectedCab(item.id)}
              className={`w-[30%] p-4 rounded-[22px] items-center border-2 ${selectedCab === item.id
                  ? 'border-[#FFD700] bg-yellow-50'
                  : 'border-transparent bg-white'
                }`}
            >
              <Text className={`text-[8px] font-black mb-1 ${selectedCab === item.id ? 'text-yellow-700' : 'text-slate-400'
                }`}>
                {item.label}
              </Text>
              <Text className="text-[13px] font-black text-slate-800">{item.name}</Text>
              <Text className="text-[10px] font-bold mt-1 text-[#FFD700]">{item.price}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* BOOKING PANEL */}
        <View className="bg-slate-900 p-5 rounded-[35px]">
          <View className="flex-row bg-slate-800 p-1.5 rounded-[15px] mb-5">
            <TouchableOpacity
              onPress={() => setBookingType('now')}
              className={`flex-1 py-3 items-center rounded-xl ${bookingType === 'now' ? 'bg-[#FFD700]' : ''}`}
            >
              <Text className={`text-[11px] font-black ${bookingType === 'now' ? 'text-black' : 'text-slate-400'}`}>RIDE NOW</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setBookingType('schedule')}
              className={`flex-1 py-3 items-center rounded-xl ${bookingType === 'schedule' ? 'bg-[#FFD700]' : ''}`}
            >
              <Text className={`text-[11px] font-black ${bookingType === 'schedule' ? 'text-black' : 'text-slate-400'}`}>SCHEDULE</Text>
            </TouchableOpacity>
          </View>

          {bookingType === 'schedule' && (
            <TouchableOpacity className="flex-row items-center justify-center mb-5 bg-slate-800 p-3 rounded-xl">
              <Ionicons name="calendar" size={18} color="#FFD700" />
              <Text className="text-white ml-2.5 font-bold">Pick Date & Time</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity className="bg-white py-[18px] rounded-[15px] items-center active:bg-gray-100">
            <Text className="font-black text-sm tracking-widest text-slate-900">CONFIRM OUTSTATION</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default OutstationBookingScreen;