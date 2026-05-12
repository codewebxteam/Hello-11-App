import React, { useState, useEffect } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Image,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from "../../context/AuthContext";

const LoginScreen = () => {
  const { width, height } = useWindowDimensions();

  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();
  const { requestOTP, verifyOTP } = useAuth();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

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
        Alert.alert("OTP Sent", "Code sent to WhatsApp.");
      } else {
        Alert.alert("Error", result.message);
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
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
      Alert.alert("Verification Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-[#FFD700]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        {/* --- DYNAMIC BACKGROUND ELEMENTS --- */}
        <View className="absolute top-[-80] right-[-80] w-80 h-80 bg-white/20 rounded-full" />
        <View className="absolute bottom-[-150] left-[-100] w-[500px] h-[500px] bg-black/10 rounded-full" />
        <View className="absolute top-[20%] left-[-30] w-20 h-20 bg-white/30 rounded-full" />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 px-10">

            {/* --- LOGO SECTION (TOP) --- */}
            <View className={`items-center ${isKeyboardVisible ? 'mt-16 mb-6' : 'mt-24 mb-12'}`}>
              <View className="bg-white p-6 rounded-[60px] shadow-2xl">
                <Image
                  source={require("../../assets/images/official_logo.png")}
                  style={{ width: isKeyboardVisible ? 80 : 120, height: isKeyboardVisible ? 80 : 120 }}
                  resizeMode="contain"
                />
              </View>
              {!isKeyboardVisible && (
                <View className="mt-8 items-center">
                  <Text className="text-black text-5xl font-black tracking-tighter italic">
                    HELLO <Text className="text-white">11</Text>
                  </Text>
                  <Text className="text-black/40 font-bold text-[10px] mt-2 tracking-[4px] uppercase">
                    Premium Ride Experience
                  </Text>
                </View>
              )}
            </View>

            {/* --- FORM SECTION --- */}
            <View className="space-y-8">
              <View>
                <Text className="text-black font-black text-[10px] uppercase tracking-widest mb-3 ml-2">Mobile Number</Text>
                <View className={`bg-white h-16 rounded-3xl flex-row items-center px-6 shadow-xl ${focusedInput === 'phone' ? 'border-4 border-black/10' : ''}`}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <TextInput
                    placeholder="Enter Number"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 font-bold text-black text-lg ml-4"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading && !isOtpSent}
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    selectTextOnFocus={true}
                  />
                </View>
              </View>

              {isOtpSent && (
                <View className="mt-4">
                  <Text className="text-black font-black text-[10px] uppercase tracking-widest mb-3 ml-2">WhatsApp OTP</Text>
                  <View className={`bg-white h-16 rounded-3xl flex-row items-center px-6 shadow-xl ${focusedInput === 'otp' ? 'border-4 border-black/10' : ''}`}>
                    <Ionicons name="shield-checkmark" size={20} color="#000" />
                    <TextInput
                      placeholder="Enter Code"
                      placeholderTextColor="#94A3B8"
                      className="flex-1 font-black text-black text-xl ml-4"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={(text) => {
                        // Clean input and limit to 6 digits manually
                        const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                        setOtp(cleaned);
                      }}
                      onFocus={() => setFocusedInput('otp')}
                      onBlur={() => setFocusedInput(null)}
                      editable={!isLoading}
                      autoComplete="sms-otp"
                      textContentType="oneTimeCode"
                      contextMenuHidden={false}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* --- PRIMARY BUTTON --- */}
            <View className="mt-6">
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={isOtpSent ? handleVerifyOtp : handleRequestOtp}
                disabled={isLoading}
                className={`h-16 rounded-3xl items-center justify-center bg-black shadow-2xl active:bg-slate-800`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFD700" />
                ) : (
                  <Text className="text-[#FFD700] font-black text-lg tracking-widest uppercase">
                    {isOtpSent ? "Sign In" : "Get Verification"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* --- FOOTER --- */}
            {!isKeyboardVisible && (
              <View className="mt-auto pb-12 items-center">
                <View className="items-center mb-6">
                  <Text className="text-black/30 text-[10px] text-center font-bold tracking-widest leading-4">
                    SECURE LOGIN POWERED BY
                  </Text>
                  <View className="flex-row mt-1">
                    <TouchableOpacity onPress={() => router.push("/screens/TermsScreen")}>
                      <Text className="text-black font-black text-[10px] underline tracking-widest uppercase">Terms</Text>
                    </TouchableOpacity>
                    <Text className="text-black/30 font-bold text-[10px] tracking-widest"> & </Text>
                    <TouchableOpacity onPress={() => router.push("/screens/PrivacyScreen")}>
                      <Text className="text-black font-black text-[10px] underline tracking-widest uppercase">Privacy Policy</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity onPress={() => router.push("/screens/registerScreen")} className="flex-row">
                  <Text className="text-black font-medium">New member? </Text>
                  <Text className="text-white font-black underline">Join Hello 11</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;
