import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { driverAPI } from '../utils/api';
import { getSocket } from '../utils/socket';

// Constants
const PENALTY_RATE_PER_HOUR = 100; // ₹100 per extra hour

export default function WaitingForReturnScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const bookingId = params.bookingId as string;

    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState<any>(null);
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    const fetchData = async () => {
        try {
            const res = await driverAPI.getBookingStatus(bookingId);
            if (res.data.success) {
                const b = res.data.booking;
                setBooking(b);

                if (b.waitingStartedAt) {
                    const start = new Date(b.waitingStartedAt).getTime();
                    const now = new Date().getTime();
                    setSecondsElapsed(Math.floor((now - start) / 1000));
                }
            }
        } catch (err) {
            console.error("Fetch booking error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        // Setup Socket for penalty updates
        let socket: any;
        const initSocket = async () => {
            socket = await getSocket();
            if (socket) {
                socket.on("penaltyApplied", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        setBooking((prev: any) => ({
                            ...prev,
                            penaltyApplied: data.penaltyApplied,
                            fare: data.totalFare
                        }));
                    }
                });
            }
        };
        initSocket();

        // Status polling fallback every 30s
        const poll = setInterval(fetchData, 30000);

        return () => {
            clearInterval(poll);
            if (socket) socket.off("penaltyApplied");
        };
    }, [bookingId]);

    const waitingLimit = booking?.waitingLimit || 3600;
    const remainingSeconds = waitingLimit - secondsElapsed;
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

    const handleStartReturnRide = () => {
        Alert.alert(
            "Start Return Ride?",
            "Is the passenger ready to return?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Start",
                    onPress: async () => {
                        try {
                            await driverAPI.updateBookingStatus(bookingId, 'return_ride_started');
                            router.replace({
                                pathname: "/active-ride",
                                params: {
                                    mode: 'return',
                                    penalty: booking?.penaltyApplied || '0',
                                    bookingId: bookingId
                                }
                            });
                        } catch (error) {
                            console.error("Failed to start return ride:", error);
                            Alert.alert("Error", "Could not start return ride. Please try again.");
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-900 items-center justify-center">
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <View className={`flex-1 ${isPenaltyActive ? 'bg-red-900' : 'bg-slate-900'}`} style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <StatusBar style="light" />

            <View className="px-6 py-4 border-b border-white/10">
                <Text className="text-white/70 text-sm font-bold uppercase tracking-widest text-center">
                    {isPenaltyActive ? "⚠️ PENALTY MODE ACTIVE" : "Waiting for Passenger"}
                </Text>
            </View>

            <View className="flex-1 items-center justify-center px-6">
                <View className={`w-64 h-64 rounded-full items-center justify-center border-8 mb-10 ${isPenaltyActive ? 'border-red-500 bg-red-500/10' : 'border-[#FFD700] bg-[#FFD700]/10'}`}>
                    <Text className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                        {isPenaltyActive ? "Overdue Time" : "Time Remaining"}
                    </Text>
                    <Text className={`text-5xl font-black ${isPenaltyActive ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(remainingSeconds)}
                    </Text>
                    {isPenaltyActive && (
                        <Text className="text-white/50 text-xs font-bold mt-2">
                            + ₹{booking?.penaltyApplied || 0}
                        </Text>
                    )}
                </View>

                <View className="w-full bg-slate-800/50 p-6 rounded-[32px] border border-white/10 mb-8">
                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Current Billing</Text>

                    <View className="flex-row justify-between mb-2">
                        <Text className="text-slate-400 font-bold">Outbound Trip</Text>
                        <Text className="text-white font-black">₹{booking?.fare || 0}</Text>
                    </View>

                    {Number(booking?.penaltyApplied) > 0 && (
                        <View className="flex-row justify-between mb-4">
                            <Text className="text-red-400 font-bold">Waiting Charges</Text>
                            <Text className="text-red-400 font-black">+ ₹{booking?.penaltyApplied || 0}</Text>
                        </View>
                    )}

                    <View className="border-t border-slate-700/50 pt-4 flex-row justify-between items-center">
                        <Text className="text-white text-sm font-black uppercase tracking-wider">Estimated Total</Text>
                        <Text className="text-[#FFD700] text-3xl font-black italic">₹{(Number(booking?.fare || 0) + Number(booking?.penaltyApplied || 0))}</Text>
                    </View>
                </View>

                <View className="w-full flex-row gap-4 mb-4">
                    <View className="flex-1 bg-slate-800/50 p-4 rounded-2xl border border-white/10 items-center">
                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Allocated Wait</Text>
                        <Text className="text-white text-xl font-bold">{Math.round(waitingLimit / 60)} Min</Text>
                    </View>
                </View>

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
