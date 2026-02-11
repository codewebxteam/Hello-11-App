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
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);
    const router = useRouter();

    const handleRegister = () => {
        if (!name || phoneNumber.length < 10 || password.length < 6) {
            Alert.alert("Attention", "Please fill all fields correctly.");
            return;
        }
        // Driver registration logic here
        Alert.alert("Success", `Welcome ${name}! Driver account created.`);
        router.replace("/");
    };

    return (
        <View className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" translucent backgroundColor="transparent" />

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
                    {/* Back Button - Positioned over yellow */}
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="ml-6 mt-2 bg-white/40 self-start p-2 rounded-full active:bg-white/60"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>

                    <View className={`flex-1 px-8 ${isTablet ? 'max-w-2xl self-center w-full' : ''}`}>

                        {/* Header Content - Now clearly on top of the yellow section */}
                        <View className="mb-8 items-center mt-4">
                            <Text className="text-[32px] md:text-5xl font-black text-slate-900 text-center leading-tight">
                                Driver{"\n"}<Text className="text-slate-800">Registration</Text>
                            </Text>
                            <View className="w-12 h-1.5 bg-slate-900 rounded-full mt-3" />
                            <Text className="text-base md:text-lg text-slate-700 font-semibold text-center mt-4 opacity-90">
                                Join Hello 11 Driver Community
                            </Text>
                        </View>

                        {/* Registration Form Card - Overlaps slightly with yellow */}
                        <View className="bg-white p-6 md:p-10 rounded-[40px] shadow-2xl shadow-slate-300 border border-slate-50">
                            <View className="space-y-4">
                                <Input
                                    placeholder="Full Name"
                                    value={name}
                                    onChangeText={setName}
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
                                    isFocused={focusedInput === 'password'}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                    icon={<Ionicons name="lock-closed-outline" size={20} color={focusedInput === 'password' ? "#1E293B" : "#94A3B8"} />}
                                    rightIcon={
                                        <Ionicons
                                            name={isPasswordVisible ? "eye-outline" : "eye-off-outline"}
                                            size={20}
                                            color="#94A3B8"
                                        />
                                    }
                                    onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
                                />

                            </View>

                            <View className="mt-8">
                                <Button title="Register Driver" onPress={handleRegister} />
                            </View>
                        </View>

                        {/* Footer Navigation */}
                        <View className="flex-row justify-center mt-8 pb-12">
                            <Text className="text-slate-500 text-sm md:text-base font-medium">Already have an account? </Text>
                            <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
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
