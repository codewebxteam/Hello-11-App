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
import { useAuth } from "../../context/AuthContext";

const LoginScreen = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 360;
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { requestOTP, verifyOTP } = useAuth();

  const handleRequestOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert("Invalid Input", "Please enter a valid 10-digit mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await requestOTP(phoneNumber);
      
      if (result.success) {
        setIsOtpSent(true);
        Alert.alert("OTP Sent", "A 6-digit verification code has been sent to your WhatsApp.");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error: any) {
      console.error("Request OTP error:", error);
      Alert.alert("Error", error.message || "Something went wrong");
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
        router.replace("/screens/HomeScreen");
      } else {
        Alert.alert("Login Failed", result.message);
      }
    } catch (error: any) {
      console.error("Verify OTP error:", error);
      Alert.alert("Verification Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* --- RESPONSIVE AMBIENT GLOW --- */}
      <View
        className="absolute rounded-full bg-[#FFD700] opacity-20"
        style={{ top: -height * 0.1, right: -width * 0.2, width: width * 0.9, height: width * 0.9 }}
      />
      <View
        className="absolute rounded-full bg-[#FFD700] opacity-10"
        style={{ top: height * 0.4, left: -width * 0.1, width: width * 0.4, height: width * 0.4 }}
      />

      {/* ✅ FULL SCREEN LOADING OVERLAY */}
      {isLoading && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-white/60">
          <View className="bg-slate-900 p-8 rounded-3xl shadow-2xl items-center">
            <ActivityIndicator size="large" color="#FFD700" />
            <Text className="text-white font-bold mt-4 tracking-widest text-xs uppercase">Processing</Text>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View
            className={`self-center w-full ${isSmallPhone ? 'px-5 py-8' : 'px-8 py-10'}`}
            style={{ maxWidth: isTablet ? 550 : '100%' }}
          >

            {/* --- BRANDING SECTION --- */}
            <View className="items-center mb-10">
              <View
                className="bg-[#FFD700] items-center justify-center shadow-2xl shadow-yellow-500/50"
                style={{
                  width: isTablet ? 110 : 85,
                  height: isTablet ? 110 : 85,
                  borderRadius: isTablet ? 35 : 28,
                }}
              >
                <Image
                  source={require('../../assets/images/imgss.jpeg')}
                  style={{ width: isTablet ? 64 : 50, height: isTablet ? 64 : 50, resizeMode: 'contain' }}
                />
              </View>

              <Text className="text-4xl font-black text-slate-900 mt-6 tracking-tighter italic">
                Hello <Text className="text-[#FFB800]">11</Text>
              </Text>
              <Text className="text-slate-400 font-bold text-[10px] mt-2 tracking-[3px] uppercase">
                Premium Ride Experience
              </Text>
              <View className="w-10 h-1 bg-[#FFD700] rounded-full mt-4 opacity-50" />
            </View>

            {/* --- FORM SECTION --- */}
            <View className="space-y-6">

              {/* Mobile Input */}
              <View>
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">
                  Mobile Number
                </Text>
                <View className={`flex-row items-center bg-white ${isSmallPhone ? 'h-14 px-4' : 'h-16 px-5'} rounded-[22px] border-2 ${focusedInput === 'phone' ? 'border-[#FFD700]' : 'border-slate-50'} shadow-sm shadow-slate-200`}>
                  <View className="border-r border-slate-100 pr-3 mr-3">
                    <Ionicons name="call-outline" size={18} color={focusedInput === 'phone' ? "#FFD700" : "#94A3B8"} />
                  </View>
                  <TextInput
                    placeholder="Enter Number"
                    className={`flex-1 font-bold text-slate-800 ${isSmallPhone ? 'text-sm' : 'text-base'}`}
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading && !isOtpSent}
                  />
                  {isOtpSent && (
                    <TouchableOpacity onPress={() => setIsOtpSent(false)}>
                      <Text className="text-[#FFB800] font-bold text-xs">Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* OTP Section (Only visible if OTP is sent) */}
              {isOtpSent && (
                <View>
                  <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">
                    WhatsApp OTP
                  </Text>
                  <View className={`flex-row items-center bg-white ${isSmallPhone ? 'h-14 px-4' : 'h-16 px-5'} rounded-[22px] border-2 ${focusedInput === 'otp' ? 'border-[#FFD700]' : 'border-slate-50'} shadow-sm shadow-slate-200`}>
                    <View className="mr-3">
                      <Ionicons
                        name="shield-checkmark-outline"
                        size={20}
                        color={focusedInput === 'otp' ? "#FFD700" : "#94A3B8"}
                      />
                    </View>

                    <TextInput
                      placeholder="Enter 6-digit OTP"
                      className={`flex-1 font-black text-slate-800 ${isSmallPhone ? 'text-base' : 'text-lg'} tracking-[4px]`}
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
                    className="mt-4 self-end"
                    onPress={handleRequestOtp}
                    disabled={isLoading}
                  >
                    <Text className="text-slate-400 font-bold text-xs underline">Resend OTP?</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* --- ACTIONS --- */}
            <View className="mt-10">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={isOtpSent ? handleVerifyOtp : handleRequestOtp}
                disabled={isLoading}
                className={`py-5 rounded-[22px] items-center shadow-2xl shadow-yellow-600/40 ${isLoading ? 'bg-slate-300' : 'bg-[#FFD700]'}`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#1E293B" />
                ) : (
                  <Text className="text-slate-900 font-black text-lg tracking-[2px]">
                    {isOtpSent ? "VERIFY & UNLOCK" : "SEND OTP"}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/screens/registerScreen")}
                className="mt-8 self-center"
                disabled={isLoading}
              >
                <Text className="text-slate-400 font-bold text-[11px] uppercase tracking-widest text-center">
                  New Member? <Text className="text-[#FFB800] font-black">Join Hello 11</Text>
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
