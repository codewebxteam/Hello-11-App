import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function RefundScreen() {
    const router = useRouter();

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    return (
        <View className="flex-1 bg-slate-50 relative">
            <StatusBar style="dark" />

            <View className="bg-white shadow-sm z-10" style={{ paddingTop: STATUSBAR_HEIGHT }}>
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Refund Policy</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 pt-6" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
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
