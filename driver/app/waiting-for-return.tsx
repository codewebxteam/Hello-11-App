import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';

// Constants
const PENALTY_RATE_PER_HOUR = 100; // ₹100 per extra hour
const MINUTES_PER_KM = 12;

export default function WaitingForReturnScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Mock data - in real app, this would come from params or global state
    const rideDistance = parseFloat(params.distance as string) || 10; // Default 10km if not passed
    const allocatedMinutes = Math.ceil(rideDistance * MINUTES_PER_KM);

    // Timer State
    // unique logic: we track "seconds elapsed" vs "allocated seconds"
    // For demo/testing, we might want to speed this up, but here is "real" time logic.
    // To test penalty quickly, we can set initial elapsed time close to limit.
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    // const allocatedSeconds = allocatedMinutes * 60;
    const allocatedSeconds = 10; // FOR TESTING: 10 Seconds Wait Only
    const remainingSeconds = allocatedSeconds - secondsElapsed;
    const isPenaltyActive = remainingSeconds < 0;

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Format Helpers
    const formatTime = (totalSeconds: number) => {
        const absSeconds = Math.abs(totalSeconds);
        const h = Math.floor(absSeconds / 3600);
        const m = Math.floor((absSeconds % 3600) / 60);
        const s = absSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Calculate Penalty
    const penaltyAmount = useMemo(() => {
        if (!isPenaltyActive) return 0;
        const extraHours = Math.abs(remainingSeconds) / 3600;
        // Ceiling to nearest hour or exact fraction? Usually transport is by chunks or exact. 
        // Let's do exact fraction for display, or ceiling for billing. 
        // Requirement says "₹100 per extra hour", often implies pro-rata or blocks. 
        // Let's implement pro-rata for smoother UI updates, or simple blocks. 
        // User said "₹100 per extra hour", let's assume pro-rated for the display to see it increasing.
        return (extraHours * PENALTY_RATE_PER_HOUR).toFixed(2);
    }, [remainingSeconds, isPenaltyActive]);

    const handleStartReturnRide = () => {
        Alert.alert(
            "Start Return Ride?",
            "Is the passenger ready to return?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Start",
                    onPress: () => {
                        // Navigate back to active ride, but with "Return" state
                        router.replace({
                            pathname: "/active-ride",
                            params: {
                                mode: 'return',
                                penalty: penaltyAmount
                            }
                        });
                    }
                }
            ]
        );
    };

    return (
        <View className={`flex-1 ${isPenaltyActive ? 'bg-red-900' : 'bg-slate-900'}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <StatusBar style="light" />

            {/* Header */}
            <View className="px-6 py-4 border-b border-white/10">
                <Text className="text-white/70 text-sm font-bold uppercase tracking-widest text-center">
                    {isPenaltyActive ? "⚠️ PENALTY MODE ACTIVE" : "Waiting for Passenger"}
                </Text>
            </View>

            <View className="flex-1 items-center justify-center px-6">

                {/* Timer Display */}
                <View className={`w-64 h-64 rounded-full items-center justify-center border-8 mb-10 ${isPenaltyActive ? 'border-red-500 bg-red-500/10' : 'border-[#FFD700] bg-[#FFD700]/10'}`}>
                    <Text className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                        {isPenaltyActive ? "Overdue Time" : "Time Remaining"}
                    </Text>
                    <Text className={`text-5xl font-black ${isPenaltyActive ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(remainingSeconds)}
                    </Text>
                    {isPenaltyActive && (
                        <Text className="text-white/50 text-xs font-bold mt-2">
                            + ₹{penaltyAmount}
                        </Text>
                    )}
                </View>

                {/* Info Cards */}
                <View className="w-full flex-row gap-4 mb-8">
                    <View className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-white/10 items-center">
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Total Distance</Text>
                        <Text className="text-white text-xl font-bold">{rideDistance} KM</Text>
                    </View>
                    <View className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-white/10 items-center">
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Allocated Wait</Text>
                        <Text className="text-white text-xl font-bold">{allocatedMinutes} Min</Text>
                    </View>
                </View>

                {/* Penalty Notice */}
                {isPenaltyActive && (
                    <View className="w-full bg-red-500/20 p-4 rounded-2xl border border-red-500/50 mb-8 flex-row items-center justify-center">
                        <Ionicons name="warning" size={24} color="#EF4444" style={{ marginRight: 10 }} />
                        <View>
                            <Text className="text-red-400 font-bold text-sm uppercase">Penalty Apply Rate</Text>
                            <Text className="text-white font-bold text-lg">₹{PENALTY_RATE_PER_HOUR} / Hour</Text>
                        </View>
                    </View>
                )}

            </View>

            {/* Bottom Action */}
            <View className="px-6 pb-6">
                <TouchableOpacity
                    onPress={handleStartReturnRide}
                    className="w-full bg-[#FFD700] py-5 rounded-2xl items-center shadow-lg active:bg-[#F0C000]"
                >
                    <Text className="text-slate-900 font-black text-lg uppercase tracking-widest">
                        Start Return Ride
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
