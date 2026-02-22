import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Dimensions, ScrollView } from 'react-native';
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Input from "../../components/Input";
import Button from "../../components/Button";
import { authAPI } from '../../utils/api';

const { width } = Dimensions.get('window');

const ForgotPasswordScreen = () => {
    const router = useRouter();
    const [mobile, setMobile] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [step, setStep] = useState(1); // 1: Send OTP, 2: Reset Password
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async () => {
        if (!mobile || mobile.length < 10) {
            Alert.alert("Error", "Please enter a valid mobile number");
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.forgotPassword({ mobile });
            Alert.alert("OTP Sent", `Your OTP is: ${response.data.otp}`); // Demo OTP
            setStep(2);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to send OTP");
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!otp || !newPassword) {
            Alert.alert("Error", "Please enter OTP and new password");
            return;
        }

        try {
            setLoading(true);
            await authAPI.resetPassword({ mobile, otp, newPassword });
            Alert.alert("Success", "Password reset successfully! Please login.", [
                { text: "OK", onPress: () => router.replace("/screens/LoginScreen") }
            ]);
        } catch (error: any) {
            Alert.alert("Error", error.response?.data?.message || "Failed to reset password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView contentContainerClassName="flex-grow justify-center px-8">
                    <TouchableOpacity onPress={() => router.back()} className="absolute top-12 left-8 z-10 p-2 bg-slate-50 rounded-full">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View className="items-center mb-10">
                        <View className="w-20 h-20 bg-yellow-100 rounded-full items-center justify-center mb-6">
                            <Ionicons name="lock-open" size={32} color="#EAB308" />
                        </View>
                        <Text className="text-3xl font-black text-slate-800 text-center">
                            {step === 1 ? "Forgot Password?" : "Reset Password"}
                        </Text>
                        <Text className="text-slate-500 text-center mt-2 px-6">
                            {step === 1
                                ? "Enter your registered mobile number to receive an OTP."
                                : "Enter the OTP sent to your mobile and set a new password."}
                        </Text>
                    </View>

                    <View className="space-y-6">
                        {step === 1 ? (
                            <Input
                                placeholder="Mobile Number"
                                value={mobile}
                                onChangeText={setMobile}
                                keyboardType="phone-pad"
                                maxLength={10}
                                icon={<Ionicons name="call-outline" size={20} color="#64748B" />}
                            />
                        ) : (
                            <>
                                <Input
                                    placeholder="Enter OTP"
                                    value={otp}
                                    onChangeText={setOtp}
                                    keyboardType="number-pad"
                                    maxLength={4}
                                    icon={<Ionicons name="key-outline" size={20} color="#64748B" />}
                                />
                                <Input
                                    placeholder="New Password"
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                    secureTextEntry
                                    icon={<Ionicons name="lock-closed-outline" size={20} color="#64748B" />}
                                />
                            </>
                        )}

                        <Button
                            title={loading ? "Processing..." : (step === 1 ? "Send OTP" : "Reset Password")}
                            onPress={step === 1 ? handleSendOTP : handleResetPassword}
                            isLoading={loading}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ForgotPasswordScreen;
