import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    FlatList
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import { driverAPI } from '../utils/api';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function EarningsScreen() {
    const router = useRouter();
    const [earnings, setEarnings] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    const [requesting, setRequesting] = React.useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const fetchEarnings = async () => {
                try {
                    const response = await driverAPI.getEarnings();
                    if (response.data && response.data.earnings) {
                        setEarnings(response.data.earnings);
                    }
                } catch (error) {
                    console.error("Error fetching earnings:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchEarnings();
        }, [])
    );

    const handleRequestPayout = async () => {
        if (!earnings?.totalEarnings || earnings.totalEarnings <= 0) {
            return Alert.alert("Insufficient Balance", "You don't have enough earnings to request a payout.");
        }

        Alert.alert(
            "Request Payout",
            `Are you sure you want to request a payout of ₹${earnings.totalEarnings}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        setRequesting(true);
                        try {
                            const res = await driverAPI.requestPayout(earnings.totalEarnings);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert("Success", "Your payout request has been submitted successfully!");
                            // Refresh data
                            const response = await driverAPI.getEarnings();
                            if (response.data && response.data.earnings) {
                                setEarnings(response.data.earnings);
                            }
                        } catch (err: any) {
                            Alert.alert("Error", err.response?.data?.message || "Failed to submit payout request");
                        } finally {
                            setRequesting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm">
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Earnings</Text>
                    <View className="w-10" />
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24 }}>
                {/* Total Balance Card */}
                <View className="bg-slate-900 rounded-[32px] p-8 mb-8 shadow-xl shadow-slate-900/30 overflow-hidden relative">
                    <View className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFD700] rounded-full opacity-10" />
                    <Text className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mb-2">Total Earnings</Text>
                    <View className="flex-row items-baseline">
                        <Text className="text-white text-4xl font-black italic">₹{earnings?.totalEarnings || 0}</Text>
                        <Text className="text-[#FFD700] ml-2 font-bold mb-1">ALL TIME</Text>
                    </View>

                    <View className="flex-row justify-between mt-8 pt-6 border-t border-white/10">
                        <View>
                            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Today</Text>
                            <Text className="text-white text-xl font-black italic">₹{earnings?.todayEarnings || 0}</Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Average / Trip</Text>
                            <Text className="text-white text-xl font-black italic">₹{earnings?.averageFare || 0}</Text>
                        </View>
                    </View>
                </View>

                {/* Grid Stats */}
                <View className="flex-row mb-8">
                    <View className="flex-1 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm items-center mr-2">
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="car" size={20} color="#3B82F6" />
                        </View>
                        <Text className="text-slate-900 text-2xl font-black">{earnings?.totalTrips || 0}</Text>
                        <Text className="text-slate-400 text-[9px] font-bold uppercase mt-1">Total Trips</Text>
                    </View>
                    <View className="flex-1 bg-white p-6 rounded-[28px] border border-slate-100 shadow-sm items-center ml-2">
                        <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="time" size={20} color="#22C55E" />
                        </View>
                        <Text className="text-slate-900 text-2xl font-black">{earnings?.onlineHours || '0.0'}</Text>
                        <Text className="text-slate-400 text-[9px] font-bold uppercase mt-1">Online Hours</Text>
                    </View>
                </View>

                <View className="flex-row justify-between items-center mb-6">
                    <Text className="text-slate-900 font-black text-base uppercase tracking-wider">Activities</Text>
                    <View className="flex-row">
                        <TouchableOpacity
                            onPress={async () => {
                                setLoading(true);
                                try {
                                    const response = await driverAPI.getEarnings('day');
                                    if (response.data && response.data.earnings) {
                                        setEarnings(response.data.earnings);
                                    }
                                } catch (e) {
                                    console.log("Filter error:", e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className={`px-4 py-1.5 rounded-full border mr-2 ${earnings?.period === 'day' ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                        >
                            <Text className={`text-[10px] font-black uppercase ${earnings?.period === 'day' ? 'text-[#FFD700]' : 'text-slate-500'}`}>Day</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={async () => {
                                setLoading(true);
                                try {
                                    const response = await driverAPI.getEarnings('week');
                                    if (response.data && response.data.earnings) {
                                        setEarnings(response.data.earnings);
                                    }
                                } catch (e) {
                                    console.log("Filter error:", e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className={`px-4 py-1.5 rounded-full border mr-2 ${earnings?.period === 'week' ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                        >
                            <Text className={`text-[10px] font-black uppercase ${earnings?.period === 'week' ? 'text-[#FFD700]' : 'text-slate-500'}`}>Week</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={async () => {
                                setLoading(true);
                                try {
                                    const response = await driverAPI.getEarnings('month');
                                    if (response.data && response.data.earnings) {
                                        setEarnings(response.data.earnings);
                                    }
                                } catch (e) {
                                    console.log("Filter error:", e);
                                } finally {
                                    setLoading(false);
                                }
                            }}
                            className={`px-4 py-1.5 rounded-full border ${earnings?.period === 'month' ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                        >
                            <Text className={`text-[10px] font-black uppercase ${earnings?.period === 'month' ? 'text-[#FFD700]' : 'text-slate-500'}`}>Month</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {earnings?.activities && earnings.activities.length > 0 ? (
                    earnings.activities.map((item: any) => (
                        <View key={item.id} className="bg-white rounded-[24px] p-5 mb-4 border border-slate-50 flex-row items-center justify-between shadow-sm">
                            <View className="flex-row items-center">
                                <View className={`w-12 h-12 ${item.status === 'completed' ? 'bg-green-50' : 'bg-amber-50'} rounded-2xl items-center justify-center border border-slate-100`}>
                                    <Ionicons
                                        name={item.status === 'completed' ? "checkmark-circle-outline" : "time-outline"}
                                        size={24}
                                        color={item.status === 'completed' ? "#22C55E" : "#F59E0B"}
                                    />
                                </View>
                                <View className="ml-4">
                                    <Text className="text-slate-900 font-bold text-sm">Payout Request ({item.status})</Text>
                                    <Text className="text-slate-400 text-[10px] uppercase font-bold mt-0.5">
                                        {new Date(item.date).toLocaleDateString()} • {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Text>
                                </View>
                            </View>
                            <Text className={`${item.status === 'rejected' ? 'text-red-500' : 'text-slate-900'} font-black`}>-₹{item.amount}</Text>
                        </View>
                    ))
                ) : (
                    <View className="bg-white rounded-[24px] p-8 mb-4 border border-slate-50 items-center justify-center shadow-sm">
                        <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                        <Text className="text-slate-400 font-bold mt-2">No recent activities</Text>
                    </View>
                )}

                <TouchableOpacity
                    onPress={handleRequestPayout}
                    disabled={requesting || loading}
                    className={`${requesting || loading ? 'bg-slate-400' : 'bg-slate-900'} py-5 rounded-[24px] items-center mt-4 active:scale-95`}
                >
                    <Text className="text-[#FFD700] font-black text-base uppercase tracking-[2px]">
                        {requesting ? 'Requesting...' : 'Request Payout'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}
