import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, SlideInDown, ZoomIn } from 'react-native-reanimated';
import { useRouter } from "expo-router";

const { width } = Dimensions.get('window');

interface PenaltyAppliedScreenProps {
    baseFare?: number;
    penaltyAmount?: number;
    currency?: string;
}

const PenaltyAppliedScreen = ({
    baseFare = 450,
    penaltyAmount = 100,
    currency = "₹"
}: PenaltyAppliedScreenProps) => {
    const router = useRouter();
    const totalFare = baseFare + penaltyAmount;

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />

            {/* Alert Header Background */}
            <View className="bg-red-500 h-[35%] items-center justify-center relative overflow-hidden">
                {/* Abstract warning patterns */}
                <View className="absolute -top-10 -right-10 w-40 h-40 bg-red-400 rounded-full opacity-50" />
                <View className="absolute bottom-10 -left-10 w-20 h-20 bg-red-600 rounded-full opacity-50" />

                <Animated.View
                    entering={ZoomIn.duration(600).springify()}
                    className="bg-white/20 p-6 rounded-full border-4 border-white/30 mb-4"
                >
                    <Ionicons name="warning" size={48} color="white" />
                </Animated.View>

                <Animated.View entering={FadeIn.delay(300)}>
                    <Text className="text-white text-2xl font-black text-center mb-1">Waiting Time Exceeded</Text>
                    <Text className="text-white/80 font-bold text-center">Timer hit 00:00</Text>
                </Animated.View>
            </View>

            {/* Main Content Card */}
            <Animated.View
                entering={SlideInDown.duration(600).springify()}
                className="flex-1 bg-white -mt-10 rounded-t-[35px] px-8 pt-10"
            >
                {/* Penalty details */}
                <View className="items-center mb-8">
                    <Text className="text-slate-400 font-bold tracking-widest uppercase text-xs mb-2">PENALTY APPLIED</Text>
                    <Text className="text-5xl font-black text-red-500">{currency}{penaltyAmount}</Text>
                    <Text className="text-slate-400 font-bold text-xs mt-1">late fee (₹100/hr)</Text>
                </View>

                {/* Fare Breakdown */}
                <View className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-6">
                    <View className="flex-row justify-between mb-3">
                        <Text className="text-slate-500 font-bold">Base Return Fare</Text>
                        <Text className="text-slate-900 font-black">{currency}{baseFare}</Text>
                    </View>
                    <View className="flex-row justify-between mb-4 pb-4 border-b border-slate-200">
                        <Text className="text-red-500 font-bold">Waiting Penalty</Text>
                        <Text className="text-red-500 font-black">+{currency}{penaltyAmount}</Text>
                    </View>
                    <View className="flex-row justify-between items-center">
                        <Text className="text-slate-900 font-black text-lg">New Total Fare</Text>
                        <Text className="text-slate-900 font-black text-2xl">{currency}{totalFare}</Text>
                    </View>
                </View>

                {/* Info Note */}
                <View className="flex-row items-start bg-blue-50 p-4 rounded-xl mb-auto">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text className="flex-1 text-blue-800 text-xs font-bold ml-2 leading-5">
                        Waiting charges ensure drivers are compensated for their time. This amount will be added to your final bill.
                    </Text>
                </View>

                {/* Action Button */}
                <SafeAreaView edges={['bottom']} className="pb-4">
                    <TouchableOpacity
                        onPress={() => router.replace("/screens/HomeScreen")}
                        className="bg-slate-900 py-4 rounded-2xl items-center shadow-lg shadow-slate-300 active:scale-95"
                    >
                        <Text className="text-[#FFD700] font-black text-lg">ACCEPT & CONTINUE</Text>
                    </TouchableOpacity>
                </SafeAreaView>

            </Animated.View>
        </View>
    );
};

export default PenaltyAppliedScreen;
