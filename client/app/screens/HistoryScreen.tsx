import React from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import ActivitySection from '../../components/ActivitySection';

const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;

const HistoryScreen = () => {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-slate-50" style={{ paddingTop: Platform.OS === 'android' ? STATUSBAR_HEIGHT : 0 }}>
            {/* Header */}
            <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-slate-100">
                <View>
                    <Text className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] mb-1">Your Journey</Text>
                    <Text className="text-3xl font-black text-slate-900">Activities</Text>
                </View>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-12 h-12 bg-slate-50 rounded-2xl items-center justify-center border border-slate-100"
                >
                    <Ionicons name="close-outline" size={28} color="#0F172A" />
                </TouchableOpacity>
            </View>

            {/* Content */}
            <View className="flex-1">
                <ActivitySection onBookRide={() => router.push("/")} />
            </View>
        </SafeAreaView>
    );
};

export default HistoryScreen;
