import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function TermsScreen() {
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

            {/* Header */}
            <View className="bg-white shadow-sm z-10" style={{ paddingTop: STATUSBAR_HEIGHT }}>
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Terms & Conditions</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1 pt-6" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 60 }}>
                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-6 text-center">
                    Official agreement for Users and Partner Drivers
                </Text>
                
                <View className="bg-white p-5 rounded-[24px] mb-5 shadow-sm border border-slate-100">
                    <View className="flex-row items-center mb-4 pb-4 border-b border-slate-50">
                        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                            <Ionicons name="person" size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-lg font-black text-slate-800">1. For Users (Riders)</Text>
                    </View>
                    
                    <View className="space-y-4">
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Fares & Extra Charges:</Text> You must pay the full fare shown in the app. Toll taxes and parking charges are extra and must be paid by you.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Waiting Time:</Text> For rides up to 40 KM, a free waiting time of 12 minutes is allowed. After that, a waiting charge of ₹100 per hour will apply.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Return Trips:</Text> You get up to 50% flat discount on return rides. If you book a return ride, the return fare is mandatory, even if you decide not to travel back.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Road Conditions:</Text> The cab will only go up to the point where the road is safe and motorable. Drivers can refuse to drive on bad roads.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Outstation:</Text> For outstation trips, you must cover the driver's basic food expenses.</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-white p-5 rounded-[24px] mb-5 shadow-sm border border-slate-100">
                    <View className="flex-row items-center mb-4 pb-4 border-b border-slate-50">
                        <View className="w-10 h-10 rounded-full bg-orange-50 items-center justify-center mr-3">
                            <Ionicons name="car" size={20} color="#F97316" />
                        </View>
                        <Text className="text-lg font-black text-slate-800">2. For Partner Drivers</Text>
                    </View>
                    
                    <View className="space-y-4">
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Documents Required:</Text> Valid Driving License, Vehicle Insurance, and Vehicle Registration (RC) are mandatory for verification.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Commission Rules:</Text> Hello11 charges a 12% commission on every ride. You will collect the full payment from the user directly.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Payment Block:</Text> You can accept a maximum of 3 rides without paying the commission. After 3 rides, you MUST pay the due commission to the admin via the Razorpay gateway in the Driver App to get new rides.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Ride Rules:</Text> Once you accept a ride, you cannot cancel it. If a user books a return trip, you must wait and bring them back. You must also keep your vehicle clean at all times.</Text>
                        </View>
                    </View>
                </View>

                <View className="bg-slate-900 p-6 rounded-[24px] mt-4 shadow-lg">
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="help-buoy" size={24} color="#FFD700" />
                        <Text className="text-[#FFD700] font-black text-lg ml-3 tracking-wider uppercase">Need Help?</Text>
                    </View>
                    <Text className="text-white font-bold text-xl mb-1">+91 96289 11211</Text>
                    <Text className="text-slate-400 font-semibold tracking-wider">support@hello11.in</Text>
                </View>
            </ScrollView>
        </View>
    );
}
