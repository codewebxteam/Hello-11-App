import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RentalPickupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="light" />

            {/* --- MAP BACKGROUND (SIMULATED DARK MODE) --- */}
            <View className="absolute inset-0 bg-slate-800 items-center justify-center overflow-hidden">
                <Image
                    source={{ uri: 'https://i.imgur.com/2c5K0rX.png' }} // Map placeholder
                    className="w-full h-full opacity-40 invert"
                    resizeMode="cover"
                />

                {/* Route Line */}
                <View className="absolute top-[25%] right-[35%] w-1 h-[25%] bg-indigo-500 rounded-full rotate-12 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />

                {/* Driver Marker */}
                <View className="absolute top-1/2 left-1/2 -mt-8 -ml-8 shadow-2xl">
                    <View className="bg-slate-900 p-3 rounded-full border-[3px] border-[#FFD700] shadow-[0_0_20px_rgba(255,215,0,0.4)]">
                        <Ionicons name="car" size={28} color="#FFD700" />
                    </View>
                </View>

                <View className="absolute top-[30%] left-[60%] shadow-2xl items-center">
                    {/* Floating Time Badge */}
                    <View className="bg-[#FFD700] px-2.5 py-1 rounded-full absolute -top-8 shadow-md border border-white/20 z-10">
                        <Text className="text-[#0F172A] text-[10px] font-black">4 min</Text>
                    </View>

                    {/* Marker Ring */}
                    <View className="bg-indigo-600 p-3 rounded-full border-[3px] border-white shadow-[0_0_20px_rgba(99,102,241,0.5)]">
                        <Ionicons name="person" size={18} color="white" />
                    </View>
                </View>
            </View>

            {/* --- TOP BAR --- */}
            <SafeAreaView edges={['top']} className="absolute top-0 w-full z-10 px-4 pt-2">
                <LinearGradient
                    colors={['rgba(15, 23, 42, 0.95)', 'rgba(30, 41, 59, 0.95)']}
                    className="rounded-2xl p-4 shadow-2xl flex-row items-center border border-indigo-500/30"
                >
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-slate-700 active:bg-slate-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View className="flex-1 ml-4">
                        <View className="flex-row items-center mb-1">
                            <View className="bg-indigo-500 px-1.5 py-0.5 rounded mr-2">
                                <Text className="text-white text-[8px] font-black uppercase">Rental</Text>
                            </View>
                            <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Navigating to</Text>
                        </View>
                        <Text className="text-white text-lg font-black tracking-tight" numberOfLines={1}>Priya Sharma</Text>
                    </View>

                    <View className="items-end">
                        <Text className="text-indigo-400 font-bold text-xs uppercase mb-0.5">8 Hr / 80 KM</Text>
                        <Text className="text-slate-500 text-[9px] font-bold uppercase">Package</Text>
                    </View>
                </LinearGradient>
            </SafeAreaView>

            {/* --- BOTTOM SHEET --- */}
            <View className="absolute bottom-0 w-full z-20">
                <LinearGradient
                    colors={['#1E1B4B', '#0F172A']}
                    className="rounded-t-[40px] px-6 pt-8 border-t border-indigo-500/30 shadow-[0_-10px_60px_rgba(0,0,0,0.7)]"
                    style={{ paddingBottom: insets.bottom + 20 }}
                >
                    {/* Handle */}
                    <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-8 opacity-50" />

                    {/* Passenger & Actions */}
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center flex-1">
                            <View className="relative">
                                <View className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-slate-800 rounded-full items-center justify-center border-2 border-[#FFD700] shadow-lg shadow-indigo-500/30">
                                    <Text className="text-2xl">👩‍💼</Text>
                                </View>
                                <View className="absolute -bottom-1 -right-1 bg-indigo-900 px-1.5 py-0.5 rounded-md flex-row items-center border border-indigo-500">
                                    <Ionicons name="star" size={10} color="#FFD700" />
                                    <Text className="text-white text-[10px] font-black ml-0.5">5.0</Text>
                                </View>
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="text-indigo-300 text-[10px] font-bold uppercase tracking-widest mb-1">Premium Client</Text>
                                <Text className="text-white text-xl font-black">Priya Sharma</Text>
                            </View>
                        </View>

                        <View className="flex-row gap-3">
                            <TouchableOpacity className="w-12 h-12 bg-slate-800/80 rounded-2xl items-center justify-center border border-slate-700 active:bg-slate-700">
                                <Ionicons name="chatbubble-ellipses" size={22} color="#CBD5E1" />
                            </TouchableOpacity>
                            <TouchableOpacity className="w-12 h-12 bg-[#FFD700] rounded-2xl items-center justify-center shadow-lg shadow-yellow-500/20 active:bg-[#FCD34D]">
                                <Ionicons name="call" size={22} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-800/80 w-full mb-6" />

                    {/* Trip Details Grid */}
                    <View className="flex-row justify-between mb-8 bg-slate-800/30 p-4 rounded-2xl border border-slate-700/30">
                        <View className="items-center">
                            <Ionicons name="time" size={18} color="#818CF8" style={{ marginBottom: 4 }} />
                            <Text className="text-white font-bold text-base">PREPAID</Text>
                            <Text className="text-slate-500 text-[8px] font-black uppercase">Payment</Text>
                        </View>
                        <View className="w-[1px] h-full bg-slate-700/50" />
                        <View className="items-center">
                            <Ionicons name="navigate" size={18} color="#818CF8" style={{ marginBottom: 4 }} />
                            <Text className="text-white font-bold text-base">4 mins</Text>
                            <Text className="text-slate-500 text-[8px] font-black uppercase">ETA</Text>
                        </View>
                        <View className="w-[1px] h-full bg-slate-700/50" />
                        <View className="items-center">
                            <Ionicons name="speedometer" size={18} color="#818CF8" style={{ marginBottom: 4 }} />
                            <Text className="text-white font-bold text-base">1.2 KM</Text>
                            <Text className="text-slate-500 text-[8px] font-black uppercase">Distance</Text>
                        </View>
                    </View>

                    {/* Location */}
                    <View className="flex-row items-center mb-8">
                        <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center border border-indigo-500/30 mr-4">
                            <Ionicons name="location" size={20} color="#818CF8" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Pickup Location</Text>
                            <Text className="text-white text-sm font-bold leading-5">Gate No. 4, Phoenix Palassio Mall, Gomti Nagar</Text>
                        </View>
                    </View>

                    {/* Arrive Button */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            router.push("/start-ride"); // Or rental specific start screen if needed
                        }}
                        className="w-full bg-[#FFD700] py-5 rounded-[24px] items-center flex-row justify-center shadow-lg shadow-yellow-500/20 relative overflow-hidden"
                    >
                        <Text className="text-[#0F172A] font-black text-lg tracking-[3px] uppercase mr-2">Arrived at Pickup</Text>
                        <Ionicons name="arrow-forward-circle" size={24} color="#0F172A" />
                    </TouchableOpacity>

                </LinearGradient>
            </View>
        </View>
    );
}
