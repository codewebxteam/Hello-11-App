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

const RegisterScreen = () => {
  const { width, height } = useWindowDimensions();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const router = useRouter();
  const { register, verifyOTP } = useAuth();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

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
        Alert.alert("OTP Sent", "Code sent to WhatsApp.");
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
      Alert.alert("Invalid OTP", "Please enter the 6-digit code.");
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View className="flex-1 bg-[#FFD700]">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar style="dark" translucent backgroundColor="transparent" />

        {/* --- DYNAMIC BACKGROUND ELEMENTS --- */}
        <View className="absolute top-[-80] left-[-80] w-80 h-80 bg-white/30 rounded-full" />
        <View className="absolute bottom-[-150] right-[-100] w-[500px] h-[500px] bg-black/10 rounded-full" />
        <View className="absolute top-[30%] right-[-20] w-24 h-24 bg-white/20 rounded-full" />

        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1">
          <View className="flex-1 px-10">

            {/* --- LOGO SECTION (TOP) --- */}
            <View className={`items-center ${isKeyboardVisible ? 'mt-16 mb-6' : 'mt-20 mb-10'}`}>
              <View className="bg-white p-6 rounded-[60px] shadow-2xl">
                <Image
                  source={require("../../assets/images/official_logo.png")}
                  style={{ width: isKeyboardVisible ? 70 : 110, height: isKeyboardVisible ? 70 : 110 }}
                  resizeMode="contain"
                />
              </View>
              {!isKeyboardVisible && (
                <View className="mt-6 items-center">
                  <Text className="text-black text-4xl font-black tracking-tighter italic">
                    HELLO <Text className="text-white">11</Text>
                  </Text>
                  <Text className="text-black/40 font-bold text-[10px] mt-2 tracking-[4px] uppercase text-center">
                    Join the Elite Circle
                  </Text>
                </View>
              )}
            </View>

            {/* --- FORM SECTION --- */}
            <View className="space-y-6">
              <View>
                <Text className="text-black font-black text-[10px] uppercase tracking-widest mb-3 ml-2">Full Name</Text>
                <View className={`bg-white h-16 rounded-3xl flex-row items-center px-6 shadow-xl ${focusedInput === 'name' ? 'border-4 border-black/10' : ''}`}>
                  <Ionicons name="person" size={18} color="#000" />
                  <TextInput
                    placeholder="Enter Name"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 font-bold text-black text-base ml-4"
                    value={name}
                    onChangeText={setName}
                    onFocus={() => setFocusedInput('name')}
                    onBlur={() => setFocusedInput(null)}
                    editable={!isLoading && !isOtpSent}
                    autoComplete="name"
                    textContentType="name"
                  />
                </View>
              </View>

              <View className="mt-2">
                <Text className="text-black font-black text-[10px] uppercase tracking-widest mb-3 ml-2">Mobile Number</Text>
                <View className={`bg-white h-16 rounded-3xl flex-row items-center px-6 shadow-xl ${focusedInput === 'phone' ? 'border-4 border-black/10' : ''}`}>
                  <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  <TextInput
                    placeholder="WhatsApp Number"
                    placeholderTextColor="#94A3B8"
                    className="flex-1 font-bold text-black text-base ml-4"
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
                <View className="mt-2">
                  <Text className="text-black font-black text-[10px] uppercase tracking-widest mb-3 ml-2">OTP Code</Text>
                  <View className={`bg-white h-16 rounded-3xl flex-row items-center px-6 shadow-xl ${focusedInput === 'otp' ? 'border-4 border-black/10' : ''}`}>
                    <Ionicons name="shield-checkmark" size={18} color="#000" />
                    <TextInput
                      placeholder="Enter Code"
                      placeholderTextColor="#94A3B8"
                      className="flex-1 font-black text-black text-xl ml-4"
                      keyboardType="number-pad"
                      value={otp}
                      onChangeText={(text) => {
                        // Extract only digits and limit to 6
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
                onPress={isOtpSent ? handleVerifyOtp : handleRegisterRequest}
                disabled={isLoading}
                className={`h-16 rounded-3xl items-center justify-center bg-black shadow-2xl active:bg-slate-800`}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFD700" />
                ) : (
                  <Text className="text-[#FFD700] font-black text-lg tracking-widest uppercase">
                    {isOtpSent ? "Create Account" : "Register Now"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* --- FOOTER --- */}
            {!isKeyboardVisible && (
              <View className="mt-auto pb-8 items-center">
                <View className="items-center mb-6">
                  <Text className="text-black/30 text-[10px] text-center font-bold tracking-widest leading-4">
                    BY JOINING, YOU AGREE TO OUR
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

                <TouchableOpacity onPress={() => router.push("/screens/LoginScreen")} className="flex-row">
                  <Text className="text-black font-medium">Already a member? </Text>
                  <Text className="text-white font-black underline">Sign In</Text>
                </TouchableOpacity>
              </View>
            )}

          </View>
        </KeyboardAvoidingView>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default RegisterScreen;
