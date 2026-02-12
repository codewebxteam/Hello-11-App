import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, StatusBar as RNStatusBar, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

export default function ActiveRideScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const handleEndRide = () => {
        Alert.alert(
            "End Ride?",
            "Are you sure you have reached the destination?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, End Ride",
                    style: "destructive",
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        // Navigate back to root and reset state
                        router.dismissAll();
                        router.replace({ pathname: "/", params: { rideEnded: 'true' } });
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="dark" />

            {/* --- SIMULATED MAP BACKGROUND --- */}
            <View className="absolute inset-0 bg-[#E2E8F0] items-center justify-center overflow-hidden">
                {/* Fallback Map Background */}
                <View className="w-full h-full bg-slate-200" />

                {/* Route Line (Longer for ride) */}
                <View className="absolute w-[4px] h-[60%] bg-blue-500 rounded-full overflow-hidden top-[10%] right-[30%] transform -rotate-6 shadow-sm" />

                {/* Driver Car Marker (moving) */}
                <View className="absolute top-[40%] left-[45%] shadow-2xl">
                    <View className="bg-white p-2 rounded-full border-[3px] border-[#FFD700] shadow-lg">
                        <Ionicons name="car" size={28} color="#0F172A" />
                    </View>
                </View>

                {/* Destination Marker */}
                <View className="absolute top-[10%] right-[20%] shadow-2xl">
                    <View className="bg-white p-2 rounded-full border-[3px] border-red-500 shadow-lg">
                        <Ionicons name="flag" size={20} color="#0F172A" />
                    </View>
                    <View className="bg-white px-2 py-1 rounded-md absolute -top-8 -left-8 shadow-md border border-slate-100 w-20">
                        <Text className="text-slate-900 text-[10px] font-bold text-center">Destination</Text>
                    </View>
                </View>
            </View>

            {/* --- TOP BAR (NAVIGATION) --- */}
            <View className="absolute top-0 w-full z-10 pt-12 px-4">
                <View className="bg-[#0F172A] p-4 rounded-2xl shadow-2xl border border-slate-700/50 flex-row">
                    <View className="mr-4 bg-slate-800 p-3 rounded-xl items-center justify-center border border-slate-700">
                        <Ionicons name="arrow-redo" size={32} color="#FFF" />
                        <Text className="text-white text-[10px] font-bold mt-1">150m</Text>
                    </View>
                    <View className="flex-1 justify-center">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Next Turn</Text>
                        <Text className="text-white text-xl font-black leading-6">Turn right at Shaheed Path</Text>
                    </View>
                </View>
            </View>

            {/* --- BOTTOM SHEET (RIDE CONTROLS) --- */}
            <View className="absolute bottom-0 w-full z-20">
                <View
                    style={{ paddingBottom: insets.bottom + 20 }}
                    className="bg-[#0F172A] rounded-t-[40px] px-6 pt-8 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50"
                >
                    {/* Handle Indicator */}
                    <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-8 opacity-50" />

                    {/* Ride Progress */}
                    <View className="flex-row justify-between items-end mb-8">
                        <View>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Time Remaining</Text>
                            <Text className="text-white text-4xl font-black italic">24 <Text className="text-lg text-slate-500 not-italic">min</Text></Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Distance</Text>
                            <Text className="text-white text-4xl font-black italic">12.4 <Text className="text-lg text-slate-500 not-italic">km</Text></Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-800 w-full mb-8" />

                    {/* Passenger & End Ride */}
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-slate-700 rounded-full items-center justify-center border-2 border-slate-600 mr-3">
                                <Text className="text-xl">👩‍💼</Text>
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">Priya Sharma</Text>
                                <Text className="text-green-400 text-xs font-bold">Trip in Progress</Text>
                            </View>
                        </View>

                        <TouchableOpacity className="w-12 h-12 bg-slate-800 rounded-2xl items-center justify-center border border-slate-700">
                            <Ionicons name="shield-checkmark" size={24} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* End Ride Button */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={handleEndRide}
                        className="w-full bg-red-500 py-5 rounded-[24px] items-center flex-row justify-center shadow-lg shadow-red-500/20 mt-6"
                    >
                        <Ionicons name="stop-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
                        <Text className="text-white font-black text-lg tracking-[3px] uppercase">End Ride</Text>
                    </TouchableOpacity>

                </View>
            </View>

        </View>
    );
}
