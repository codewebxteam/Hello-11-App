import { useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../utils/api';

export default function PaymentScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Calculate totals
    const isPartialPayment = !!params.nextRoute;
    const firstLegPaid = params.firstLegPaid === 'true';
    const baseFare = params.baseFare ? Number(params.baseFare) : (params.fare ? Number(params.fare) : 450);
    const returnFare = params.returnFare ? Number(params.returnFare) : 0;
    const penalty = params.penalty ? Number(params.penalty) : 0;
    const toll = params.toll ? Number(params.toll) : 0;
    const nightSurcharge = params.nightSurcharge ? Number(params.nightSurcharge) : 0;
    const oneWayFare = Math.max(0, baseFare) + Math.max(0, nightSurcharge);

    // Total Amount: If final payment and first leg already paid, only collect return + penalty + toll
    const totalAmount = isPartialPayment
        ? oneWayFare
        : (firstLegPaid ? (returnFare + penalty + toll) : (oneWayFare + returnFare + penalty + toll));

    useEffect(() => {
        if (params.bookingId) {
            driverAPI.requestPayment(params.bookingId as string, {
                amount: totalAmount,
                isPartial: isPartialPayment,
                breakdown: {
                    baseFare,
                    returnFare,
                    penalty,
                    toll,
                    nightSurcharge,
                    firstLegPaid
                }
            }).catch(err => console.error("Failed to request payment via API:", err));
        }
    }, [params.bookingId, totalAmount, isPartialPayment, firstLegPaid, baseFare, returnFare, penalty, toll, nightSurcharge]);

    const handlePaymentVerified = async () => {
        try {
            const bookingId = params.bookingId as string;
            if (!bookingId) {
                Alert.alert("Error", "No active booking found.");
                return;
            }

            if (isPartialPayment && typeof params.nextRoute === 'string') {
                // START WAITING Logic (USP)
                // 1. Verify intermediate payment
                await driverAPI.verifyPayment(bookingId, {
                    paymentMethod: "cash", // Assuming cash for now as per current app flow
                    isFirstLeg: true
                });

                // 2. Start waiting
                await driverAPI.startWaiting(bookingId);

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                    pathname: params.nextRoute as any,
                    params: {
                        bookingId,
                        distance: params.distance as string
                    }
                });
            } else {
                // FINAL COMPLETION Logic
                const outboundDistance = parseFloat(params.outboundDistance as string || "0");
                const returnDistance = parseFloat(params.distance as string || "0");
                const finalTotalDistance = (params.isReturn === 'true')
                    ? (outboundDistance + returnDistance).toFixed(1)
                    : returnDistance.toFixed(1);

                // Mark payment as received so passenger prompt can close immediately
                await driverAPI.verifyPayment(bookingId, {
                    paymentMethod: "cash"
                });

                await driverAPI.completeRide(bookingId, {
                    fare: totalAmount,
                    distance: parseFloat(finalTotalDistance)
                });

                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                router.push({
                    pathname: "/ride-summary",
                    params: {
                        bookingId,
                        totalAmount: totalAmount.toString(),
                        fare: oneWayFare.toString(),
                        returnFare: returnFare.toString(),
                        penalty: penalty.toString(),
                        toll: toll.toString(),
                        nightSurcharge: nightSurcharge.toString(),
                        distance: finalTotalDistance,
                        time: params.time as string || "24",
                        pickup: params.pickup as string || "",
                        drop: params.drop as string || "",
                        isReturn: params.isReturn || 'false',
                        hasReturnTrip: params.hasReturnTrip || 'false'
                    }
                });
            }
        } catch (err) {
            console.error("Payment Verification Error", err);
            Alert.alert("Error", "Verification failed. Please try again.");
        }
    };

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: Math.max(100, insets.bottom + 60), flexGrow: 1, justifyContent: 'center' }}>

                    {/* Header Icon & Text */}
                    <View className="items-center mb-12">
                        <View className="w-24 h-24 bg-[#FFD700]/10 rounded-full items-center justify-center border border-[#FFD700]/30 mb-6 font-black shadow-[0_0_40px_rgba(255,215,0,0.2)]">
                            <Ionicons name="wallet" size={48} color="#FFD700" />
                        </View>
                        <Text className="text-white text-3xl font-black uppercase tracking-tight text-center">Collect Fare</Text>
                        <Text className="text-slate-400 text-sm font-bold mt-2 text-center max-w-[80%]">Please collect the total amount below from the passenger</Text>
                    </View>

                    {/* Total Amount Card */}
                    <View className="w-full rounded-[34px] overflow-hidden border-2 border-[#FACC15]/60 bg-[#0F172A] shadow-[0_0_50px_rgba(255,215,0,0.15)] mb-10">
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        className="w-full p-10 items-center"
                    >
                        <Text className="text-slate-400 text-[10px] font-black uppercase tracking-[3px] mb-6">Total Collection</Text>
                        <Text className="text-[#FFD700] text-7xl font-black mb-6">₹{totalAmount}</Text>

                        {/* Breakdown for Final Payment */}
                        {!isPartialPayment && (
                            <View className="w-full bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                                <View className="flex-row justify-between mb-3 items-center">
                                    <View>
                                        <Text className="text-slate-400 text-xs">
                                            {returnFare > 0 || params.hasReturnTrip === 'true' ? 'Base Fare (Leg 1)' : 'Ride Fare'}
                                        </Text>
                                        {firstLegPaid && (
                                            <Text className="text-green-500 text-[8px] font-black uppercase tracking-wider">✓ Paid</Text>
                                        )}
                                    </View>
                                    <Text className={`text-xs font-bold ${firstLegPaid ? 'text-green-500' : 'text-white'}`}>₹{baseFare - nightSurcharge}</Text>
                                </View>

                                {nightSurcharge > 0 && (
                                    <View className="flex-row justify-between mb-3 items-center">
                                        <View>
                                            <Text className="text-indigo-400 text-xs">Night Surcharge</Text>
                                            {firstLegPaid && (
                                                <Text className="text-green-500 text-[8px] font-black uppercase tracking-wider">✓ Paid</Text>
                                            )}
                                        </View>
                                        <Text className={`text-xs font-bold ${firstLegPaid ? 'text-green-500' : 'text-indigo-400'}`}>+₹{nightSurcharge}</Text>
                                    </View>
                                )}

                                {returnFare > 0 && (
                                    <View className="flex-row justify-between mb-3 items-center">
                                        <View className="flex-row items-center">
                                            <Text className="text-blue-400 text-xs">Return Trip </Text>
                                            <View className="bg-blue-500/20 px-1 py-0.5 rounded ml-1">
                                                <Text className="text-blue-400 text-[8px] font-black italic">50% OFF</Text>
                                            </View>
                                        </View>
                                        <Text className="text-blue-400 text-xs font-bold">+₹{returnFare}</Text>
                                    </View>
                                )}
                                {penalty > 0 && (
                                    <View className="flex-row justify-between mb-3 items-center">
                                        <Text className="text-red-400 text-xs">Waiting Penalty</Text>
                                        <Text className="text-red-400 text-xs font-bold">+₹{penalty}</Text>
                                    </View>
                                )}
                                {toll > 0 && (
                                    <View className="flex-row justify-between">
                                        <Text className="text-amber-400 text-xs">Toll Charges</Text>
                                        <Text className="text-amber-400 text-xs font-bold">+₹{toll}</Text>
                                    </View>
                                )}

                                <View className="h-[1px] bg-slate-700/50 w-full my-2" />
                                
                                {firstLegPaid && (
                                    <>
                                        <View className="flex-row justify-between mb-1 opacity-70">
                                            <Text className="text-slate-400 text-[9px] uppercase font-bold">Total Trip Cost</Text>
                                            <Text className="text-white text-[10px] font-bold">₹{oneWayFare + returnFare + penalty + toll}</Text>
                                        </View>
                                        <View className="flex-row justify-between mb-1 opacity-70">
                                            <Text className="text-green-500 text-[9px] uppercase font-bold">Already Paid (Leg 1)</Text>
                                            <Text className="text-green-500 text-[10px] font-bold">-₹{baseFare}</Text>
                                        </View>
                                        <View className="h-[1px] bg-slate-700 w-1/3 self-end my-1" />
                                    </>
                                )}

                                <View className="flex-row justify-between items-center mt-1">
                                    <Text className="text-[#FFD700] font-black text-xs uppercase tracking-widest">
                                        {isPartialPayment ? 'Collect Now' : 'Money to Collect'}
                                    </Text>
                                    <Text className="text-[#FFD700] text-2xl font-black italic">₹{totalAmount}</Text>
                                </View>
                            </View>
                        )}

                        {isPartialPayment && penalty > 0 && (
                            <View className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30 mt-2 flex-row items-center">
                                <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
                                <Text className="text-red-400 text-xs font-black uppercase tracking-wider">Includes ₹{penalty} Penalty</Text>
                            </View>
                        )}
                    </LinearGradient>
                    </View>

                </ScrollView>
            </SafeAreaView>

            {/* Bottom Button */}
            <View className="absolute bottom-0 w-full p-6 bg-slate-900/95 border-t border-slate-800 backdrop-blur-md" style={{ paddingBottom: insets.bottom + 20 }}>
                <TouchableOpacity
                    onPress={handlePaymentVerified}
                    className="w-full bg-[#FFD700] py-6 rounded-[28px] items-center shadow-[0_0_30px_rgba(255,215,0,0.3)] relative overflow-hidden active:scale-[0.98]"
                >
                    {/* Shine Effect */}
                    <View className="absolute top-0 bottom-0 left-0 w-full bg-white/20 -skew-x-12 -ml-[100%]" />

                    <View className="flex-row items-center">
                        <Ionicons name={isPartialPayment ? "time" : "checkmark-circle"} size={28} color="#0F172A" style={{ marginRight: 10 }} />
                        <Text className="text-[#0F172A] font-black text-xl tracking-[3px] uppercase">
                            {isPartialPayment ? "Start Waiting Timer" : "Money Received"}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
}
