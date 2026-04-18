import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, BackHandler, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function PrivacyScreen() {
    const { width } = useWindowDimensions();
    const isSmallPhone = width < 360;
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
        <View className="flex-1 bg-[#F8FAFC] relative">
            <StatusBar style="dark" />

            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm z-10">
                <View className={`${isSmallPhone ? 'px-4 py-3' : 'px-6 py-4'} flex-row items-center`}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100 mr-4"
                    >
                        <Ionicons name="arrow-back" size={20} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className={`text-slate-900 font-black tracking-wider uppercase ${isSmallPhone ? 'text-base' : 'text-[18px]'}`}>
                        Privacy Policy
                    </Text>
                </View>
            </View>

            <ScrollView className={`flex-1 ${isSmallPhone ? 'pt-4' : 'pt-6'}`} contentContainerStyle={{ paddingHorizontal: isSmallPhone ? 14 : 24, paddingBottom: 60 }}>
                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-6 text-center">
                    How we handle your data safely
                </Text>
                
                <View className={`bg-white ${isSmallPhone ? 'p-4 rounded-[16px]' : 'p-5 rounded-[24px]'} mb-5 shadow-sm border border-slate-100`}>
                    <View className="flex-row items-center mb-4 pb-4 border-b border-slate-50">
                        <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center mr-3">
                            <Ionicons name="location" size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-lg font-black text-slate-800">1. Location Access</Text>
                    </View>
                    
                    <View className="space-y-4">
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Users:</Text> We collect your location to find nearby cabs and track your ongoing ride safely.</Text>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6"><Text className="font-black text-slate-900">Drivers:</Text> The Driver App requires Background Location Access. This allows you to receive new ride requests even when the app is closed or running in the background.</Text>
                        </View>
                    </View>
                </View>

                <View className={`bg-white ${isSmallPhone ? 'p-4 rounded-[16px]' : 'p-5 rounded-[24px]'} mb-5 shadow-sm border border-slate-100`}>
                    <View className="flex-row items-center mb-4 pb-4 border-b border-slate-50">
                        <View className="w-10 h-10 rounded-full bg-purple-50 items-center justify-center mr-3">
                            <Ionicons name="notifications" size={20} color="#A855F7" />
                        </View>
                        <Text className="text-lg font-black text-slate-800 flex-1">2. Notifications & Background Running</Text>
                    </View>
                    
                    <View className="space-y-4">
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6">Drivers must allow the app to run in the background and send push notifications to ensure they never miss a ride request from nearby users.</Text>
                        </View>
                    </View>
                </View>

                <View className={`bg-white ${isSmallPhone ? 'p-4 rounded-[16px]' : 'p-5 rounded-[24px]'} mb-5 shadow-sm border border-slate-100`}>
                    <View className="flex-row items-center mb-4 pb-4 border-b border-slate-50">
                        <View className="w-10 h-10 rounded-full bg-green-50 items-center justify-center mr-3">
                            <Ionicons name="document-lock" size={20} color="#22C55E" />
                        </View>
                        <Text className="text-lg font-black text-slate-800">3. Document Privacy</Text>
                    </View>
                    
                    <View className="space-y-4">
                        <View className="flex-row items-start">
                            <View className="w-2 h-2 rounded-full bg-[#FFD700] mt-2 mr-3" />
                            <Text className="flex-1 text-slate-600 leading-6">Documents uploaded by drivers (DL, RC, Insurance) are kept highly secure. We only use them to verify your identity. Hello11 does not sell your personal data.</Text>
                        </View>
                    </View>
                </View>

                <View className={`bg-slate-900 ${isSmallPhone ? 'p-4 rounded-[16px]' : 'p-6 rounded-[24px]'} mt-4 shadow-lg`}>
                    <View className="flex-row items-center mb-3">
                        <Ionicons name="shield-checkmark" size={24} color="#FFD700" />
                        <Text className="text-[#FFD700] font-black text-lg ml-3 tracking-wider uppercase">Privacy Concerns?</Text>
                    </View>
                    <Text className="text-white font-bold text-xl mb-1">+91 96289 11211</Text>
                    <Text className="text-slate-400 font-semibold tracking-wider">support@hello11.in</Text>
                </View>
            </ScrollView>
        </View>
    );
}
