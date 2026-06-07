import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    TextInput,
    useWindowDimensions,
    ActivityIndicator,
    Image,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useDriverAuth } from "../../context/DriverAuthContext";

const LoginScreen = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    
    const [phoneNumber, setPhoneNumber] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const router = useRouter();
    const { requestOTP, verifyOTP } = useDriverAuth();

    const handleRequestOtp = async () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            Alert.alert("Invalid Number", "Please enter a valid 10-digit mobile number.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await requestOTP(phoneNumber);
            
            if (result.success) {
                setIsOtpSent(true);
                Alert.alert("OTP Sent", "Please check your WhatsApp for the verification code.");
            } else {
                // If the user is not registered or validation fails, redirect to the signup flow
                router.push({ pathname: "/(auth)/signup", params: { phone: phoneNumber } });
            }
        } catch (err: any) {
            console.error("Login request error:", err);
            // Redirect to signup on API failure assuming the user might not be registered
            router.push({ pathname: "/(auth)/signup", params: { phone: phoneNumber } });
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6) {
            Alert.alert("Invalid OTP", "Please enter the 6-digit code sent to your WhatsApp.");
            return;
        }

        setIsLoading(true);

        try {
            const result = await verifyOTP(phoneNumber, otp);
            
            if (result.success) {
                router.replace("/");
            } else {
                Alert.alert("Verification Failed", "The OTP you entered is incorrect. Please try again.");
            }
        } catch (err: any) {
            console.error("Verification error:", err);
            Alert.alert("Error", "An unexpected error occurred. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* --- AMBIENT GLOW --- */}
            <View
                className="absolute rounded-full bg-[#FFD700] opacity-20"
                style={{
                    top: -height * 0.1,
                    right: -width * 0.2,
                    width: width * 0.9,
                    height: width * 0.9
                }}
            />
            <View
                className="absolute rounded-full bg-[#FFD700] opacity-10"
                style={{
                    top: height * 0.4,
                    left: -width * 0.1,
                    width: width * 0.4,
                    height: width * 0.4
                }}
            />

            {/* --- LOADING OVERLAY --- */}
            {isLoading && (
                <View className="absolute inset-0 z-50 justify-center items-center bg-white/70">
                    <View className="bg-slate-900 px-10 py-8 rounded-[30px] shadow-2xl items-center">
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text className="text-white font-bold mt-4 text-base">Please wait...</Text>
                    </View>
                </View>
            )}

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View
                        className="self-center w-full px-6 py-8"
                        style={{ maxWidth: isTablet ? 550 : '100%' }}
                    >

                        {/* --- BRANDING SECTION --- */}
                        <View className="items-center mb-12">
                            <View
                                className="bg-white items-center justify-center shadow-xl shadow-slate-200 border border-slate-100"
                                style={{
                                    width: isTablet ? 120 : 100,
                                    height: isTablet ? 120 : 100,
                                    borderRadius: isTablet ? 35 : 30,
                                }}
                            >
                                <Image
                                    source={require('../../assets/images/icon.png')}
                                    style={{ width: isTablet ? 80 : 65, height: isTablet ? 80 : 65 }}
                                    resizeMode="contain"
                                />
                            </View>

                            <Text className="text-4xl font-black text-slate-900 mt-6 tracking-tight">
                                Hello<Text className="text-[#FFB800]">11</Text>
                            </Text>
                            <Text className="text-slate-500 font-black text-xs mt-1 tracking-widest uppercase">
                                Driver Partner
                            </Text>
                        </View>

                        {/* --- FORM SECTION --- */}
                        <View className="space-y-5">

                            {/* Phone Input */}
                            <View>
                                <Text className="text-slate-500 font-bold text-sm mb-2 ml-2">
                                    Mobile Number
                                </Text>
                                <View className={`flex-row items-center bg-white h-[68px] px-5 rounded-[24px] border-2 ${focusedInput === 'phone' ? 'border-[#FFD700]' : 'border-slate-100'} shadow-sm`}>
                                    <View className="border-r border-slate-200 pr-3 mr-3">
                                        <Ionicons name="call" size={22} color={focusedInput === 'phone' ? "#FFB800" : "#94A3B8"} />
                                    </View>
                                    <Text className="font-bold text-slate-800 text-lg mr-2">+91</Text>
                                    <TextInput
                                        placeholder="Enter your number"
                                        className="flex-1 font-bold text-slate-800 text-lg"
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        value={phoneNumber}
                                        onChangeText={setPhoneNumber}
                                        onFocus={() => setFocusedInput('phone')}
                                        onBlur={() => setFocusedInput(null)}
                                        editable={!isLoading && !isOtpSent}
                                    />
                                    {isOtpSent && (
                                        <TouchableOpacity onPress={() => setIsOtpSent(false)} className="bg-slate-100 px-4 py-2 rounded-full">
                                            <Text className="text-slate-700 font-bold text-xs">Change</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>

                            {/* OTP Section (Visible only after OTP is sent) */}
                            {isOtpSent && (
                                <View className="mt-4">
                                    <Text className="text-slate-500 font-bold text-sm mb-2 ml-2">
                                        WhatsApp OTP Code
                                    </Text>
                                    <View className={`flex-row items-center bg-white h-[68px] px-5 rounded-[24px] border-2 ${focusedInput === 'otp' ? 'border-[#FFD700]' : 'border-slate-100'} shadow-sm`}>
                                        <View className="mr-4">
                                            <Ionicons
                                                name="chatbubble-ellipses"
                                                size={24}
                                                color="#25D366" 
                                            />
                                        </View>

                                        <TextInput
                                            placeholder="6-digit code"
                                            className="flex-1 font-black text-slate-900 text-2xl tracking-[8px]"
                                            keyboardType="number-pad"
                                            maxLength={6}
                                            value={otp}
                                            onChangeText={setOtp}
                                            onFocus={() => setFocusedInput('otp')}
                                            onBlur={() => setFocusedInput(null)}
                                            editable={!isLoading}
                                        />
                                    </View>
                                    <TouchableOpacity 
                                        className="mt-4 self-center bg-slate-100 px-5 py-2.5 rounded-full"
                                        onPress={handleRequestOtp}
                                        disabled={isLoading}
                                    >
                                        <Text className="text-slate-600 font-bold text-sm">Didn't receive the code? Resend</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>

                        {/* --- ACTIONS --- */}
                        <View className="mt-8">
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={isOtpSent ? handleVerifyOtp : handleRequestOtp}
                                disabled={isLoading}
                                className="bg-[#FFD700] h-[64px] rounded-[24px] justify-center items-center shadow-lg shadow-yellow-500/30"
                            >
                                {isLoading ? (
                                    <ActivityIndicator color="#000" size="large" />
                                ) : (
                                    <Text className="text-slate-900 font-black text-xl">
                                        {isOtpSent ? "LOGIN" : "SEND OTP"}
                                    </Text>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/(auth)/signup")}
                                className="mt-8 self-center p-2"
                            >
                                <Text className="text-slate-500 font-bold text-sm text-center">
                                    New Driver? <Text className="text-[#FFB800] font-black underline">Register Here</Text>
                                </Text>
                            </TouchableOpacity>
                        </View>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default LoginScreen;