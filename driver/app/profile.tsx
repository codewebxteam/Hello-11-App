import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    SafeAreaView,
    Image,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function ProfileScreen() {
    const router = useRouter();

    return (
        <View className="flex-1 bg-slate-50 relative">
            <StatusBar style="dark" />

            {/* --- YELLOW BACKGROUND BLOBS --- */}
            <View
                className="absolute rounded-full bg-[#FFD700] opacity-20"
                style={{
                    top: -150,
                    right: -100,
                    width: 400,
                    height: 400
                }}
            />
            <View
                className="absolute rounded-full bg-[#FFD700] opacity-10"
                style={{
                    top: 100,
                    left: -100,
                    width: 200,
                    height: 200
                }}
            />

            {/* Header */}
            <View
                className="z-10"
                style={{ paddingTop: STATUSBAR_HEIGHT }}
            >
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">My Profile</Text>
                    <TouchableOpacity
                        onPress={() => alert("Edit Profile")}
                        className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm"
                    >
                        <Ionicons name="pencil" size={20} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Profile Card */}
                <View className="items-center mt-8 px-6">
                    <View className="w-28 h-28 bg-[#FFD700] p-1 rounded-full shadow-2xl shadow-yellow-500/40 mb-4 relative">
                        <View className="w-full h-full bg-slate-100 rounded-full items-center justify-center overflow-hidden border-[3px] border-white">
                            <Ionicons name="person" size={48} color="#CBD5E1" />
                        </View>
                        <View className="absolute bottom-0 right-0 bg-slate-900 p-2 rounded-full border-4 border-white">
                            <Ionicons name="camera" size={14} color="#FFD700" />
                        </View>
                    </View>
                    <Text className="text-slate-900 text-2xl font-black">Amit Kumar</Text>
                    <Text className="text-slate-500 font-bold">+91 98765 43210</Text>
                </View>

                {/* Stats Row */}
                <View className="flex-row justify-between mt-8 gap-4 px-6">
                    <View className="flex-1 bg-[#FFFDE7] p-4 rounded-[24px] items-center border border-yellow-100 shadow-sm">
                        <Text className="text-slate-900 text-xl font-black">4.9</Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text className="text-slate-500 text-[9px] font-bold uppercase ml-1">Rating</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-[#FFFDE7] p-4 rounded-[24px] items-center border border-yellow-100 shadow-sm">
                        <Text className="text-slate-900 text-xl font-black">1.2k</Text>
                        <Text className="text-slate-500 text-[9px] font-bold uppercase mt-1">Trips</Text>
                    </View>
                    <View className="flex-1 bg-[#FFFDE7] p-4 rounded-[24px] items-center border border-yellow-100 shadow-sm">
                        <Text className="text-slate-900 text-xl font-black">2.5</Text>
                        <Text className="text-slate-500 text-[9px] font-bold uppercase mt-1">Years</Text>
                    </View>
                </View>

                {/* Vehicle Info */}
                <View className="mt-8 px-6">
                    <View className="flex-row justify-between items-center mb-4 ml-2">
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">Vehicle Details</Text>
                        <TouchableOpacity onPress={() => alert("Edit Vehicle")}>
                            <Text className="text-[#F59E0B] text-[10px] font-black uppercase tracking-widest">Edit / Add</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="bg-[#1E293B] p-6 rounded-[30px] shadow-xl shadow-slate-900/20 relative overflow-hidden border-t-4 border-[#FFD700]">
                        {/* Decorative Circles */}
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFD700] rounded-full opacity-10" />
                        <View className="absolute bottom-10 left-10 w-20 h-20 bg-white rounded-full opacity-5" />

                        <View className="flex-row justify-between items-start mb-6">
                            <View>
                                <Text className="text-white text-xl font-black tracking-wider">Swift Dzire</Text>
                                <Text className="text-slate-400 text-sm font-bold">Sedan • White</Text>
                            </View>
                            <View className="bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/30">
                                <Text className="text-[#FFD700] font-bold text-xs">Primary</Text>
                            </View>
                        </View>

                        <View className="bg-black/20 p-4 rounded-2xl flex-row justify-between items-center border border-white/5">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Plate Number</Text>
                            <Text className="text-white text-lg font-black tracking-widest">UP 32 JK 1234</Text>
                        </View>
                    </View>
                </View>

                {/* Menu Options */}
                <View className="mt-8 px-6 space-y-3">
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 ml-2">Settings</Text>

                    <TouchableOpacity
                        onPress={() => router.push("/history")}
                        className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm active:scale-[0.98]"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                                <Ionicons name="time" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base ml-4">Ride History</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm active:scale-[0.98]">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                                <Ionicons name="card" size={20} color="#22C55E" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base ml-4">Earnings & Payouts</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm active:scale-[0.98]">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-purple-50 rounded-full items-center justify-center">
                                <Ionicons name="document-text" size={20} color="#A855F7" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base ml-4">Documents</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                </View>

                {/* Logout Button */}
                <View className="px-6 mt-10">
                    <TouchableOpacity
                        className="bg-red-50 py-5 rounded-[24px] border border-red-100 flex-row items-center justify-center space-x-2 active:scale-[0.98] mb-8"
                        onPress={() => router.replace("/(auth)/login")}
                    >
                        <Ionicons name="log-out" size={20} color="#EF4444" />
                        <Text className="text-red-500 font-black text-base uppercase tracking-wider">Logout</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
