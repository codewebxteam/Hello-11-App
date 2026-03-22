import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn, SlideInUp, ZoomIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from "expo-router";

const { width } = Dimensions.get('window');

const RideCompletionScreen = () => {
    const router = useRouter();
    const [isVerified, setIsVerified] = useState(true);

    const params = useLocalSearchParams();

    const bookingId = (params.bookingId as string) || "";
    const [bookingDetails, setBookingDetails] = useState({
        fare: params.fare || "0",
        totalFare: params.totalFare || params.fare || "0",
        penaltyApplied: 0,
        tollFee: 0,
        nightSurcharge: 0,
        returnTripFare: 0,
        hasReturnTrip: false,
        firstLegPaid: params.firstLegPaid === 'true',
        pickup: params.pickup || "---",
        drop: params.drop || "---",
        distance: params.distance || "0"
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchBooking = async () => {
            try {
                if (bookingId) {
                    const { bookingAPI } = require("../../utils/api");
                    const res = await bookingAPI.getBookingStatus(bookingId);
                    if (res.data && res.data.success) {
                        const b = res.data.booking;
                        setBookingDetails({
                            fare: b.fare ? b.fare.toString() : (params.fare as string || "0"),
                            totalFare: b.totalFare ? b.totalFare.toString() : (b.fare ? b.fare.toString() : "0"),
                            penaltyApplied: b.penaltyApplied || 0,
                            tollFee: b.tollFee || 0,
                            nightSurcharge: b.nightSurcharge || 0,
                            returnTripFare: b.returnTripFare || 0,
                            hasReturnTrip: b.hasReturnTrip || false,
                            firstLegPaid: b.firstLegPaid || false,
                            pickup: b.pickupLocation || (params.pickup as string || "---"),
                            drop: b.dropLocation || (params.drop as string || "---"),
                            distance: b.distance ? b.distance.toString() : (params.distance as string || "0")
                        });
                    }
                }
            } catch (error) {
                console.log("Error fetching booking details:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBooking();
    }, [bookingId, params.fare, params.pickup, params.drop, params.distance]);

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ paddingBottom: 100 }}
                    showsVerticalScrollIndicator={false}
                >
                    <View className="items-center mt-6 mb-8">
                        <Animated.View
                            entering={ZoomIn.duration(600).springify()}
                            className={`w-24 h-24 rounded-full ${isVerified ? 'bg-green-100' : 'bg-slate-100'} items-center justify-center mb-4 border-4 ${isVerified ? 'border-green-500' : 'border-slate-200'}`}
                        >
                            {isVerified ? (
                                <Ionicons name="checkmark" size={48} color="#22c55e" />
                            ) : (
                                <Ionicons name="cash-outline" size={48} color="#64748B" />
                            )}
                        </Animated.View>

                        <Animated.View entering={FadeIn.delay(300)} className="items-center">
                            <Text className="text-2xl font-black text-slate-900 mb-1">
                                {isVerified ? "Payment Success" : "Collect Cash"}
                            </Text>
                            <Text className={`font-bold ${isVerified ? 'text-green-600' : 'text-slate-500'}`}>
                                {isVerified ? "Ride verified by driver" : "Please pay the driver"}
                            </Text>
                        </Animated.View>
                    </View>

                    <View className="mx-6 bg-slate-900 rounded-3xl p-6 items-center shadow-xl shadow-slate-200 mb-6 relative overflow-hidden">
                        <View className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] rounded-full opacity-10 -mr-10 -mt-10" />
                        <View className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full opacity-10 -ml-10 -mb-10" />

                        <Text className="text-slate-400 font-bold tracking-widest uppercase text-xs mb-2">
                             TOTAL TRIP COST
                        </Text>
                        <Text className="text-5xl font-black text-[#FFD700]">
                            ₹{(Number(bookingDetails.fare) + Number(bookingDetails.returnTripFare) + Number(bookingDetails.penaltyApplied) + Number(bookingDetails.tollFee))}
                        </Text>
                    </View>

                    {/* Fare Breakdown */}
                    <View className="mx-6 bg-slate-50 p-5 rounded-3xl mb-6 border border-slate-100">
                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Fare Breakdown</Text>
                            
                            <View className="flex-row justify-between mb-3 items-center">
                                <Text className="text-slate-600 font-bold">
                                    {bookingDetails.hasReturnTrip || bookingDetails.returnTripFare > 0 ? 'Base Fare (Leg 1)' : 'Ride Fare'}
                                </Text>
                                <View className="flex-row items-center">
                                    <Text className="font-bold text-slate-900">
                                        ₹{Math.max(0, Number(bookingDetails.fare) - Number(bookingDetails.nightSurcharge || 0))}
                                    </Text>
                                </View>
                            </View>

                            {Number(bookingDetails.nightSurcharge) > 0 && (
                                <View className="flex-row justify-between mb-3 items-center">
                                    <Text className="text-indigo-600 font-bold">Night Surcharge</Text>
                                    <Text className="text-indigo-600 font-black">+₹{bookingDetails.nightSurcharge}</Text>
                                </View>
                            )}

                            {(Number(bookingDetails.returnTripFare) > 0 || bookingDetails.hasReturnTrip) && (
                                <View className="flex-row justify-between mb-3 items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                                        <Text className="text-blue-600 font-bold">Return Trip (50% OFF)</Text>
                                    </View>
                                    <Text className="text-blue-600 font-black">+₹{bookingDetails.returnTripFare}</Text>
                                </View>
                            )}

                            {Number(bookingDetails.penaltyApplied) > 0 && (
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-red-500 font-bold">Waiting Penalty</Text>
                                    <Text className="text-red-500 font-black">+₹{bookingDetails.penaltyApplied}</Text>
                                </View>
                            )}

                            {Number(bookingDetails.tollFee) > 0 && (
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-amber-600 font-bold">Toll Charges</Text>
                                    <Text className="text-amber-600 font-black">+₹{bookingDetails.tollFee}</Text>
                                </View>
                            )}

                            <View className="h-[1px] bg-slate-200 w-full my-3" />

                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-900 font-black text-base">Total Trip Cost</Text>
                                <Text className="text-slate-900 font-black text-xl">
                                    ₹{(Number(bookingDetails.fare) + Number(bookingDetails.returnTripFare) + Number(bookingDetails.penaltyApplied) + Number(bookingDetails.tollFee))}
                                </Text>
                            </View>
                        </View>

                    <View className="mx-6 bg-slate-50 rounded-2xl p-5 border border-slate-100 mb-6">
                        <Text className="text-slate-500 font-bold text-xs uppercase mb-4 tracking-wider">Trip Details</Text>

                        <View className="flex-row items-start mb-6 relative">
                            <View className="absolute left-[9px] top-6 bottom-[-24px] w-[2px] bg-slate-200" />
                            <View className="w-5 h-5 bg-green-500 rounded-full border-4 border-white shadow-sm mr-3 mt-1" />
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-sm" numberOfLines={2}>{bookingDetails.pickup}</Text>
                                <Text className="text-slate-500 text-[10px] uppercase font-bold">Pickup</Text>
                            </View>
                        </View>

                        <View className="flex-row items-start mb-6">
                            <View className="w-5 h-5 bg-red-500 rounded-full border-4 border-white shadow-sm mr-3 mt-1" />
                            <View className="flex-1">
                                <Text className="text-slate-900 font-bold text-sm" numberOfLines={2}>{bookingDetails.drop}</Text>
                                <Text className="text-slate-500 text-[10px] uppercase font-bold">Dropoff</Text>
                            </View>
                        </View>

                        <View className="border-t border-slate-200 pt-4 mt-2 flex-row justify-between items-center">
                            <View>
                                <Text className="text-slate-500 text-[10px] uppercase font-bold">Total Distance</Text>
                                <Text className="text-slate-900 font-black text-lg">{bookingDetails.distance} KM</Text>
                                {bookingDetails.hasReturnTrip && (
                                    <Text className="text-slate-400 text-[8px] font-bold italic">(Outbound + Return)</Text>
                                )}
                            </View>
                            <View className="bg-slate-900 px-3 py-1.5 rounded-xl">
                                <Text className="text-white font-bold text-[10px] capitalize">{params.rideType || 'Standard'}</Text>
                            </View>
                        </View>
                    </View>
                </ScrollView>

                <View className="px-6 py-6 border-t border-slate-100 bg-white">
                    {isVerified ? (
                        <TouchableOpacity
                            onPress={() => {
                                // If status is waiting, it means leg 1 is done, go back to tracking
                                if (params.status === 'waiting') {
                                    router.push({ pathname: "/screens/LiveRideTrackingScreen", params: { bookingId } });
                                } else {
                                    router.replace({ pathname: "/screens/ThankYouScreen", params: { bookingId } });
                                }
                            }}
                            className="bg-slate-900 py-4 rounded-2xl items-center shadow-lg active:scale-95"
                        >
                            <Text className="text-[#FFD700] font-black text-lg">CONTINUE</Text>
                        </TouchableOpacity>
                    ) : (
                        <View className="bg-slate-100 py-4 rounded-2xl items-center">
                            <Text className="text-slate-500 font-bold">Waiting for driver verification...</Text>
                        </View>
                    )}
                </View>

            </SafeAreaView>
        </View>
    );
};

export default RideCompletionScreen;
