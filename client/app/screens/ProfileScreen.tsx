import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    Alert, 
    KeyboardAvoidingView, 
    Platform, 
    Dimensions,
    ActivityIndicator,
    BackHandler,
    Image
} from 'react-native';
import { getImageUrl } from '../../utils/imagekit';
import { useRouter } from "expo-router";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { userAPI } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

const ProfileScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user: authUser, refreshProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(!authUser);

    const [userInfo, setUserInfo] = useState({
        name: "",
        email: "",
        phone: "",
        gender: ""
    });

    useEffect(() => {
        // 1. Initialize with current context data immediately
        if (authUser) {
            console.log("[Profile] Initializing with authUser:", authUser.name);
            setUserInfo({
                name: authUser.name || "",
                email: authUser.email || "",
                phone: authUser.mobile || "",
                gender: authUser.gender || ""
            });
        }
        
        // 2. Always fetch fresh data in background on mount
        fetchProfile();
    }, []); // Only on mount

    // --- BACK BUTTON HANDLING ---
    useEffect(() => {
        const backAction = () => {
            router.replace("/screens/HomeScreen");
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    const fetchProfile = async () => {
        try {
            // Background fetch - don't show spinner if we already have data
            const response = await userAPI.getProfile();
            console.log("[Profile] fetchProfile: response", response.data);
            const { user } = response.data;
            setUserInfo({
                name: user?.name || "",
                email: user?.email || "",
                phone: user?.mobile || "",
                gender: user?.gender || ""
            });

            // Keep AuthContext in sync
            if (refreshProfile) {
                console.log("[Profile] Triggering AuthContext refresh...");
                await refreshProfile();
            }
        } catch (error) {
            Alert.alert("Error", "Failed to fetch profile data");
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
            
            // Refresh global state after update
            if (refreshProfile) await refreshProfile();
            
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to update profile");
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            'Log out',
            'Are you sure you want to log out of your account?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Log Out', style: 'destructive', onPress: async () => {
                    await logout();
                    router.replace('/');
                }}
            ],
            { cancelable: true }
        );
    };

    // ✅ Gender Selector Component for Edit Mode
    const GenderSelector = () => {
        const options = ['Male', 'Female', 'Other'];
        return (
            <View className="flex-row gap-3 mt-1">
                {options.map((opt) => (
                    <TouchableOpacity
                        key={opt}
                        onPress={() => setUserInfo({ ...userInfo, gender: opt })}
                        className={`flex-1 py-4 rounded-[22px] items-center border-2 ${
                            userInfo.gender === opt 
                            ? 'bg-[#FFD700] border-[#FFD700]' 
                            : 'bg-slate-50 border-slate-200'
                        }`}
                    >
                        <Text className={`font-black ${userInfo.gender === opt ? 'text-slate-900' : 'text-slate-500'}`}>
                            {opt}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
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
            <View className="mb-6">
                <View className="flex-row items-center mb-2.5 ml-1">
                    <Ionicons name={icon as any} size={20} color="#64748B" />
                    <Text className="text-slate-500 text-[12px] font-black uppercase ml-2 tracking-[2px]">{label}</Text>
                </View>

                {isEditing && !isReadOnly ? (
                    // ✅ Checking if it's the Gender field to show the selector
                    key === 'gender' ? (
                        <GenderSelector />
                    ) : (
                        <TextInput
                            value={userInfo[key]}
                            onChangeText={(text) => setUserInfo({ ...userInfo, [key]: text })}
                            className="bg-slate-50 border-2 border-slate-200 rounded-[22px] px-6 py-4.5 text-slate-900 font-bold text-lg"
                            keyboardType={keyboardType}
                            placeholder={`Enter ${label}`}
                            placeholderTextColor="#94A3B8"
                        />
                    )
                ) : (
                    <View className="bg-white border border-slate-100 rounded-[22px] px-6 py-5 shadow-sm flex-row items-center justify-between">
                        <Text className={`text-lg font-black ${isValueEmpty ? "text-slate-300 italic" : "text-slate-800"}`}>
                            {isValueEmpty ? `Not Provided` : value}
                        </Text>
                        {isReadOnly && <Ionicons name="lock-closed" size={18} color="#CBD5E1" />}
                    </View>
                )}
            </View>
        );
    };

    // Only show full screen loader if we have NO data at all
    if (loading && !userInfo.name && !authUser) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#F8FAFC]">
            <StatusBar style="dark" />
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
                <ScrollView 
                    showsVerticalScrollIndicator={false} 
                    contentContainerStyle={{ paddingBottom: 160 }}
                >
                    <View 
                        className="bg-[#FFD700] rounded-b-[60px] shadow-lg relative overflow-hidden"
                        style={{ paddingTop: insets.top + 15, paddingBottom: 85 }}
                    >
                        <View className="absolute -top-10 -right-10 w-48 h-48 bg-white/10 rounded-full" />
                        
                        <View className="px-6 flex-row items-center justify-between z-10 w-full">
                            <View style={{ width: 70 }}>
                                <TouchableOpacity 
                                    onPress={() => router.replace("/screens/HomeScreen")} 
                                    className="bg-white/40 p-3 rounded-2xl items-center justify-center"
                                >
                                    <Ionicons name="arrow-back" size={26} color="black" />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-1 items-center px-2">
                                <Text numberOfLines={1} className="text-[26px] font-black text-slate-900 italic tracking-tighter text-center">
                                    My Account
                                </Text>
                            </View>

                            <View style={{ width: 70, alignItems: 'flex-end' }}>
                                <TouchableOpacity 
                                    onPress={() => isEditing ? handleSave() : setIsEditing(true)}
                                    className={`px-4 py-2.5 rounded-full shadow-xl ${isEditing ? 'bg-green-600' : 'bg-slate-900'}`}
                                >
                                    <Text className="font-black text-white text-[10px] uppercase tracking-widest">
                                        {isEditing ? 'SAVE' : 'EDIT'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    <View className="px-6 -mt-10">
                        <View className="bg-white p-8 rounded-[45px] shadow-2xl shadow-slate-300 border border-slate-50">
                            
                            <View className="mb-10 items-center border-b border-slate-50 pb-8">
                                <View className="w-24 h-24 bg-[#FFD700] rounded-[35px] justify-center items-center shadow-md border-4 border-white mb-4 overflow-hidden">
                                    {authUser?.profileImage ? (
                                        <Image 
                                            source={{ uri: getImageUrl(authUser.profileImage, { width: 200, height: 200, quality: 90 }) }} 
                                            className="w-full h-full" 
                                        />
                                    ) : (
                                        <Text className="text-4xl font-black text-slate-900">
                                            {userInfo.name ? userInfo.name.charAt(0).toUpperCase() : "U"}
                                        </Text>
                                    )}
                                </View>
                                <Text className="text-3xl font-black text-slate-900 tracking-tighter italic text-center">
                                    {userInfo.name || "Hello Guest"}
                                </Text>
                                <View className="flex-row items-center mt-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                    <Ionicons name="checkmark-circle" size={14} color="#16A34A" />
                                    <Text className="text-green-700 font-black text-[9px] tracking-widest uppercase ml-1.5">
                                        Verified Member
                                    </Text>
                                </View>
                            </View>

                            <View className="w-full">
                                <Text className="text-[12px] font-black text-slate-400 mb-6 tracking-[2px] uppercase italic pl-1">
                                    Identity Details
                                </Text>
                                
                                {renderField("Full Identity", "name", "person-outline", true)}
                                {renderField("Registered Mobile", "phone", "call-outline", true)}
                                {renderField("Email Address", "email", "mail-outline", false, "email-address")}
                                {renderField("Gender", "gender", "people-outline", false)}
                            </View>
                        </View>

                        {/* Legal Section */}
                        <View className="mt-8 px-2">
                            <Text className="text-[12px] font-black text-slate-400 mb-4 tracking-[2px] uppercase italic">
                                Legal Information
                            </Text>
                            
                            <TouchableOpacity
                                onPress={() => router.push("/screens/TermsScreen")}
                                className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm mb-3"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                                        <Ionicons name="document-text-outline" size={20} color="#64748B" />
                                    </View>
                                    <Text className="text-slate-900 font-bold text-base ml-4">Terms & Conditions</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/screens/PrivacyScreen")}
                                className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm mb-3"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                                        <Ionicons name="shield-checkmark-outline" size={20} color="#64748B" />
                                    </View>
                                    <Text className="text-slate-900 font-bold text-base ml-4">Privacy Policy</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.push("/screens/RefundScreen")}
                                className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm"
                            >
                                <View className="flex-row items-center">
                                    <View className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center">
                                        <Ionicons name="cash-outline" size={20} color="#64748B" />
                                    </View>
                                    <Text className="text-slate-900 font-bold text-base ml-4">Refund Policy</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            onPress={confirmLogout}
                            activeOpacity={0.8}
                            className="mt-8 flex-row items-center justify-center bg-white py-5 rounded-[28px] shadow-md border border-red-100 active:bg-red-50"
                        >
                            <Ionicons name="log-out-outline" size={24} color="#EF4444" style={{ marginRight: 10 }} />
                            <Text className="text-red-500 font-black text-base uppercase tracking-[2.5px]">
                                Log Out Session
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
                    {/* Bottom Tab Bar */}
                    <View
                        className="absolute bottom-0 w-full bg-white flex-row justify-around items-center border-t border-slate-100 shadow-2xl elevation-[25] z-50"
                        style={{ paddingBottom: Math.max(insets.bottom, 20), paddingTop: 10 }}
                    >
                        <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace('/screens/HomeScreen')}>
                            <Ionicons name="home" size={24} color="#94A3B8" />
                            <Text className="text-[11px] font-bold mt-1 text-slate-400">Home</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace('/screens/HistoryScreen')}>
                            <Ionicons name="list" size={24} color="#94A3B8" />
                            <Text className="text-[11px] font-bold mt-1 text-slate-400">History</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => router.replace({ pathname: '/screens/BookingScreen', params: { mode: 'schedule' } })}>
                            <Ionicons name="calendar" size={24} color="#94A3B8" />
                            <Text className="text-[11px] font-bold mt-1 text-slate-400">Schedule</Text>
                        </TouchableOpacity>
                        <TouchableOpacity className="items-center justify-center pt-2 w-1/4" onPress={() => { /* already here */ }}>
                            <Ionicons name="person" size={24} color="#1E293B" />
                            <Text className="text-[11px] font-bold mt-1 text-slate-800">Profile</Text>
                        </TouchableOpacity>
                    </View>
        </View>
    );
};

export default ProfileScreen;