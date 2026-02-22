import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, Alert, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

import { userAPI } from '../../utils/api';

const ProfileScreen = () => {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);

    // User data state
    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        phone: "",
        gender: ""
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getProfile();
            const { user } = response.data; // Backend returns { user: ... } wrapper
            setUserInfo({
                name: user.name || "",
                email: user.email || "",
                phone: user.mobile || "",
                gender: user.gender || ""
            });
        } catch (error) {
            console.error("Failed to fetch profile:", error);
            Alert.alert("Error", "Could not load profile data");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            await userAPI.updateProfile({
                name: userInfo.name,
                email: userInfo.email,
                gender: userInfo.gender
            });
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        }
    };

    const renderField = (
        label: string,
        key: keyof typeof userInfo,
        icon: string,
        isReadOnly: boolean = false,
        keyboardType: 'default' | 'email-address' | 'phone-pad' = 'default'
    ) => {
        const value = userInfo[key];
        const isValueEmpty = !value || value.trim() === "";

        return (
            <View className="mb-5">
                <View className="flex-row items-center mb-2 ml-1">
                    <Ionicons name={icon as any} size={18} color="#94A3B8" />
                    <Text className="text-slate-400 text-xs font-bold uppercase ml-2 tracking-wider">{label}</Text>
                </View>

                {isEditing && !isReadOnly ? (
                    <TextInput
                        value={userInfo[key]}
                        onChangeText={(text) => setUserInfo({ ...userInfo, [key]: text })}
                        className="bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-slate-800 font-semibold text-base"
                        keyboardType={keyboardType}
                        placeholder={`Add ${label.toLowerCase()}`}
                        placeholderTextColor="#CBD5E1"
                    />
                ) : (
                    <View className={`bg-white border border-slate-100 rounded-2xl px-5 py-4 ${isValueEmpty ? "opacity-60" : ""} shadow-sm`}>
                        <Text className={`text-base font-bold ${isValueEmpty ? "text-slate-400 italic" : "text-slate-800"}`}>
                            {isValueEmpty ? `No ${label.toLowerCase()} added` : value}
                        </Text>
                        {isReadOnly && (
                            <View className="absolute right-4 top-4 opacity-30">
                                <Ionicons name="lock-closed" size={16} color="#64748B" />
                            </View>
                        )}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                className="flex-1"
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerClassName="pb-10"
                >
                    {/* Attractive Curved Header */}
                    <View className="bg-[#FFD700] pt-12 pb-24 rounded-b-[40px] shadow-sm relative overflow-hidden">
                        {/* Decorative background elements */}
                        <View className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10" />
                        <View className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-8 -mb-8" />

                        <View className="px-6 flex-row justify-between items-center z-10">
                            <TouchableOpacity
                                onPress={() => router.replace("/screens/HomeScreen")}
                                className="bg-white/50 p-2 rounded-xl"
                            >
                                <Ionicons name="arrow-back" size={24} color="black" />
                            </TouchableOpacity>
                            <Text className="text-xl font-black text-slate-800 tracking-tight">Profile</Text>
                            <TouchableOpacity
                                onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                                className="px-4 py-2 bg-slate-900 rounded-full shadow-md"
                            >
                                <Text className="font-bold text-white text-xs uppercase tracking-wide">
                                    {isEditing ? 'Save' : 'Edit'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Overlapping Main Content */}
                    <View className="px-6 -mt-16">
                        {/* Avatar Section */}
                        <View className="items-center mb-6">
                            <View className="w-28 h-28 bg-white rounded-[30px] justify-center items-center shadow-lg elevation-10 rotate-3 transform border-4 border-white">
                                <Text className="text-5xl font-black text-slate-800">
                                    {userInfo.name.charAt(0).toUpperCase()}
                                </Text>
                            </View>
                        </View>

                        {/* Name Info (Visual Only) */}
                        <View className="items-center mb-8">
                            <Text className="text-2xl font-black text-slate-800 mb-1">{userInfo.name}</Text>
                            <Text className="text-slate-500 font-medium">{userInfo.phone}</Text>
                        </View>

                        {/* Details Card */}
                        <View className="bg-white p-6 rounded-[30px] shadow-sm mb-6">
                            <Text className="text-lg font-extrabold text-slate-800 mb-6">Personal Details</Text>

                            {/* Read-only fields within the form context if needed, otherwise simplified */}
                            {renderField("Full Name", "name", "person-outline", true)}
                            {renderField("Phone Number", "phone", "call-outline", true)}
                            {renderField("Email Address", "email", "mail-outline", false, "email-address")}
                            {renderField("Gender", "gender", "people-outline", false)}
                        </View>

                        {/* Logout Button */}
                        <TouchableOpacity
                            onPress={() => router.replace("/")}
                            className="flex-row items-center justify-center bg-white py-4 rounded-2xl shadow-sm border border-red-50 active:bg-red-50 mb-8"
                        >
                            <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                            <Text className="text-red-500 font-bold text-base">Log Out</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
};

export default ProfileScreen;
