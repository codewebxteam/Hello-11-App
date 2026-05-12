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
import { useAuth } from "../../context/AuthContext";

const RegisterScreen = () => {
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  const isSmallPhone = width < 360;
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register, verifyOTP } = useAuth();

  const handleRegisterRequest = async () => {
    if (!name || phoneNumber.length < 10) {
      Alert.alert("Attention", "Please enter your name and 10-digit mobile number.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await register(name, phoneNumber);
      
      if (result.success) {
        setIsOtpSent(true);
        Alert.alert("OTP Sent", "Verification code sent to your WhatsApp.");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong");
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
        Alert.alert("Success", `Welcome ${name}!`);
        router.replace("/screens/HomeScreen");
      } else {
        Alert.alert("Verification Failed", result.message);
      }
    } catch (error: any) {
      Alert.alert("Verification Failed", error.message || "Something went wrong");
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
              {isOtpSent ? "Verifying..." : "Sending OTP..."}
            </Text>
          </View>
        </View>
      )}

      {/* Yellow Background Section */}
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingTop: 40, paddingBottom: 40 }}
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

          <View className={`flex-1 ${isSmallPhone ? 'px-5' : 'px-8'} ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>

            {/* Header Content */}
            <View className="mb-8 items-center mt-4">
              <Text className={`${isSmallPhone ? 'text-[28px]' : 'text-[32px]'} md:text-5xl font-black text-slate-900 text-center leading-tight`}>
                Create{"\n"}<Text className="text-slate-800">New Account</Text>
              </Text>
              <View className="w-12 h-1.5 bg-slate-900 rounded-full mt-3" />
            </View>

            {/* Registration Form Card */}
            <View className={`bg-white ${isSmallPhone ? 'p-4' : 'p-6'} md:p-10 rounded-[40px] shadow-2xl shadow-slate-300 border border-slate-50`}>
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

                {isOtpSent && (
                  <Input
                    placeholder="WhatsApp OTP"
                    keyboardType="number-pad"
                    value={otp}
                    onChangeText={setOtp}
                    editable={!isLoading}
                    maxLength={6}
                    isFocused={focusedInput === 'otp'}
                    onFocus={() => setFocusedInput('otp')}
                    onBlur={() => setFocusedInput(null)}
                    icon={<Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'otp' ? "#1E293B" : "#94A3B8"} />}
                  />
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
                  <Text className="text-slate-400 font-bold text-xs underline">Change Number?</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Footer Navigation */}
            <View className="flex-row justify-center mt-8 pb-12">
              <Text className="text-slate-500 font-medium">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.push("/screens/LoginScreen")} disabled={isLoading}>
                <Text className="text-slate-900 font-black border-b-2 border-[#FFD700]">Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default RegisterScreen;
