import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface PaymentDetails {
    amount: number;
    isPartial: boolean;
    breakdown: {
        baseFare: number;
        returnFare: number;
        penalty: number;
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

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/60">
                <Animated.View 
                    entering={SlideInDown.springify().damping(15)}
                    className="bg-slate-900 rounded-t-[40px] p-6 pb-10 border-t border-[#FFD700]/20"
                >
                    <View className="items-center mb-6">
                        <View className="w-12 h-1.5 bg-slate-800 rounded-full mb-6" />
                        <View className="w-20 h-20 bg-[#FFD700]/10 rounded-full items-center justify-center border border-[#FFD700]/30 mb-4 shadow-[0_0_30px_rgba(255,215,0,0.1)]">
                            <Ionicons name="wallet" size={40} color="#FFD700" />
                        </View>
                        <Text className="text-white text-2xl font-black uppercase tracking-tight">Payment Requested</Text>
                        <Text className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest text-center">
                            {details.isPartial ? 'Intermediate Payment Due' : 'Final Fare Collection'}
                        </Text>
                    </View>

                    <View className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700/50 mb-6 items-center">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Amount to Pay</Text>
                        <Text className="text-[#FFD700] text-5xl font-black italic">₹{details.amount}</Text>
                    </View>

                    <View className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/30 mb-8">
                        <Text className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4">Fare Breakdown</Text>
                        
                        <View className="space-y-3">
                            {/* Outbound Leg */}
                            <View className="flex-row justify-between items-center">
                                <Text className="text-slate-400 text-sm">Base Outbound</Text>
                                <View className="flex-row items-center">
                                    {details.breakdown.firstLegPaid && (
                                        <View className="bg-green-500/20 px-2 py-0.5 rounded-md mr-2 border border-green-500/30">
                                            <Text className="text-green-400 text-[8px] font-black uppercase">Settled</Text>
                                        </View>
                                    )}
                                    <Text className={`text-sm font-bold ${details.breakdown.firstLegPaid ? 'text-slate-600 line-through' : 'text-white'}`}>
                                        ₹{details.breakdown.baseFare || (details.breakdown.firstLegPaid ? '-' : '0')}
                                    </Text>
                                </View>
                            </View>

                            {/* Return Leg */}
                            {details.breakdown.returnFare > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <View className="flex-row items-center">
                                        <Text className="text-slate-400 text-sm">Return Journey</Text>
                                        <View className="bg-blue-500/20 px-1.5 py-0.5 rounded ml-2">
                                            <Text className="text-blue-400 text-[8px] font-black italic">50% OFF</Text>
                                        </View>
                                    </View>
                                    <Text className="text-white text-sm font-bold">+₹{details.breakdown.returnFare}</Text>
                                </View>
                            )}

                            {/* Penalty */}
                            {details.breakdown.penalty > 0 && (
                                <View className="flex-row justify-between items-center">
                                    <Text className="text-red-400 text-sm">Waiting Charges</Text>
                                    <Text className="text-red-400 text-sm font-bold">+₹{details.breakdown.penalty}</Text>
                                </View>
                            )}
                        </View>
                    </View>

                    <TouchableOpacity 
                        onPress={onClose}
                        className="w-full bg-[#FFD700] py-5 rounded-2xl items-center shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                    >
                        <Text className="text-[#0F172A] font-black text-lg tracking-[2px] uppercase">I am Paying Now</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
        </Modal>
    );
};

export default PaymentPromptModal;
