import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Alert, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from "expo-router";
import { bookingAPI } from '../../utils/api';
import { getSocket, initSocket } from '../../utils/socket';

const { width } = Dimensions.get('window');

const WaitingTimerScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookingId = params.bookingId as string;

    const [booking, setBooking] = useState<any>(null);
    const [secondsElapsed, setSecondsElapsed] = useState(0);

    const fetchData = useCallback(async () => {
        try {
            const res = await bookingAPI.getBookingStatus(bookingId);
            if (res.data.success) {
                const b = res.data.booking;
                setBooking(b);

                if (b.waitingStartedAt) {
                    const start = new Date(b.waitingStartedAt).getTime();
                    const now = new Date().getTime();
                    setSecondsElapsed(Math.floor((now - start) / 1000));
                }

                if (b.status === 'return_ride_started') {
                    router.replace({
                        pathname: "/screens/LiveRideTrackingScreen",
                        params: { bookingId }
                    });
                }
            }
        } catch (error) {
            console.error("Fetch Error:", error);
        }
    }, [bookingId, router]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000); // Polling every 10s as fallback

        let socket: any;
        const setupSocket = async () => {
            socket = await initSocket();
            if (socket) {
                socket.on("penaltyApplied", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        setBooking((prev: any) => prev ? ({ ...prev, penaltyApplied: data.penaltyApplied }) : prev);
                    }
                });
                socket.on("rideStatusUpdate", (data: any) => {
                    if (String(data.bookingId) === String(bookingId) && data.status === 'return_ride_started') {
                        router.replace({ pathname: "/screens/LiveRideTrackingScreen", params: { bookingId } });
                    }
                });
            }
        };
        setupSocket();

        return () => {
            clearInterval(interval);
            if (socket) {
                socket.off("penaltyApplied");
                socket.off("rideStatusUpdate");
            }
        };
    }, [fetchData, bookingId, router]);

    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsElapsed(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (totalSeconds: number) => {
        const absSeconds = Math.abs(totalSeconds);
        const h = Math.floor(absSeconds / 3600);
        const m = Math.floor((absSeconds % 3600) / 60);
        const s = absSeconds % 60;
        const prefix = totalSeconds < 0 ? "-" : "";
        return `${prefix}${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const waitingLimit = booking?.waitingLimit || 3600;
    const timeLeft = waitingLimit - secondsElapsed;
    const isOverdue = timeLeft < 0;

    const handleCall = () => {
        if (booking?.driver?.mobile) {
            Linking.openURL(`tel:${booking.driver.mobile}`);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1 px-6 pt-4">

                <View className="flex-row justify-between items-center mb-10">
                    <TouchableOpacity onPress={() => router.back()} className="bg-slate-100 p-3 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-lg font-black text-slate-900">WAITING FOR RETURN</Text>
                    <View className="w-10" />
                </View>

                <View className="items-center justify-center flex-1 -mt-20">
                    <Animated.View
                        entering={ZoomIn.duration(600).springify()}
                        className="w-64 h-64 rounded-full border-[6px] border-slate-100 items-center justify-center relative bg-white shadow-2xl shadow-slate-200"
                    >
                        <View className={`absolute top-0 w-full h-full rounded-full border-[6px] ${isOverdue ? 'border-red-500' : 'border-[#FFD700]'} opacity-30`} />

                        <View className="items-center">
                            <Text className="text-slate-400 text-sm font-bold tracking-widest uppercase mb-2">
                                {isOverdue ? 'Penalty Time' : 'Remaining Free Time'}
                            </Text>
                            <Text className={`text-5xl font-black ${isOverdue ? 'text-red-500' : 'text-slate-900'} tracking-tighter`}>
                                {formatTime(timeLeft)}
                            </Text>
                            {isOverdue && (
                                <Text className="text-red-600 font-black text-xl mt-2">
                                    Penalty: ₹{booking?.penaltyApplied || 0}
                                </Text>
                            )}
                            <Text className="text-slate-400 text-xs font-bold mt-2">HH : MM : SS</Text>
                        </View>
                    </Animated.View>

                    <Animated.View
                        entering={FadeIn.delay(300)}
                        className={`${isOverdue ? 'bg-red-500' : 'bg-[#FFD700]'} px-6 py-3 rounded-full mt-8 shadow-lg items-center flex-row`}
                    >
                        <Text className="text-white font-black tracking-wide uppercase">
                            {isOverdue ? 'Penalty Mode Active' : 'Driver is Waiting'}
                        </Text>
                    </Animated.View>

                    <Text className="text-slate-400 text-center mt-6 px-10 leading-5">
                        Your driver is currently waiting at the destination.
                        Return trip will start once you notify the driver.
                    </Text>
                </View>

                <View className="mb-6">
                    <View className="bg-slate-50 p-4 rounded-3xl border border-slate-100 flex-row items-center mb-4">
                        <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center border-2 border-white overflow-hidden">
                            {booking?.driver?.profileImage ? (
                                <Image source={{ uri: booking.driver.profileImage }} className="w-full h-full" />
                            ) : (
                                <Ionicons name="person" size={24} color="#64748B" />
                            )}
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className="font-black text-slate-900">{booking?.driver?.name || "Driver"}</Text>
                            <Text className="text-xs font-bold text-slate-500">{booking?.driver?.vehicleModel || "Car"}</Text>
                        </View>
                        <TouchableOpacity onPress={handleCall} className="bg-green-500 p-3 rounded-full shadow-lg active:scale-95">
                            <Ionicons name="call" size={20} color="white" />
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        onPress={() => Alert.alert("Coming?", "Notify the driver that you are coming.", [{ text: "Cancel" }, { text: "Notify", onPress: () => { } }])}
                        className="bg-slate-900 w-full py-4 rounded-2xl items-center shadow-lg active:scale-95"
                    >
                        <Text className="text-[#FFD700] font-black text-lg">I'M COMING NOW</Text>
                    </TouchableOpacity>
                </View>

            </SafeAreaView>
        </View>
    );
};

export default WaitingTimerScreen;
