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
    
    // States
    const [name, setName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [vehicleNumber, setVehicleNumber] = useState("");
    const [vehicleModel, setVehicleModel] = useState("");
    const [vehicleType, setVehicleType] = useState("5seater");
    const [serviceType, setServiceType] = useState("both"); // Defaulted to 'both'
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
                vehicleNumber: vehicleNumber.toUpperCase(), // Clean data for backend
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

            {/* Loading Overlay */}
            {isLoading && (
                <View className="absolute inset-0 z-50 justify-center items-center bg-white/70">
                    <View className="bg-slate-900 p-8 rounded-3xl shadow-2xl items-center">
                        <ActivityIndicator size="large" color="#FFD700" />
                        <Text className="text-white font-black mt-4 tracking-widest text-xs uppercase">
                            {isOtpSent ? "Verifying..." : "Creating Account..."}
                        </Text>
                    </View>
                </View>
            )}

            {/* Responsive Scaled Background Curve */}
            <View
                style={{
                    height: height * (isTablet ? 0.35 : 0.3),
                    width: '200%',
                    left: '-50%',
                    borderBottomLeftRadius: width,
                    borderBottomRightRadius: width,
                }}
                className="absolute top-0 bg-[#FFD700] shadow-sm"
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerClassName="flex-grow pt-12 pb-8"
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Back Button */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        disabled={isLoading}
                        className="ml-6 bg-white/50 self-start p-3 rounded-full active:bg-white/80"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View className={`flex-1 px-6 w-full self-center ${isTablet ? 'max-w-2xl' : 'max-w-md'}`}>
                        
                        {/* Header */}
                        <View className="mb-8 items-center mt-2">
                            <Text className="text-4xl md:text-5xl font-black text-slate-900 text-center leading-tight tracking-tight">
                                Driver{"\n"}<Text className="text-slate-800">Registration</Text>
                            </Text>
                            <View className="w-16 h-1.5 bg-slate-900 rounded-full mt-4" />
                        </View>

                        {/* Registration Card */}
                        <View className="bg-white p-6 md:p-10 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100">
                            <View className="space-y-4">
                                <Input
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
                                    editable={!isLoading && !isOtpSent}
                                    isFocused={focusedInput === 'name'}
                                    onFocus={() => setFocusedInput('name')}
                                    onBlur={() => setFocusedInput(null)}
                                    autoCapitalize="words"
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
                                    <View className="mt-2">
                                        <Text className="text-slate-500 font-bold text-sm mb-2 ml-2">WhatsApp OTP</Text>
                                        <Input
                                            placeholder="Enter 6-digit OTP"
                                            keyboardType="number-pad"
                                            value={otp}
                                            onChangeText={setOtp}
                                            maxLength={6}
                                            isFocused={focusedInput === 'otp'}
                                            onFocus={() => setFocusedInput('otp')}
                                            onBlur={() => setFocusedInput(null)}
                                            icon={<Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'otp' ? "#1E293B" : "#94A3B8"} />}
                                        />
                                    </View>
                                ) : (
                                    <>
                                        <Input
                                            placeholder="Vehicle Model"
                                            value={vehicleModel}
                                            onChangeText={setVehicleModel}
                                            isFocused={focusedInput === 'vmodel'}
                                            onFocus={() => setFocusedInput('vmodel')}
                                            onBlur={() => setFocusedInput(null)}
                                            autoCapitalize="words"
                                            icon={<Ionicons name="car-outline" size={20} color={focusedInput === 'vmodel' ? "#1E293B" : "#94A3B8"} />}
                                        />

                                        <Input
                                            placeholder="Vehicle Number"
                                            value={vehicleNumber}
                                            onChangeText={setVehicleNumber}
                                            isFocused={focusedInput === 'vnum'}
                                            onFocus={() => setFocusedInput('vnum')}
                                            onBlur={() => setFocusedInput(null)}
                                            autoCapitalize="characters"
                                            icon={<Ionicons name="card-outline" size={20} color={focusedInput === 'vnum' ? "#1E293B" : "#94A3B8"} />}
                                        />

                                        {/* Vehicle Category */}
                                        <View className="mt-4">
                                            <Text className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2 ml-2">Vehicle Category</Text>
                                            <View className="flex-row gap-3">
                                                {['5seater', '7seater'].map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        activeOpacity={0.7}
                                                        onPress={() => setVehicleType(type)}
                                                        className={`flex-1 py-4 rounded-2xl items-center border-2 transition-all ${
                                                            vehicleType === type 
                                                            ? 'bg-slate-900 border-slate-900 shadow-md' 
                                                            : 'bg-slate-50 border-slate-100'
                                                        }`}
                                                    >
                                                        <Text className={`font-black uppercase text-xs tracking-wider ${
                                                            vehicleType === type ? 'text-[#FFD700]' : 'text-slate-500'
                                                        }`}>
                                                            {type.replace('seater', ' Seater')}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
                                            </View>
                                        </View>

                                        {/* Service Specialty */}
                                        <View className="mt-6">
                                            <Text className="text-slate-400 text-[11px] font-black uppercase tracking-widest mb-2 ml-2">Service Specialty</Text>
                                            <View className="flex-row gap-2">
                                                {['cab', 'rental', 'both'].map((type) => (
                                                    <TouchableOpacity
                                                        key={type}
                                                        activeOpacity={0.7}
                                                        onPress={() => setServiceType(type)}
                                                        className={`flex-1 py-3.5 rounded-xl items-center border-2 transition-all ${
                                                            serviceType === type 
                                                            ? 'bg-slate-900 border-slate-900 shadow-md' 
                                                            : 'bg-slate-50 border-slate-100'
                                                        }`}
                                                    >
                                                        <Text className={`font-black uppercase text-[11px] tracking-wider ${
                                                            serviceType === type ? 'text-[#FFD700]' : 'text-slate-500'
                                                        }`}>
                                                            {type}
                                                        </Text>
                                                    </TouchableOpacity>
                                                ))}
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
                                <TouchableOpacity onPress={() => setIsOtpSent(false)} className="mt-5 self-center p-2">
                                    <Text className="text-slate-500 font-bold text-sm">Need to edit details? <Text className="text-slate-900 underline">Go back</Text></Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Footer Navigation */}
                        <View className="flex-row justify-center mt-8 pb-4">
                            <Text className="text-slate-500 text-sm md:text-base font-bold">Already have an account? </Text>
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