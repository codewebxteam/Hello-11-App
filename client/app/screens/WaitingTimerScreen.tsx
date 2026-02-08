import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useRouter } from "expo-router";


const { width } = Dimensions.get('window');

interface WaitingTimerScreenProps {
    initialMinutes?: number;
    driverName?: string;
    carModel?: string;
    carNumber?: string;
}

const WaitingTimerScreen = ({
    initialMinutes = 0.1, // Set to 6 seconds for testing (0.1 mins)
    driverName = "Vikram Singh",

    carModel = "Swift Dzire",
    carNumber = "UP 32 HA 1947",
}: WaitingTimerScreenProps) => {
    const router = useRouter();

    const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // in seconds

    const [status, setStatus] = useState<'waiting' | 'warning' | 'expired'>('waiting');

    useEffect(() => {
        if (timeLeft <= 0) {
            setStatus('expired');
            router.replace("/screens/PenaltyAppliedScreen");
            return;
        }

        // Warning state when less than 2 minutes left

        if (timeLeft < 120 && status !== 'warning') {
            setStatus('warning');
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft, status]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getStatusColor = () => {
        switch (status) {
            case 'warning': return 'bg-orange-500';
            case 'expired': return 'bg-red-500';
            default: return 'bg-green-500';
        }
    };

    const getStatusText = () => {
        switch (status) {
            case 'warning': return 'Hurry Up! Time ending soon';
            case 'expired': return 'Waiting Time Expired';
            default: return 'Driver is Waiting';
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1 px-6 pt-4">

                {/* Header */}
                <View className="flex-row justify-between items-center mb-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="bg-slate-100 p-3 rounded-full"
                    >
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>

                    <Text className="text-lg font-black text-slate-900">RETURN TRIP</Text>
                    <View className="w-10" />
                </View>

                {/* Main Timer Display */}
                <View className="items-center justify-center flex-1 -mt-20">
                    <Animated.View
                        entering={ZoomIn.duration(600).springify()}
                        className="w-64 h-64 rounded-full border-[6px] border-slate-100 items-center justify-center relative bg-white shadow-2xl shadow-slate-200"
                    >
                        {/* Progress Ring Indicator (Static for now, could be SVG) */}
                        <View className={`absolute top-0 w-full h-full rounded-full border-[6px] ${status === 'warning' ? 'border-orange-500' : 'border-[#FFD700]'} opacity-30`} />

                        <View className="items-center">
                            <Text className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-2">Remaining Time</Text>
                            <Text className={`text-5xl font-black ${status === 'warning' ? 'text-orange-500' : 'text-slate-900'} tracking-tighter`}>
                                {formatTime(timeLeft)}
                            </Text>
                            <Text className="text-slate-400 text-xs font-bold mt-2">HH : MM : SS</Text>
                        </View>
                    </Animated.View>

                    {/* Status Badge */}
                    <Animated.View
                        entering={FadeIn.delay(300)}
                        className={`${getStatusColor()} px-6 py-3 rounded-full mt-8 shadow-lg items-center flex-row`}
                    >
                        <View className="bg-white/20 p-1 rounded-full mr-2">
                            <View className="bg-white w-2 h-2 rounded-full animate-pulse" />
                        </View>
                        <Text className="text-white font-black tracking-wide uppercase">{getStatusText()}</Text>
                    </Animated.View>

                    {/* Info Text */}
                    <Text className="text-slate-400 text-center mt-6 px-10 leading-5">
                        Your driver is waiting at the drop location.
                        Standard waiting charges apply after timer ends.
                    </Text>
                </View>

                {/* Driver Info & Actions */}
                <View className="mb-6">
                    <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-row items-center mb-4">
                        <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center border-2 border-white">
                            <Ionicons name="person" size={24} color="#64748B" />
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className="font-black text-slate-900">{driverName}</Text>
                            <Text className="text-xs font-bold text-slate-500">{carModel} • {carNumber}</Text>
                        </View>
                        <TouchableOpacity className="bg-green-500 p-3 rounded-full shadow-lg shadow-green-200 active:scale-95">
                            <Ionicons name="call" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity className="bg-slate-900 w-full py-4 rounded-2xl items-center shadow-lg active:scale-95">
                        <Text className="text-[#FFD700] font-black text-lg">I'M COMING NOW</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
};

export default WaitingTimerScreen;
