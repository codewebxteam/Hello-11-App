import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

const RideCompletionScreen = () => {
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(false);

    // Simulate Driver Verification after 3 seconds
    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVerified(true);
        }, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">

                {/* Success / Status Animation Header */}
                <View className="items-center mt-10 mb-8">
                    <Animated.View
                        entering={ZoomIn.duration(600).springify()}
                        className={`w-24 h-24 rounded-full ${isVerified ? 'bg-green-100' : 'bg-slate-100'} items-center justify-center mb-4 border-4 ${isVerified ? 'border-green-500' : 'border-slate-200'}`}
                    >
                        {isVerified ? (
                            <Ionicons name="checkmark" size={48} color="#22c55e" />
                        ) : (
                            <Ionicons name="cash-outline" size={48} color="#64748B" />
                        )}
                    </Animated.View>

                    <Animated.View entering={FadeIn.delay(300)} className="items-center">
                        <Text className="text-2xl font-black text-slate-900 mb-1">
                            {isVerified ? "Payment Received" : "Collect Cash"}
                        </Text>
                        <Text className={`font-bold ${isVerified ? 'text-green-600' : 'text-slate-500'}`}>
                            {isVerified ? "Ride Verified by Driver" : "Payment to be collected by driver"}
                        </Text>
                    </Animated.View>
                </View>

                {/* Amount Card */}
                <View className="mx-6 bg-slate-900 rounded-3xl p-6 items-center shadow-xl shadow-slate-200 mb-8 relative overflow-hidden">
                    {/* Background Decoration */}
                    <View className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] rounded-full opacity-10 -mr-10 -mt-10" />
                    <View className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full opacity-10 -ml-10 -mb-10" />

                    <Text className="text-slate-400 font-bold tracking-widest uppercase text-xs mb-2">TOTAL FARE</Text>
                    <Text className="text-5xl font-black text-[#FFD700]">₹450</Text>

                    {!isVerified && (
                        <View className="mt-4 flex-row items-center bg-white/10 px-4 py-2 rounded-full">
                            <ActivityIndicator size="small" color="#FFD700" className="mr-2" />
                            <Text className="text-white text-xs font-bold">Awaiting driver verification...</Text>
                        </View>
                    )}
                </View>

                {/* Ride Summary */}
                <View className="mx-6 bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-auto">
                    <Text className="text-slate-500 font-bold text-xs uppercase mb-4 tracking-wider">Ride Summary</Text>

                    {/* Pickup */}
                    <View className="flex-row items-start mb-6 relative">
                        {/* Connecting Line */}
                        <View className="absolute left-[9px] top-6 bottom-[-24px] w-[2px] bg-slate-200" />

                        <View className="w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold text-base">Phoenix Palassio</Text>
                            <Text className="text-slate-500 text-xs">Amar Shaheed Path, Lucknow</Text>
                        </View>
                        <Text className="text-slate-900 font-black">10:42 AM</Text>
                    </View>

                    {/* Drop */}
                    <View className="flex-row items-start">
                        <View className="w-5 h-5 bg-red-500 rounded-full border-4 border-white shadow-sm mr-3 mt-1" />
                        <View className="flex-1">
                            <Text className="text-slate-900 font-bold text-base">Hazratganj Metro</Text>
                            <Text className="text-slate-500 text-xs">Hazratganj, Lucknow</Text>
                        </View>
                        <Text className="text-slate-900 font-black">11:15 AM</Text>
                    </View>
                </View>

                {/* Bottom Actions */}
                <View className="px-6 pb-6">
                    {isVerified ? (
                        <TouchableOpacity
                            onPress={() => router.replace("/screens/ThankYouScreen")}
                            className="bg-green-500 py-4 rounded-2xl items-center shadow-lg shadow-green-200 active:scale-95"
                        >
                            <Text className="text-white font-black text-lg">RATE DRIVER</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-slate-100 py-4 rounded-2xl items-center">
                            <Text className="text-slate-500 font-bold">Waiting for driver confirmation...</Text>
                        </View>
                    )}
                </View>

            </SafeAreaView>
        </View>
    );
};

export default RideCompletionScreen;
