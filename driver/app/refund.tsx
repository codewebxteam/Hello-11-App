import React, { useEffect } from 'react';
import { View, Text, ScrollView, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import Header from '../components/Header';

export default function RefundScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, [router]);

    return (
        <View className="flex-1 bg-slate-50 relative">
            <StatusBar style="dark" />

            <Header title="Refund Policy" />

            <ScrollView className="flex-1 pt-6" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Math.max(60, insets.bottom + 20) }}>
                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-6 text-center">
                    Payment & Cancellation
                </Text>
                
                <View className="bg-red-50 p-5 rounded-[24px] mb-5 shadow-sm border border-red-100 items-center justify-center">
                    <View className="w-16 h-16 rounded-full bg-white items-center justify-center mb-4 shadow-sm">
                        <Ionicons name="close-circle" size={40} color="#DC2626" />
                    </View>
                    <Text className="text-xl font-black text-red-700 mb-2 uppercase tracking-widest text-center">Strictly Non-Refundable</Text>
                    <Text className="text-red-900/80 leading-6 text-center mb-4 font-semibold px-2">
                        All payments made towards Hello11 Partner Commission via the Razorpay gateway are strictly non-refundable.
                    </Text>
                    <Text className="text-red-900/80 leading-6 text-center font-semibold px-2">
                        Ride fares are paid directly to drivers. Hello11 does not collect ride payments from users and is not responsible for any fare refunds.
                    </Text>
                </View>

                <View className="bg-slate-900 p-6 rounded-[24px] mt-4 shadow-lg">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="alert-circle" size={24} color="#FFD700" />
                        <Text className="text-[#FFD700] font-black text-lg ml-3 tracking-wider uppercase">Contact Support</Text>
                    </View>
                    <Text className="text-white font-bold text-xl mb-1">+91 96289 11211</Text>
                    <Text className="text-slate-400 font-semibold tracking-wider">support@hello11.in</Text>
                </View>
            </ScrollView>
        </View>
    );
}
