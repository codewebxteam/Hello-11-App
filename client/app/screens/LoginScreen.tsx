import React, { useState, useCallback } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from "react-native";
import { useRouter, Stack } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import Input from "../../components/Input";
import Button from "../../components/Button";

const LoginScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (!phoneNumber || !password) {
      Alert.alert("Error", "Please enter both mobile number and password.");
      return;
    }
    router.push("/screens/HomeScreen");
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          contentContainerClassName="flex-grow pt-[12vh]"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top Yellow Curve - Responsive */}
          <View className="absolute -top-[62%] self-center w-[170%] aspect-square rounded-full bg-[#FFD700] -z-10" />

          <View className="flex-1 px-8 pb-10">
            <View className="mb-8 items-center mt-3">
              <Text className="text-3xl font-black text-slate-800 text-center leading-10">
                Welcome to{"\n"}<Text className="text-slate-800">Hello 11</Text>
              </Text>
              <View className="w-9 h-1 bg-slate-800 rounded-full my-3" />
              <Text className="text-sm text-slate-800 font-medium text-center">Login to continue your premium journey</Text>
            </View>

            <View className="mb-3 mt-[5vh]">
              <Input
                placeholder="Mobile Number"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                maxLength={10}
                isFocused={focusedInput === 'phone'}
                onFocus={() => setFocusedInput('phone')}
                onBlur={() => setFocusedInput(null)}
                icon={
                  <View className="bg-[#FFD700] px-2.5 py-1.5 rounded-lg">
                    <Text className="text-sm font-extrabold text-slate-800">+91</Text>
                  </View>
                }
              />

              <Input
                placeholder="Security Password"
                secureTextEntry={!isPasswordVisible}
                value={password}
                onChangeText={setPassword}
                isFocused={focusedInput === 'password'}
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                rightIcon={
                  <Ionicons
                    name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={focusedInput === 'password' ? "#1E293B" : "#94A3B8"}
                  />
                }
                onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
              />

              <TouchableOpacity
                className="self-end mb-4"
                onPress={() => Alert.alert("Security", "Link sent.")}
              >
                <Text className="text-orange-500 font-bold text-xs">Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            <Button title="Continue" onPress={handleLogin} />

            <View className="flex-row justify-center mt-6">
              <Text className="text-slate-400 text-sm">New to Hello 11? </Text>
              <TouchableOpacity onPress={() => router.push("/screens/registerScreen")}>
                <Text className="text-orange-500 font-extrabold text-sm">Create Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
