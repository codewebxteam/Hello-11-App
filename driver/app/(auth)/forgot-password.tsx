import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { driverAPI } from '../../utils/api';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Reset Password
    const [loading, setLoading] = useState(false);
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const handleRequestOTP = async () => {
        if (!mobile || mobile.length < 10) {
            return Alert.alert("Error", "Please enter a valid mobile number");
        }

        setLoading(true);
        try {
            const res = await driverAPI.forgotPassword(mobile);
            Alert.alert("OTP Sent", res.data.message);
            setStep(2);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword) {
            return Alert.alert("Error", "Please fill all fields");
        }

        setLoading(true);
        try {
            await driverAPI.resetPassword({ mobile, otp, newPassword });
            Alert.alert("Success", "Password reset successfully!", [
                { text: "Login Now", onPress: () => router.replace("/(auth)/login") }
            ]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            Alert.alert("Error", err.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
                    <TouchableOpacity
                        onPress={() => step === 1 ? router.back() : setStep(1)}
                        className="mt-6 w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View className="mt-12">
                        <Text className="text-slate-900 text-3xl font-black mb-2 uppercase tracking-tight">
                            {step === 1 ? 'Forgot\nPassword?' : 'Reset\nPassword'}
                        </Text>
                        <Text className="text-slate-400 text-sm font-medium leading-5">
                            {step === 1
                                ? 'Don\'t worry! It happens. Please enter the mobile number associated with your account.'
                                : `Verification code sent to +91 ${mobile}`}
                        </Text>
                    </View>

                    <View className="mt-10 space-y-6">
                        {step === 1 ? (
                            <View>
                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">Mobile Number</Text>
                                <View className="bg-slate-50 border border-slate-100 rounded-[20px] px-4 py-4 flex-row items-center">
                                    <Text className="text-slate-400 font-bold mr-2">+91</Text>
                                    <TextInput
                                        placeholder="Enter your mobile number"
                                        placeholderTextColor="#94A3B8"
                                        keyboardType="phone-pad"
                                        value={mobile}
                                        onChangeText={setMobile}
                                        maxLength={10}
                                        className="text-slate-900 font-bold flex-1"
                                    />
                                </View>
                            </View>
                        ) : (
                            <>
                                <View>
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">OTP Code</Text>
                                    <View className="bg-slate-50 border border-slate-100 rounded-[20px] px-4 py-4">
                                        <TextInput
                                            placeholder="Enter 4-digit OTP"
                                            placeholderTextColor="#94A3B8"
                                            keyboardType="number-pad"
                                            value={otp}
                                            onChangeText={setOtp}
                                            maxLength={4}
                                            className="text-slate-900 font-bold"
                                        />
                                    </View>
                                </View>
                                <View>
                                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2 ml-1">New Password</Text>
                                    <View className="bg-slate-50 border border-slate-100 rounded-[20px] px-4 py-4">
                                        <TextInput
                                            placeholder="Enter new password"
                                            placeholderTextColor="#94A3B8"
                                            secureTextEntry
                                            value={newPassword}
                                            onChangeText={setNewPassword}
                                            className="text-slate-900 font-bold"
                                        />
                                    </View>
                                </View>
                            </>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={step === 1 ? handleRequestOTP : handleResetPassword}
                        disabled={loading}
                        className={`mt-12 py-5 rounded-[22px] items-center shadow-xl ${loading ? 'bg-slate-400' : 'bg-slate-900 shadow-slate-900/20'}`}
                    >
                        <Text className="text-white font-black text-base uppercase tracking-widest">
                            {loading ? 'Processing...' : step === 1 ? 'Send OTP' : 'Reset Password'}
                        </Text>
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
