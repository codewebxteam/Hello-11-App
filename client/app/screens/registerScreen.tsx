import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Input from "../../components/Input";
import Button from "../../components/Button";

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

const RegisterScreen = () => {
  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // ✅ Loading State
  const router = useRouter();

  const handleRegister = async () => {
    if (!name || phoneNumber.length < 10 || password.length < 6) {
      Alert.alert("Attention", "Please fill all fields correctly.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    setIsLoading(true); // ✅ Start Loader

    try {
      const { authAPI } = require("../../utils/api");
      const { saveToken, saveUser } = require("../../utils/storage");

      const response = await authAPI.signup({
        name,
        mobile: phoneNumber,
        password
      });

      const { token, user } = response.data;

      if (token) {
        await saveToken(token);
        await saveUser(user);
        Alert.alert("Success", `Welcome ${name}!`);
        router.replace("/screens/HomeScreen");
      } else {
        router.push("/screens/LoginScreen");
      }
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Something went wrong");
    } finally {
      setIsLoading(false); // ✅ Stop Loader
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* ✅ LOADING OVERLAY: Exactly like Login Screen */}
      {isLoading && (
        <View className="absolute inset-0 z-50 justify-center items-center bg-white/60">
          <View className="bg-slate-900 p-8 rounded-3xl shadow-2xl items-center">
            <ActivityIndicator size="large" color="#FFD700" />
            <Text className="text-white font-black mt-4 tracking-widest text-[10px] uppercase">
              Creating Account...
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

          <View className={`flex-1 px-8 ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>

            {/* Header Content */}
            <View className="mb-8 items-center mt-4">
              <Text className="text-[32px] md:text-5xl font-black text-slate-900 text-center leading-tight">
                Create{"\n"}<Text className="text-slate-800">New Account</Text>
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
                  editable={!isLoading}
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
                  editable={!isLoading}
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

                <Input
                  placeholder="Create Password"
                  secureTextEntry={!isPasswordVisible}
                  value={password}
                  onChangeText={setPassword}
                  editable={!isLoading}
                  isFocused={focusedInput === 'password'}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  icon={<Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? "#1E293B" : "#94A3B8"} />}
                  rightIcon={<Ionicons name={isPasswordVisible ? "eye-outline" : "eye-off-outline"} size={20} color="#94A3B8" />}
                  onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                />

                <Input
                  placeholder="Confirm Password"
                  secureTextEntry={!isPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  editable={!isLoading}
                  isFocused={focusedInput === 'confirm'}
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                  icon={<Ionicons name="shield-checkmark-outline" size={20} color={focusedInput === 'confirm' ? "#1E293B" : "#94A3B8"} />}
                />
              </View>

              <View className="mt-8">
                <Button 
                  title={isLoading ? "" : "Sign Up"} 
                  onPress={handleRegister} 
                  isLoading={isLoading}
                />
              </View>
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