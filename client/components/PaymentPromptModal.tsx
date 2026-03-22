import React from 'react';
import { View, Text, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface PaymentDetails {
    amount: number;
    isPartial: boolean;
    breakdown: {
        baseFare: number;
        returnFare: number;
        penalty: number;
        toll: number;
        nightSurcharge: number;
        firstLegPaid: boolean;
    };
}

interface PaymentPromptModalProps {
    isVisible: boolean;
    onClose: () => void;
    details: PaymentDetails | null;
}

const PaymentPromptModal: React.FC<PaymentPromptModalProps> = ({ isVisible, onClose, details }) => {
    if (!details) return null;
    const nightSurcharge = Number(details?.breakdown?.nightSurcharge || 0);
    const rawBaseFare = Math.max(0, Number(details?.breakdown?.baseFare || 0));
    const requestedAmount = Number(details?.amount);

    // If baseFare + surcharge > requestedAmount, it means baseFare is likely the total one-way, 
    // so we should subtract. Otherwise, if it's already clean, use it as is.
    // However, the most robust way is to check the DB persisted baseFare.
    // For now, we'll assume baseFare sent from payment.tsx might be total or clean.
    const displayBaseFare = (rawBaseFare + nightSurcharge > requestedAmount && nightSurcharge > 0)
        ? Math.max(0, rawBaseFare - nightSurcharge)
        : rawBaseFare;
    const returnFare = Number(details?.breakdown?.returnFare || 0);
    const penalty = Number(details?.breakdown?.penalty || 0);
    const toll = Number(details?.breakdown?.toll || 0);
    const payableNow = Number.isFinite(requestedAmount)
        ? requestedAmount
        : (details.isPartial
            ? rawBaseFare
            : (details?.breakdown?.firstLegPaid ? (returnFare + penalty + toll) : (rawBaseFare + returnFare + penalty + toll)));

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-center px-5 bg-black/60">
                <Animated.View
                    entering={FadeIn.duration(220)}
                    className="bg-slate-900 rounded-[30px] p-6 border border-[#FFD700]/20"
                >
                    <View className="items-center mb-6">
                        <View className="w-20 h-20 bg-[#FFD700]/10 rounded-full items-center justify-center border border-[#FFD700]/30 mb-4 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                            <Ionicons name="wallet" size={40} color="#FFD700" />
                        </View>
                        <Text className="text-white text-2xl font-black uppercase tracking-tight">Payment Requested</Text>
                        <Text className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest text-center">
                            {details.isPartial ? 'Intermediate Payment Due' : 'Final Fare Collection'}
                        </Text>
                    </View>

                    <View className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 mb-6 items-center">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-2">Payable Now</Text>
                        <Text className="text-[#FFD700] text-5xl font-black italic">₹{payableNow}</Text>
                        {details.breakdown.firstLegPaid && (
                            <Text className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-wider text-center">
                                First leg already paid
                            </Text>
                        )}
                    </View>

                    <View className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Fare Breakdown</Text>

                        <View className="space-y-3">
                            <View className="flex-row justify-between items-center">
                                <View>
                                    <Text className="text-slate-400 text-sm">
                                        {details.breakdown.returnFare > 0 ? 'Base Fare (Leg 1)' : 'Ride Fare'}
                                    </Text>
                                    {details.breakdown.firstLegPaid && (
                                        <Text className="text-green-600 text-[9px] font-bold uppercase tracking-wider">✓ Paid</Text>
                                    )}
                                </View>
                                <Text className={`text-sm font-bold ${details.breakdown.firstLegPaid ? 'text-green-600' : 'text-white'}`}>
                                    ₹{displayBaseFare}
                                </Text>
                            </View>

                            {nightSurcharge > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <View>
                                        <Text className="text-indigo-400 text-sm font-bold">Night Surcharge</Text>
                                        {details.breakdown.firstLegPaid && (
                                            <Text className="text-green-600 text-[9px] font-bold uppercase tracking-wider">✓ Paid</Text>
                                        )}
                                    </View>
                                    <Text className={`text-sm font-bold ${details.breakdown.firstLegPaid ? 'text-green-600' : 'text-indigo-400'}`}>
                                        +₹{nightSurcharge}
                                    </Text>
                                </View>
                            )}



                            {!details.isPartial && returnFare > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                                        <Text className="text-slate-400 text-sm">Return Trip (50% OFF)</Text>
                                    </View>
                                    <Text className="text-white text-sm font-bold">+₹{returnFare}</Text>
                                </View>
                            )}

                            {!details.isPartial && penalty > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-red-400 text-sm">Waiting Penalty</Text>
                                    <Text className="text-red-400 text-sm font-bold">+₹{penalty}</Text>
                                </View>
                            )}

                            {!details.isPartial && toll > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-amber-400 text-sm">Toll Charges</Text>
                                    <Text className="text-amber-400 text-sm font-bold">+₹{toll}</Text>
                                </View>
                            )}

                            <View className="h-[1px] bg-slate-700 w-full my-1" />

                            {!details.isPartial && details.breakdown.firstLegPaid && (
                                <>
                                    <View className="flex-row justify-between items-center opacity-70">
                                        <Text className="text-slate-400 text-xs uppercase font-bold">Total Trip Cost</Text>
                                        <Text className="text-white text-sm font-bold">₹{rawBaseFare + returnFare + penalty + toll}</Text>
                                    </View>
                                    <View className="flex-row justify-between items-center opacity-70">
                                        <Text className="text-green-500 text-xs uppercase font-bold">Already Paid (Leg 1)</Text>
                                        <Text className="text-green-500 text-sm font-bold">-₹{rawBaseFare}</Text>
                                    </View>
                                    <View className="h-[1px] bg-slate-700 w-1/2 self-end my-1" />
                                </>
                            )}

                            <View className="flex-row justify-between items-center">
                                <Text className="text-[#FFD700] font-black text-sm uppercase tracking-wider">
                                    {details.isPartial ? 'Amount Payable Now' : 'Payable at End'}
                                </Text>
                                <Text className="text-[#FFD700] font-black text-2xl italic">
                                    ₹{payableNow}
                                </Text>
                            </View>
                        </View>
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default PaymentPromptModal;
