import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar, BackHandler } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
import Header from '../components/Header';

export default function PrivacyScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();

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

            <Header title="Privacy Policy" />

            <ScrollView className="flex-1 pt-6" contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: Math.max(60, insets.bottom + 20) }}>
                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px] mb-6 text-center">
                    How we handle your data safely
                </Text>
                
                <View className="bg-white p-5 rounded-[24px] mb-5 shadow-sm border border-slate-100">
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

                <View className="bg-white p-5 rounded-[24px] mb-5 shadow-sm border border-slate-100">
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

                <View className="bg-white p-5 rounded-[24px] mb-5 shadow-sm border border-slate-100">
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

                <View className="bg-slate-900 p-6 rounded-[24px] mt-4 shadow-lg">
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
