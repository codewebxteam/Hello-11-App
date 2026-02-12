import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function PickupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="dark" />

            {/* --- SIMULATED MAP BACKGROUND --- */}
            <View className="absolute inset-0 bg-[#E2E8F0] items-center justify-center overflow-hidden">
                {/* Map Placeholder Pattern/Image */}
                <Image
                    source={{ uri: 'https://i.imgur.com/2c5K0rX.png' }} // Placeholder map style image if available, else generic
                    className="w-full h-full opacity-80"
                    resizeMode="cover"
                />
                {/* Simulated Route Line (Overlay on map) */}
                <View className="absolute w-[4px] h-[30%] bg-blue-500 rounded-full overflow-hidden top-[20%] right-[40%] transform rotate-12 shadow-sm" />

                {/* Driver Car Marker (Center) */}
                <View className="absolute top-1/2 left-1/2 -mt-6 -ml-6 shadow-2xl">
                    <View className="bg-white p-2 rounded-full border-[3px] border-[#FFD700] shadow-lg">
                        <Ionicons name="car" size={24} color="#0F172A" />
                    </View>
                    <View className="bg-[#0F172A] px-2 py-0.5 rounded-full absolute -bottom-3 -right-3 border border-white">
                        <Text className="text-white text-[8px] font-bold">YOU</Text>
                    </View>
                </View>

                {/* Pickup Marker */}
                <View className="absolute top-[30%] left-[60%] shadow-2xl">
                    <View className="bg-white p-2 rounded-full border-[3px] border-green-500 shadow-lg">
                        <Ionicons name="person" size={20} color="#0F172A" />
                    </View>
                    <View className="bg-white px-2 py-1 rounded-md absolute -top-8 -left-4 shadow-md border border-slate-100">
                        <Text className="text-slate-900 text-[10px] font-bold">2 min</Text>
                    </View>
                </View>
            </View>

            {/* --- TOP BAR --- */}
            <SafeAreaView edges={['top']} className="absolute top-0 w-full z-10 px-4 pt-2">
                <View className="bg-[#0F172A] rounded-2xl p-4 shadow-2xl flex-row items-center border border-slate-700/50">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-slate-700 active:bg-slate-700"
                    >
                        <Ionicons name="menu" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View className="flex-1 ml-4">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Picking up</Text>
                        <Text className="text-white text-lg font-black tracking-tight" numberOfLines={1}>Priya Sharma</Text>
                    </View>

                    <View className="bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/50">
                        <Text className="text-green-400 font-bold text-xs">ON TIME</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* --- BOTTOM SHEET (INFORMATION) --- */}
            <View className="absolute bottom-0 w-full z-20">
                <View
                    style={{ paddingBottom: insets.bottom + 20 }}
                    className="bg-[#0F172A] rounded-t-[40px] px-6 pt-8 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50"
                >
                    {/* Handle Indicator */}
                    <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-8 opacity-50" />

                    {/* User Profile Row */}
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center flex-1">
                            <View className="relative">
                                <View className="w-16 h-16 bg-slate-700 rounded-full items-center justify-center border-2 border-[#FFD700] shadow-glow">
                                    <Text className="text-2xl">👩‍💼</Text>
                                </View>
                                <View className="absolute -bottom-1 -right-1 bg-white px-1.5 py-0.5 rounded-md flex-row items-center border border-slate-100 shadow-sm">
                                    <Ionicons name="star" size={10} color="#F59E0B" />
                                    <Text className="text-slate-900 text-[10px] font-black ml-0.5">4.9</Text>
                                </View>
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Passanger</Text>
                                <Text className="text-white text-xl font-black">Priya Sharma</Text>
                            </View>
                        </View>

                        {/* Communication Actions */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity className="w-12 h-12 bg-slate-800 rounded-2xl items-center justify-center border border-slate-700 active:bg-slate-700">
                                <Ionicons name="chatbubble-ellipses" size={22} color="#94A3B8" />
                            </TouchableOpacity>
                            <TouchableOpacity className="w-12 h-12 bg-[#FFD700] rounded-2xl items-center justify-center shadow-lg shadow-yellow-500/20 active:bg-[#FCD34D]">
                                <Ionicons name="call" size={22} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-800 w-full mb-8" />

                    {/* Stats Grid */}
                    <View className="flex-row justify-between mb-8">
                        <View>
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Time to Pickup</Text>
                            <View className="flex-row items-end">
                                <Text className="text-white text-2xl font-black italic">4 min</Text>
                                <Text className="text-slate-500 text-xs font-bold mb-1.5 ml-1">Traffic</Text>
                            </View>
                        </View>
                        <View className="w-[1px] h-full bg-slate-800" />
                        <View>
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Distance</Text>
                            <Text className="text-white text-2xl font-black italic">1.2 km</Text>
                        </View>
                        <View className="w-[1px] h-full bg-slate-800" />
                        <View>
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Method</Text>
                            <Text className="text-green-400 text-2xl font-black italic">Cash</Text>
                        </View>
                    </View>

                    {/* Location Details */}
                    <View className="flex-row items-center mb-10 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
                        <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center border border-blue-500/30 mr-4">
                            <Ionicons name="location" size={20} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Pickup Location</Text>
                            <Text className="text-white text-sm font-bold leading-5" numberOfLines={2}>Gate No. 4, Phoenix Palassio Mall, Gomti Nagar</Text>
                        </View>
                        <TouchableOpacity className="bg-slate-700 p-2 rounded-lg">
                            <Ionicons name="navigate" size={18} color="#FFF" />
                        </TouchableOpacity>
                    </View>

                    {/* Slider / Button */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.push("/start-ride");
                        }}
                        className="w-full bg-[#22C55E] py-5 rounded-[24px] items-center flex-row justify-center shadow-lg shadow-green-500/20 relative overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <View className="absolute top-0 bottom-0 left-0 w-full bg-white/10 skew-x-12 -ml-[100%]" />

                        <Text className="text-[#0F172A] font-black text-lg tracking-[3px] uppercase mr-2">I Have Arrived</Text>
                        <Ionicons name="arrow-forward-circle" size={24} color="#0F172A" />
                    </TouchableOpacity>

                </View>
            </View>

        </View>
    );
}
