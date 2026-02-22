import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Dimensions,
    Platform,
    StatusBar as RNStatusBar
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { driverAPI } from '../utils/api';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function RideDetailsScreen() {
    const router = useRouter();
    const { bookingId } = useLocalSearchParams();
    const [booking, setBooking] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (bookingId) {
            fetchBookingDetails();
        }
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            setLoading(true);
            const response = await driverAPI.getBookingById(bookingId as string);
            if (response.data && response.data.booking) {
                setBooking(response.data.booking);
            }
        } catch (error) {
            console.error("Error fetching booking details:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    if (!booking) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center p-6">
                <Text className="text-slate-400 text-center mb-4">Could not load ride details.</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-slate-900 px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />
            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm z-10">
                <View className="px-6 py-4 flex-row items-center">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100 mr-4"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Ride Details</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

                {/* ─── Status + Earnings Card ─── */}
                <View className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 mb-5 items-center">
                    <View className={`px-4 py-1.5 rounded-full mb-3 ${booking.status === 'completed' ? 'bg-green-50' : booking.status === 'cancelled' ? 'bg-red-50' : 'bg-blue-50'}`}>
                        <Text className={`text-xs font-black uppercase tracking-widest ${booking.status === 'completed' ? 'text-green-600' : booking.status === 'cancelled' ? 'text-red-500' : 'text-blue-600'}`}>
                            {booking.status}
                        </Text>
                    </View>

                    <Text className="text-slate-900 text-4xl font-black mb-1">₹{booking.totalFare || booking.fare}</Text>
                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-4">Total Earnings</Text>

                    {/* Badges row */}
                    <View className="flex-row flex-wrap justify-center">
                        {booking.rideType === 'outstation' && (
                            <View className="bg-purple-100 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                                <Ionicons name="car" size={11} color="#7c3aed" />
                                <Text className="text-purple-700 text-[9px] font-black ml-1 uppercase">Outstation</Text>
                            </View>
                        )}
                        {booking.bookingType === 'schedule' && (
                            <View className="bg-sky-100 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                                <Ionicons name="calendar" size={11} color="#0284c7" />
                                <Text className="text-sky-700 text-[9px] font-black ml-1 uppercase">Scheduled</Text>
                            </View>
                        )}
                        {!!booking.hasReturnTrip && (
                            <View className="bg-amber-100 px-3 py-1 rounded-full flex-row items-center mr-2 mb-2">
                                <Ionicons name="return-down-back" size={11} color="#b45309" />
                                <Text className="text-amber-700 text-[9px] font-black ml-1 uppercase">Return Trip</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ─── Scheduled Date Banner ─── */}
                {booking.bookingType === 'schedule' && booking.scheduledDate && (
                    <View className="bg-sky-900 rounded-[22px] p-4 mb-5 flex-row items-center">
                        <View className="bg-[#FFD700] p-2 rounded-xl mr-3">
                            <Ionicons name="calendar" size={18} color="black" />
                        </View>
                        <View>
                            <Text className="text-sky-300 text-[9px] font-black uppercase">Scheduled For</Text>
                            <Text className="text-white font-black text-sm">
                                {new Date(booking.scheduledDate).toLocaleString('en-IN', {
                                    weekday: 'short', day: '2-digit', month: 'short',
                                    hour: '2-digit', minute: '2-digit', hour12: true
                                })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ─── Return Trip Banner ─── */}
                {!!booking.hasReturnTrip && (
                    <View className="bg-amber-900 rounded-[22px] p-4 mb-5 flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-3">
                            <View className="bg-[#FFD700] p-2 rounded-xl mr-3">
                                <Ionicons name="return-down-back" size={18} color="black" />
                            </View>
                            <View className="flex-1">
                                <Text className="text-amber-300 text-[9px] font-black uppercase">Return Trip Route</Text>
                                <Text className="text-white font-black text-sm" numberOfLines={2}>
                                    {booking.dropLocation} → {booking.pickupLocation}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text className="text-amber-300 text-[9px] font-black uppercase">Fare</Text>
                            <Text className="text-[#FFD700] font-black text-xl">₹{booking.returnTripFare || 0}</Text>
                        </View>
                    </View>
                )}

                {/* ─── Route Section ─── */}
                <View className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 mb-5">
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-6">Route Details</Text>
                    <View className="pl-1 relative">
                        <View className="absolute left-[9px] top-4 bottom-4 w-[2px] bg-slate-100 border-l border-dashed border-slate-300" />
                        <View className="flex-row items-start mb-8">
                            <View className="w-5 h-5 rounded-full bg-blue-50 border-[3px] border-blue-100 items-center justify-center z-10">
                                <View className="w-2 h-2 rounded-full bg-blue-500" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Pickup</Text>
                                <Text className="text-slate-800 font-bold text-sm leading-5">{booking.pickupLocation}</Text>
                            </View>
                        </View>
                        <View className="flex-row items-start">
                            <View className="w-5 h-5 rounded-full bg-slate-900 border-[3px] border-slate-800 items-center justify-center z-10">
                                <View className="w-1.5 h-1.5 bg-white rounded-full" />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1">Drop-off</Text>
                                <Text className="text-slate-800 font-bold text-sm leading-5">{booking.dropLocation}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ─── Stats Grid ─── */}
                <View className="flex-row flex-wrap justify-between mb-5">
                    <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 w-[48%] mb-4">
                        <Ionicons name="calendar-outline" size={20} color="#94A3B8" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Date</Text>
                        <Text className="text-slate-800 font-bold text-xs">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>

                    <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 w-[48%] mb-4">
                        <Ionicons name="time-outline" size={20} color="#94A3B8" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Time</Text>
                        <Text className="text-slate-800 font-bold text-xs">
                            {new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </Text>
                    </View>

                    <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 w-[48%] mb-4">
                        <Ionicons name="navigate-outline" size={20} color="#94A3B8" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Distance</Text>
                        <Text className="text-slate-800 font-bold text-xs">{booking.distance} KM</Text>
                    </View>

                    <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 w-[48%] mb-4">
                        <Ionicons name="car-outline" size={20} color="#94A3B8" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Ride Type</Text>
                        <Text className="text-slate-800 font-bold text-xs uppercase">{booking.rideType}</Text>
                    </View>

                    {/* Base Fare */}
                    <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 w-[48%] mb-4">
                        <Ionicons name="cash-outline" size={20} color="#10b981" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Base Fare</Text>
                        <Text className="text-green-600 font-bold text-xs">₹{booking.fare || 0}</Text>
                    </View>

                    {/* Booking Type */}
                    <View className={`rounded-[24px] p-5 shadow-sm border w-[48%] mb-4 ${booking.bookingType === 'schedule' ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-100'}`}>
                        <Ionicons name={booking.bookingType === 'schedule' ? 'calendar' : 'flash'} size={20} color={booking.bookingType === 'schedule' ? '#0284c7' : '#f59e0b'} />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Booking</Text>
                        <Text className={`font-bold text-xs ${booking.bookingType === 'schedule' ? 'text-sky-700' : 'text-slate-800'}`}>
                            {booking.bookingType === 'schedule' ? '🗓️ Scheduled' : '⚡ Ride Now'}
                        </Text>
                    </View>

                    {/* Return Trip */}
                    <View className={`rounded-[24px] p-5 shadow-sm border w-[48%] mb-4 ${!!booking.hasReturnTrip ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
                        <Ionicons name="return-down-back" size={20} color={!!booking.hasReturnTrip ? '#b45309' : '#94A3B8'} />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Return Trip</Text>
                        <Text className={`font-bold text-xs ${!!booking.hasReturnTrip ? 'text-amber-700' : 'text-slate-400'}`}>
                            {!!booking.hasReturnTrip ? `✅ Yes  ₹${booking.returnTripFare || 0}` : '❌ No'}
                        </Text>
                    </View>

                    {/* Penalty */}
                    {(booking.penaltyApplied || 0) > 0 && (
                        <View className="bg-red-50 rounded-[24px] p-5 shadow-sm border border-red-100 w-[48%] mb-4">
                            <Ionicons name="warning-outline" size={20} color="#ef4444" />
                            <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Penalty</Text>
                            <Text className="text-red-600 font-bold text-xs">₹{booking.penaltyApplied}</Text>
                        </View>
                    )}

                    {/* Payment */}
                    <View className="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 w-[48%] mb-4">
                        <Ionicons name="wallet-outline" size={20} color="#94A3B8" />
                        <Text className="text-slate-400 text-[10px] font-bold uppercase mb-1 mt-2">Payment</Text>
                        <Text className="text-slate-800 font-bold text-xs uppercase">
                            {booking.paymentStatus} · {booking.paymentMethod || 'Cash'}
                        </Text>
                    </View>
                </View>

                {/* ─── Rating ─── */}
                {booking.status === 'completed' && (
                    <View className="bg-white rounded-[30px] p-6 shadow-sm border border-slate-100 mb-6">
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Customer Review</Text>
                            {booking.rating > 0 ? (
                                <View className="flex-row items-center bg-[#FFFBEB] px-3 py-1 rounded-full border border-[#FEF3C7]">
                                    <Ionicons name="star" size={14} color="#F59E0B" />
                                    <Text className="text-[#B45309] text-xs font-black ml-1">{booking.rating}.0</Text>
                                </View>
                            ) : (
                                <View className="bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase">Pending Review</Text>
                                </View>
                            )}
                        </View>
                        {booking.rating > 0 && (
                            <Text className="text-slate-600 italic text-sm leading-6">
                                {booking.feedback ? `"${booking.feedback}"` : 'No written feedback provided.'}
                            </Text>
                        )}
                    </View>
                )}

                {/* Active Ride Shortcut for Driver */}
                {!['completed', 'cancelled'].includes(booking.status) && (
                    <TouchableOpacity
                        onPress={() => {
                            const status = booking.status;
                            if (status === 'accepted' || status === 'arrived') {
                                router.replace({ pathname: "/pickup", params: { bookingId } });
                            } else if (status === 'started') {
                                router.replace({ pathname: "/active-ride", params: { bookingId } });
                            } else if (status === 'waiting') {
                                router.replace({ pathname: "/waiting-for-return", params: { bookingId: bookingId } });
                            } else if (status === 'return_ride_started') {
                                router.replace({ pathname: "/active-ride", params: { bookingId, mode: 'return' } });
                            }
                        }}
                        className="bg-[#000] rounded-2xl py-4 items-center justify-center shadow-lg shadow-slate-200 flex-row"
                    >
                        <MaterialCommunityIcons name="steering" size={20} color="#FFD700" />
                        <Text className="font-black text-[#FFD700] ml-2 uppercase tracking-widest">Back to Active Ride</Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
}
