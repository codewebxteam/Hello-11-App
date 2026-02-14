import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Animated, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { height, width } = Dimensions.get('window');

export default function RentalRequestScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const slideAnim = useRef(new Animated.Value(height)).current;

    useEffect(() => {
        // Slide up animation on mount
        Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 7,
            useNativeDriver: true
        }).start();

        // Trigger haptics only (NO SOUND)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }, []);

    const handleAccept = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate to Rental Booked screen
        router.push("/rental-booked");
    };

    const handleDecline = () => {
        router.back();
    };

    return (
        <View className="flex-1 bg-slate-900/80 justify-end">
            <StatusBar style="light" />

            {/* Backdrop Tap to Decline */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleDecline}
                className="absolute inset-0"
            />

            <Animated.View
                style={{ transform: [{ translateY: slideAnim }] }}
                className="w-full"
            >
                {/* Main Card Container */}
                <LinearGradient
                    colors={['#1E1B4B', '#0F172A']}
                    className="rounded-t-[40px] shadow-2xl border-t border-indigo-500/30 overflow-hidden"
                    style={{ paddingBottom: insets.bottom + 20 }}
                >
                    {/* Top Bar Decoration */}
                    <View className="w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

                    <View className="px-6 pt-8">
                        {/* Header Section */}
                        <View className="flex-row justify-between items-start mb-8">
                            <View>
                                <View className="flex-row gap-3 mb-3">
                                    <View className="bg-[#6366F1] px-3 py-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                                        <Text className="text-white text-[10px] font-black uppercase tracking-wider">Rental Request</Text>
                                    </View>
                                    <View className="bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                                        <Text className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Direct Booking</Text>
                                    </View>
                                </View>
                                <Text className="text-white text-5xl font-black italic tracking-tighter">₹2,450</Text>
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-[3px] mt-1 pl-1">Est. Earnings</Text>
                            </View>

                            {/* Package Badge */}
                            <View className="bg-slate-800/50 p-4 rounded-2xl border border-white/10 items-center min-w-[80px]">
                                <Ionicons name="time" size={20} color="#818CF8" style={{ marginBottom: 4 }} />
                                <Text className="text-white font-black text-xl">8 Hr</Text>
                                <Text className="text-slate-400 text-[8px] uppercase font-bold tracking-wider">Package</Text>
                            </View>
                        </View>

                        {/* Location Card */}
                        <View className="bg-slate-800/40 p-5 rounded-[28px] border border-white/5 mb-8">
                            <View className="flex-row items-center mb-6">
                                <View className="w-12 h-12 bg-[#6366F1]/20 rounded-full items-center justify-center mr-4 border border-[#6366F1]/20">
                                    <Ionicons name="location" size={24} color="#818CF8" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1.5">Pickup Location</Text>
                                    <Text className="text-white font-bold text-lg leading-6 pr-4">Gomti Nagar Extension, Lucknow</Text>
                                </View>
                            </View>

                            <View className="h-[1px] bg-white/10 w-full mb-4" />

                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Trip Type</Text>
                                    <Text className="text-white font-bold text-sm">Round Trip</Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-500 text-[9px] font-black uppercase tracking-wider mb-1">Total Distance</Text>
                                    <Text className="text-white font-bold text-sm">80 KM Included</Text>
                                </View>
                            </View>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-4 h-16">
                            <TouchableOpacity
                                onPress={handleDecline}
                                className="flex-1 bg-slate-800 rounded-[22px] items-center justify-center border border-slate-700 active:bg-slate-700"
                            >
                                <Text className="text-slate-300 font-bold text-xs uppercase tracking-[2px]">Decline</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleAccept}
                                className="flex-[2] bg-[#6366F1] rounded-[22px] items-center justify-center shadow-lg shadow-indigo-500/40 active:bg-indigo-600 active:scale-[0.98]"
                            >
                                <Text className="text-white font-black text-sm uppercase tracking-[3px]">Accept Rental</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </LinearGradient>
            </Animated.View>
        </View>
    );
}
