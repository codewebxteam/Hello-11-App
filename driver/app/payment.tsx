import React from 'react';
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function PaymentScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();

    // Calculate totals - If partial (Leg 1), just use fare. If final, use params.
    const isPartialPayment = !!params.nextRoute;
    const baseFare = params.fare ? Number(params.fare) : 450;
    const penalty = params.penalty ? Number(params.penalty) : 0;

    // For Partial: Total is just Base Fare. For Final: Base + Penalty (or updated logic)
    const totalAmount = isPartialPayment ? baseFare : (baseFare + penalty);

    const handlePaymentVerified = () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        if (isPartialPayment && typeof params.nextRoute === 'string') {
            // Navigate to Next Step (Waiting Screen)
            router.push({
                pathname: params.nextRoute as any,
                params: {
                    distance: params.distance as string
                }
            });
        } else {
            // Navigate to Summary (Final)
            router.push({
                pathname: "/ride-summary",
                params: {
                    totalAmount: totalAmount.toString(),
                    fare: baseFare.toString(),
                    penalty: penalty.toString(),
                    distance: "12.4",
                    time: "24",
                }
            });
        }
    };

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="light" />
            <SafeAreaView className="flex-1">
                <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 100, flexGrow: 1, justifyContent: 'center' }}>

                    {/* Header Icon & Text */}
                    <View className="items-center mb-12">
                        <View className="w-24 h-24 bg-[#FFD700]/10 rounded-full items-center justify-center border border-[#FFD700]/30 mb-6 font-black shadow-[0_0_40px_rgba(255,215,0,0.2)]">
                            <Ionicons name="wallet" size={48} color="#FFD700" />
                        </View>
                        <Text className="text-white text-3xl font-black uppercase tracking-tight text-center">Collect Fare</Text>
                        <Text className="text-slate-400 text-sm font-bold mt-2 text-center max-w-[80%]">Please collect the total amount below from the passenger</Text>
                    </View>

                    {/* Total Amount Card */}
                    <LinearGradient
                        colors={['#1E293B', '#0F172A']}
                        className="w-full rounded-[40px] p-10 items-center border border-[#FFD700]/30 shadow-[0_0_50px_rgba(255,215,0,0.15)] mb-10"
                    >
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-[4px] mb-6">Total Amount</Text>
                        <Text className="text-[#FFD700] text-7xl font-black mb-4">₹{totalAmount}</Text>

                        {penalty > 0 && (
                            <View className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/30 mt-2 flex-row items-center">
                                <Ionicons name="alert-circle" size={16} color="#F87171" style={{ marginRight: 6 }} />
                                <Text className="text-red-400 text-xs font-black uppercase tracking-wider">Includes ₹{penalty} Penalty</Text>
                            </View>
                        )}
                    </LinearGradient>

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
