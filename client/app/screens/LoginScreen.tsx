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
  Dimensions,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768; // Tablet detection logic

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async () => {
    if (!phoneNumber || !password) {
      Alert.alert("Access Denied", "Please verify your security keys.");
      return;
    }

    try {
      const { authAPI } = require("../../utils/api");
      const { saveToken, saveUser } = require("../../utils/storage"); // Assuming storage utils exist

      const response = await authAPI.signin({
        mobile: phoneNumber,
        password: password
      });

      const { token, user, message } = response.data;

      if (token) {
        await saveToken(token);
        await saveUser(user);

        // Show success status briefly if needed or just redirect
        router.replace("/screens/HomeScreen");
      } else {
        Alert.alert("Login Failed", message || "Invalid credentials");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      Alert.alert("Login Failed", error.message || "Something went wrong");
    }
  };

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" />

      {/* --- RESPONSIVE AMBIENT GLOW --- */}
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

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Content Wrapper: Tablet par width control karta hai */}
          <View
            className="self-center w-full px-8 py-10"
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
                  transform: [{ rotate: '-10deg' }]
                }}
              >
                <Ionicons name="car-sport" size={isTablet ? 55 : 42} color="#1E293B" />
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

              {/* Mobile Identity Input */}
              <View>
                <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px] mb-2 ml-1">
                  Mobile Identity
                </Text>
                <View className={`flex-row items-center bg-white h-16 px-5 rounded-[22px] border-2 ${focusedInput === 'phone' ? 'border-[#FFD700]' : 'border-slate-50'} shadow-sm shadow-slate-200`}>
                  <View className="border-r border-slate-100 pr-3 mr-3">
                    <Ionicons name="call-outline" size={18} color={focusedInput === 'phone' ? "#FFD700" : "#94A3B8"} />
                  </View>
                  <TextInput
                    placeholder="Enter Number"
                    className="flex-1 font-bold text-slate-800 text-base"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => setFocusedInput('phone')}
                    onBlur={() => setFocusedInput(null)}
                  />
                </View>
              </View>

              {/* Password Section */}
              <View>
                <View className="flex-row justify-between items-center mb-2 px-1">
                  <Text className="text-slate-400 font-black text-[10px] uppercase tracking-[2px]">
                    Access Key
                  </Text>
                  {password.length > 0 && (
                    <Text className={`text-[10px] font-black ${password.length < 6 ? 'text-orange-400' : 'text-green-500'}`}>
                      {password.length < 6 ? 'WEAK' : 'SECURE'}
                    </Text>
                  )}
                </View>

                <View className={`flex-row items-center bg-white h-16 px-5 rounded-[22px] border-2 ${focusedInput === 'pass' ? 'border-[#FFD700]' : 'border-slate-50'} shadow-sm shadow-slate-200`}>
                  <View className="mr-3">
                    <Ionicons
                      name={focusedInput === 'pass' ? "lock-open-outline" : "lock-closed-outline"}
                      size={20}
                      color={focusedInput === 'pass' ? "#FFD700" : "#94A3B8"}
                    />
                  </View>

                  <TextInput
                    placeholder="••••••••"
                    secureTextEntry={!isPasswordVisible}
                    className="flex-1 font-black text-slate-800 text-lg tracking-widest"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('pass')}
                    onBlur={() => setFocusedInput(null)}
                  />

                  <TouchableOpacity
                    onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                    className="bg-slate-50 p-2 rounded-xl"
                  >
                    <Ionicons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color={isPasswordVisible ? "#FFD700" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity className="self-end" onPress={() => router.push("/screens/ForgotPasswordScreen")}>
                <Text className="text-slate-400 font-bold text-xs underline">Forgot Key?</Text>
              </TouchableOpacity>
            </View>

            {/* --- ACTIONS --- */}
            <View className="mt-10">
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleLogin}
                className="bg-[#FFD700] py-5 rounded-[22px] items-center shadow-2xl shadow-yellow-600/40"
              >
                <Text className="text-slate-900 font-black text-lg tracking-[2px]">UNLOCK RIDE</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/screens/registerScreen")}
                className="mt-8 self-center"
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