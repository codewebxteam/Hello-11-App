import React, { useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Text,
    TouchableOpacity,
    View,
    ScrollView,
    useWindowDimensions,
    ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Input from "../../components/Input";
import Button from "../../components/Button";
import { driverAuthAPI } from "../../utils/api";
import { useDriverAuth } from "../../context/DriverAuthContext";

const RegisterScreen = () => {
    const { width, height } = useWindowDimensions();
    const isTablet = width >= 768;
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleType, setVehicleType] = useState("5seater");
    const [serviceType, setServiceType] = useState("cab"); // 'cab', 'rental', 'both'
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);

    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { verifyOTP } = useDriverAuth();

    const handleRegisterRequest = async () => {
        if (!name || phoneNumber.length < 10 || !vehicleModel || !vehicleNumber) {
            Alert.alert("Attention", "Please fill all fields correctly.");
            return;
        }

        setIsLoading(true);

        try {
            const response = await driverAuthAPI.register({
                name,
                mobile: phoneNumber,
                vehicleModel,
                vehicleNumber,
                vehicleType,
                serviceType
            });

            if (response.data && response.data.mobile) {
                setIsOtpSent(true);
                Alert.alert("OTP Sent", "Verification code sent to your WhatsApp.");
            } else {
                Alert.alert("Registration Failed", response.data.message || "Could not initiate registration.");
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Registration failed.");
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
                Alert.alert("Success", "Welcome to Hello 11!");
                router.replace("/");
            } else {
                Alert.alert("Verification Failed", result.message);
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Verification failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" translucent backgroundColor="transparent" />

            {/* ✅ LOADING OVERLAY */}
            {isLoading && (
                <View className="absolute inset-0 z-50 justify-center items-center bg-white/60">
                    <View className="bg-slate-900 p-8 rounded-3xl shadow-2xl items-center">
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text className="text-white font-black mt-4 tracking-widest text-[10px] uppercase">
                            {isOtpSent ? "Verifying..." : "Creating Account..."}
                        </Text>
                    </View>
                </View>
            )}

            {/* --- Responsive Yellow Background Section --- */}
            <View
                style={{
                    height: isTablet ? height * 0.45 : height * 0.38,
                    width: width * 2,
                    left: -width * 0.5,
                    borderBottomLeftRadius: width,
                    borderBottomRightRadius: width,
                    position: 'absolute',
                    top: 0,
                }}
                className="bg-[#FFD700] shadow-sm"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="flex-grow pt-10"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        disabled={isLoading}
                        className="ml-6 mt-2 bg-white/40 self-start p-2 rounded-full active:bg-white/60"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View className={`flex-1 px-8 ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>

                        {/* Header Content */}
                        <View className="mb-8 items-center mt-4">
                            <Text className="text-[32px] md:text-5xl font-black text-slate-900 text-center leading-tight">
                                Driver{"\n"}<Text className="text-slate-800">Registration</Text>
                            </Text>
                            <View className="w-12 h-1.5 bg-slate-900 rounded-full mt-3" />
                        </View>

                        {/* Registration Form Card */}
                        <View className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl shadow-slate-300 border border-slate-50">
                            <View className="space-y-4">
                                <Input
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading && !isOtpSent}
                                    isFocused={focusedInput === 'name'}
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                    icon={<Ionicons name="person-outline" size={20} color={focusedInput === 'name' ? "#1E293B" : "#94A3B8"} />}
                                />

                                <Input
                                    placeholder="Mobile Number"
                                    keyboardType="phone-pad"
                                    value={phoneNumber}
                                    onChangeText={setPhoneNumber}
                                    editable={!isLoading && !isOtpSent}
                                    maxLength={10}
                                    isFocused={focusedInput === 'phone'}
                                    onFocus={() => setFocusedInput('phone')}
                                    onBlur={() => setFocusedInput(null)}
                                    icon={
                                        <View className="bg-[#FFD700] px-2.5 py-1 rounded-md">
                                            <Text className="text-xs font-black text-slate-800">+91</Text>
                                        </View>
                                    }
                                />

                                {isOtpSent ? (
                                    <Input
                                        placeholder="WhatsApp OTP"
                                        keyboardType="number-pad"
                                        value={otp}
                                        onChangeText={setOtp}
                                        maxLength={6}
                                        isFocused={focusedInput === 'otp'}
                                        onFocus={() => setFocusedInput('otp')}
                                        onBlur={() => setFocusedInput(null)}
                                        icon={<Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'otp' ? "#1E293B" : "#94A3B8"} />}
                                    />
                                ) : (
                                    <>
                                        <Input
                                            placeholder="Vehicle Model (e.g. Swift Dzire)"
                                            value={vehicleModel}
                                            onChangeText={setVehicleModel}
                                            isFocused={focusedInput === 'vmodel'}
                                            onFocus={() => setFocusedInput('vmodel')}
                                            onBlur={() => setFocusedInput(null)}
                                            icon={<Ionicons name="car-outline" size={20} color={focusedInput === 'vmodel' ? "#1E293B" : "#94A3B8"} />}
                                        />

                                        <Input
                                            placeholder="Vehicle Number (e.g. UP 32 XX 0000)"
                                            value={vehicleNumber}
                                            onChangeText={setVehicleNumber}
                                            isFocused={focusedInput === 'vnum'}
                                            onFocus={() => setFocusedInput('vnum')}
                                            onBlur={() => setFocusedInput(null)}
                                            icon={<Ionicons name="card-outline" size={20} color={focusedInput === 'vnum' ? "#1E293B" : "#94A3B8"} />}
                                        />

                                        <View className="mt-4">
                                            <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-3 ml-1">Vehicle Category</Text>
                                            <View className="bg-slate-50 p-2 rounded-[24px] border border-slate-100 flex-row flex-wrap justify-between">
                                                {['5seater', '7seater'].map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        onPress={() => setVehicleType(type)}
                                                        style={{ width: '48%', marginBottom: 8 }}
                                                        className={`px-2 py-4 rounded-[18px] items-center border ${vehicleType === type ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-100'}`}
                                                    >
                                                        <Text className={`font-black uppercase text-xs ${vehicleType === type ? 'text-[#FFD700]' : 'text-slate-400'}`}>{type}</Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        <View className="mt-4">
                                            <View className="flex-row justify-between items-center mb-3 ml-1">
                                                <Text className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Service Specialty</Text>
                                            </View>
                                            <View className="flex-row gap-2">
                                                {['cab', 'rental', 'both'].map((type) => {
                                                    return (
                                                        <TouchableOpacity
                                                            key={type}
                                                            onPress={() => setServiceType(type)}
                                                            className={`flex-1 py-3 rounded-xl items-center border ${serviceType === type ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                                                        >
                                                            <Text className={`font-black uppercase text-[10px] ${serviceType === type ? 'text-[#FFD700]' : 'text-slate-600'}`}>
                                                                {type}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    </>
                                )}

                            </View>

                            <View className="mt-8">
                                <Button 
                                    title={isLoading ? "" : (isOtpSent ? "Verify & Register" : "Get OTP")} 
                                    onPress={isOtpSent ? handleVerifyOtp : handleRegisterRequest} 
                                    isLoading={isLoading}
                                />
                            </View>
                            
                            {isOtpSent && (
                                <TouchableOpacity onPress={() => setIsOtpSent(false)} className="mt-4 self-center">
                                    <Text className="text-slate-400 font-bold text-xs underline">Edit Details?</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Footer Navigation */}
                        <View className="flex-row justify-center mt-8 pb-12">
                            <Text className="text-slate-500 text-sm md:text-base font-medium">Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/(auth)/login")} disabled={isLoading}>
                                <Text className="text-slate-900 font-black text-sm md:text-base border-b-2 border-[#FFD700]">Login</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default RegisterScreen;
