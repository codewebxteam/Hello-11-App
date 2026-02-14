import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RentalBookedScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        // Confirmation haptic
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, []);

    const handleNavigate = () => {
        router.push("/rental-pickup");
    };

    // Mock Date/Time (In real app, pass via params)
    const pickupDate = "Today";
    const pickupTime = "4:00 PM";

    return (
        <View className="flex-1 bg-[#0F172A]">
            <StatusBar style="light" />

            <View className="flex-1 px-6 justify-center items-center" style={{ paddingTop: insets.top, paddingBottom: insets.bottom + 20 }}>

                {/* Success Icon */}
                <View className="mb-10 items-center">
                    <View className="w-24 h-24 bg-green-500/20 rounded-full items-center justify-center mb-6 ring-4 ring-green-500/10">
                        <Ionicons name="checkmark" size={48} color="#4ADE80" />
                    </View>
                    <Text className="text-white text-3xl font-black text-center mb-2">Booking Confirmed</Text>
                    <Text className="text-slate-400 text-center text-base">You accepted the rental request.</Text>
                </View>

                {/* Booking Details Card */}
                <LinearGradient
                    colors={['#1E293B', '#1E293B']}
                    className="w-full rounded-[32px] p-6 border border-slate-700/50 shadow-2xl mb-10"
                >
                    <View className="flex-row items-center justify-between mb-8 pb-6 border-b border-slate-700/50">
                        <View>
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Pickup Date</Text>
                            <Text className="text-white text-xl font-bold">{pickupDate}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-2">Pickup Time</Text>
                            <Text className="text-[#FFD700] text-3xl font-black">{pickupTime}</Text>
                        </View>
                    </View>

                    <View className="bg-slate-900/50 rounded-2xl p-4 flex-row items-center justify-between border border-slate-800">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center mr-3">
                                <Ionicons name="car" size={20} color="#818CF8" />
                            </View>
                            <View>
                                <Text className="text-indigo-300 text-[10px] font-bold uppercase tracking-wider">Package</Text>
                                <Text className="text-white font-bold">8 Hr / 80 KM</Text>
                            </View>
                        </View>
                        <Text className="text-white font-black text-lg">₹2,450</Text>
                    </View>
                </LinearGradient>

                {/* Actions */}
                <TouchableOpacity
                    onPress={handleNavigate}
                    className="w-full bg-[#FFD700] py-5 rounded-[24px] items-center shadow-lg shadow-yellow-500/20 flex-row justify-center"
                >
                    <Ionicons name="navigate" size={20} color="#0F172A" style={{ marginRight: 10 }} />
                    <Text className="text-[#0F172A] font-black text-lg uppercase tracking-[2px]">Navigate to Pickup</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}
