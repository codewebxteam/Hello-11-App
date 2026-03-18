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
    const baseFare = Number(details?.breakdown?.baseFare || 0);
    const returnFare = Number(details?.breakdown?.returnFare || 0);
    const penalty = Number(details?.breakdown?.penalty || 0);
    const toll = Number(details?.breakdown?.toll || 0);
    const requestedAmount = Number(details?.amount);
    const payableNow = Number.isFinite(requestedAmount)
        ? requestedAmount
        : (details.isPartial
            ? baseFare
            : (details?.breakdown?.firstLegPaid ? (returnFare + penalty + toll) : (baseFare + returnFare + penalty + toll)));

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
                        <Text className="text-[#FFD700] text-5xl font-black italic">Rs {payableNow}</Text>
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
                                <Text className="text-slate-400 text-sm">Base Fare (Outbound)</Text>
                                <View className="flex-row items-center">
                                    {details.breakdown.firstLegPaid && (
                                        <View className="bg-green-500/20 px-2 py-0.5 rounded-md mr-2 border border-green-500/30">
                                            <Text className="text-green-400 text-[8px] font-black uppercase">Already Paid</Text>
                                        </View>
                                    )}
                                    <Text className={`text-sm font-bold ${details.breakdown.firstLegPaid ? 'text-slate-500' : 'text-white'}`}>
                                        Rs {baseFare}
                                    </Text>
                                </View>
                            </View>

                            {returnFare > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <View className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2" />
                                        <Text className="text-slate-400 text-sm">Return Trip (50% OFF)</Text>
                                    </View>
                                    <Text className="text-white text-sm font-bold">+Rs {returnFare}</Text>
                                </View>
                            )}

                            {penalty > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-red-400 text-sm">Waiting Penalty</Text>
                                    <Text className="text-red-400 text-sm font-bold">+Rs {penalty}</Text>
                                </View>
                            )}

                            {toll > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-amber-400 text-sm">Toll Charges</Text>
                                    <Text className="text-amber-400 text-sm font-bold">+Rs {toll}</Text>
                                </View>
                            )}

                            <View className="h-[1px] bg-slate-700 w-full my-1" />

                            <View className="flex-row justify-between items-center">
                                <Text className="text-white font-black text-sm uppercase">Total Trip Cost</Text>
                                <Text className="text-white font-black text-lg">
                                    Rs {baseFare + returnFare + penalty + toll}
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
