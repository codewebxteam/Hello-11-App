import React, { useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Dimensions, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

export default function StartRideScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputs = useRef<Array<TextInput | null>>([]);

    // Stable callback for refs to avoid re-creation on render
    const renderInputRef = (index: number) => (ref: TextInput | null) => {
        inputs.current[index] = ref;
    };

    const handleOtpChange = (value: string, index: number) => {
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) {
            inputs.current[index + 1]?.focus();
        }

        if (newOtp.every(digit => digit !== '')) {
            Keyboard.dismiss();
        }
    };

    const handleKeyPress = (e: any, index: number) => {
        if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
            inputs.current[index - 1]?.focus();
        }
    };

    const isOtpComplete = otp.every(digit => digit !== '');

    const handleStartRide = () => {
        if (isOtpComplete) {
            Keyboard.dismiss();
            try {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (e) {
                // Ignore haptics error
            }

            // Explicitly navigate cleanly
            setTimeout(() => {
                router.replace("/active-ride");
            }, 300); // Increased delay slightly
        }
    };

    return (
        <View className="flex-1 bg-slate-900" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
            <StatusBar style="light" />
            <View className="flex-1 px-6">

                {/* Header */}
                <View className="mt-4 mb-10">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-slate-700 active:bg-slate-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>
                    <Text className="text-white text-3xl font-black mt-6">Start Ride</Text>
                    <Text className="text-slate-400 text-base mt-2">Ask passenger for the 4-digit OTP</Text>
                </View>

                {/* OTP Input */}
                <View className="flex-row justify-between mb-12">
                    {[0, 1, 2, 3].map((_, index) => (
                        <TextInput
                            key={index}
                            ref={renderInputRef(index)}
                            className={`w-[70px] h-[70px] bg-slate-800 rounded-2xl text-center text-white text-3xl font-black border-2 ${otp[index] ? 'border-[#FFD700]' : 'border-slate-700'}`}
                            keyboardType="number-pad"
                            maxLength={1}
                            value={otp[index]}
                            onChangeText={(text) => handleOtpChange(text, index)}
                            onKeyPress={(e) => handleKeyPress(e, index)}
                            selectionColor="#FFD700"
                        />
                    ))}
                </View>

                {/* Info Card */}
                <View className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 mb-auto">
                    <View className="flex-row items-center mb-6">
                        <View className="w-12 h-12 bg-slate-700 rounded-full items-center justify-center border border-slate-600 mr-4">
                            <Text className="text-2xl">👩‍💼</Text>
                        </View>
                        <View>
                            <Text className="text-white text-lg font-bold">Priya Sharma</Text>
                            <View className="bg-[#FFD700]/20 self-start px-2 py-0.5 rounded-md mt-1">
                                <Text className="text-[#FFD700] text-[10px] font-bold uppercase">Cash Ride</Text>
                            </View>
                        </View>
                    </View>
                    <View className="h-[1px] bg-slate-700 w-full mb-6" />
                    <View className="flex-row justify-between">
                        <View>
                            <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">Destination</Text>
                            <Text className="text-white font-bold text-sm">Terminal 2, Amausi Airport</Text>
                        </View>
                        <Ionicons name="airplane" size={20} color="#94A3B8" />
                    </View>
                </View>

                {/* Start Button */}
                <TouchableOpacity
                    disabled={!isOtpComplete}
                    onPress={handleStartRide}
                    className={`w-full py-5 rounded-[24px] items-center flex-row justify-center mb-6 ${isOtpComplete ? 'bg-[#FFD700] shadow-lg shadow-yellow-500/20' : 'bg-slate-800 opacity-50'}`}
                >
                    <Text className={`font-black text-lg tracking-[3px] uppercase mr-2 ${isOtpComplete ? 'text-[#0F172A]' : 'text-slate-500'}`}>Verify & Start</Text>
                    {isOtpComplete && <Ionicons name="checkmark-circle" size={24} color="#0F172A" />}
                </TouchableOpacity>

            </View>
        </View>
    );
}
