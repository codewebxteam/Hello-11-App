import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

export default function RideSummaryScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Default values if params missing (safe fallback)
    const fare = params.fare || "450";
    const penalty = params.penalty || "0";
    const totalAmount = params.totalAmount || "450";
    const distance = params.distance || "12.4";
    const time = params.time || "24";

    const handleExit = () => {
        // Reset to dashboard with rideEnded flag
        router.dismissAll();
        router.replace({ pathname: "/", params: { rideEnded: 'true' } });
    };

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24 }}>

                    {/* Success Animation Placeholder */}
                    <View className="items-center mb-8 mt-4">
                        <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center border border-green-500/50 mb-4 shadow-[0_0_30px_rgba(34,197,94,0.3)]">
                            <Ionicons name="checkmark" size={40} color="#4ADE80" />
                        </View>
                        <Text className="text-white text-3xl font-black italic tracking-tight">Ride Completed</Text>
                        <Text className="text-slate-400 text-sm mt-1">Payment Verified Successfully</Text>
                    </View>

                    {/* Trip Summary Card */}
                    <LinearGradient
                        colors={['#1E293B', '#1E293B']}
                        className="rounded-[28px] p-6 border border-slate-700/50 shadow-xl mb-6"
                    >
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6 border-b border-slate-700/50 pb-4">Trip Summary</Text>

                        <View className="flex-row justify-between mb-2">
                            <View>
                                <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Distance</Text>
                                <Text className="text-white text-xl font-black">{distance} KM</Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-500 text-[10px] font-bold uppercase mb-1">Total Time</Text>
                                <Text className="text-white text-xl font-black">{time} Min</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Fare Breakdown */}
                    <View className="bg-slate-800/50 rounded-[24px] p-6 border border-slate-700/30">
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Fare Breakdown</Text>

                        <View className="flex-row justify-between mb-3">
                            <Text className="text-slate-300 text-sm font-medium">Base Fare</Text>
                            <Text className="text-white text-sm font-bold">₹{fare}</Text>
                        </View>

                        {Number(penalty) > 0 && (
                            <View className="flex-row justify-between mb-3">
                                <Text className="text-red-400 text-sm font-medium">Waiting Penalty</Text>
                                <Text className="text-red-400 text-sm font-bold">+ ₹{penalty}</Text>
                            </View>
                        )}

                        <View className="flex-row justify-between mb-3">
                            <Text className="text-slate-300 text-sm font-medium">Taxes & Fees</Text>
                            <Text className="text-white text-sm font-bold">₹0</Text>
                        </View>

                        <View className="h-[1px] bg-slate-700 w-full my-4" />

                        <View className="flex-row justify-between items-center">
                            <Text className="text-white text-lg font-black">Total Earned</Text>
                            <Text className="text-[#FFD700] text-3xl font-black">₹{totalAmount}</Text>
                        </View>
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Button */}
            <View className="absolute bottom-0 w-full p-6 bg-slate-900 border-t border-slate-800" style={{ paddingBottom: insets.bottom + 20 }}>
                <TouchableOpacity
                    onPress={handleExit}
                    className="w-full bg-slate-800 py-5 rounded-[24px] items-center border border-slate-700 active:bg-slate-700"
                >
                    <Text className="text-white font-black text-lg tracking-[2px] uppercase">Back to Dashboard</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
