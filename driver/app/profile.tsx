import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { driverAPI } from '../utils/api';
import { clearDriverData, getDriverData, setDriverData } from '../utils/storage';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function ProfileScreen() {
    const [driver, setDriver] = React.useState<any>(null);
    const router = useRouter();

    React.useEffect(() => {
        const loadProfile = async () => {
            try {
                // Try to get from storage first for fast response
                const cachedData = await getDriverData();
                if (cachedData) setDriver(cachedData);

                // Then fetch fresh data from API
                const response = await driverAPI.getProfile();
                if (response.data && response.data.driver) {
                    setDriver(response.data.driver);
                    // Update cache with fresh data
                    await setDriverData(response.data.driver);
                }
            } catch (err) {
                console.log("Profile load error:", err);
            }
        };
        loadProfile();
    }, []);

    const handleLogout = async () => {
        try {
            await clearDriverData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(auth)/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <View className="flex-1 bg-slate-50 relative">
            <StatusBar style="dark" />

            {/* --- YELLOW BACKGROUND BLOBS --- */}
            {/* --- YELLOW BACKGROUND BLOBS --- */}
            <View
                style={{
                    position: 'absolute',
                    borderRadius: 9999,
                    backgroundColor: '#FFD700',
                    opacity: 0.2,
                    top: -150,
                    right: -100,
                    width: 400,
                    height: 400
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    borderRadius: 9999,
                    backgroundColor: '#FFD700',
                    opacity: 0.1,
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
                        onPress={() => router.push("/edit-profile")}
                        className="w-10 h-10 bg-white rounded-full items-center justify-center border border-slate-100 shadow-sm"
                    >
                        <Ionicons name="pencil" size={20} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>

                {/* Profile Card */}
                <View className="items-center mt-8 px-6">
                    <View className="w-28 h-28 bg-[#FFD700] p-1 rounded-full shadow-2xl shadow-yellow-500/40 mb-4 relative">
                        <View className="w-full h-full bg-slate-100 rounded-full items-center justify-center overflow-hidden border-[3px] border-white">
                            {driver?.profileImage ? (
                                <Image source={{ uri: driver.profileImage }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <Ionicons name="person" size={48} color="#CBD5E1" />
                            )}
                        </View>
                        <View className="absolute bottom-0 right-0 bg-slate-900 p-2 rounded-full border-4 border-white">
                            <Ionicons name="camera" size={14} color="#FFD700" />
                        </View>
                    </View>
                    <Text className="text-slate-900 text-2xl font-black text-center mb-1">{driver?.name || 'Loading...'}</Text>
                    <Text className="text-slate-500 font-bold">+91 {driver?.mobile || '----------'}</Text>
                </View>

                {/* Stats Row */}
                <View className="flex-row justify-between mt-8 px-6">
                    <View className="flex-1 bg-[#FFFDE7] p-4 rounded-[24px] items-center border border-yellow-100 shadow-sm mr-2">
                        <Text className="text-slate-900 text-xl font-black">{driver?.rating || '5.0'}</Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="star" size={12} color="#F59E0B" />
                            <Text className="text-slate-500 text-[9px] font-bold uppercase ml-1">Rating</Text>
                        </View>
                    </View>
                    <View className="flex-1 bg-[#FFFDE7] p-4 rounded-[24px] items-center border border-yellow-100 shadow-sm mx-2">
                        <Text className="text-slate-900 text-xl font-black">{driver?.stats?.completedBookings || 0}</Text>
                        <Text className="text-slate-500 text-[9px] font-bold uppercase mt-1">Trips</Text>
                    </View>
                    <View className="flex-1 bg-[#FFFDE7] p-4 rounded-[24px] items-center border border-yellow-100 shadow-sm ml-2">
                        <Text className="text-slate-900 text-xl font-black">{driver?.experienceYears || 0}</Text>
                        <Text className="text-slate-500 text-[9px] font-bold uppercase mt-1">Years</Text>
                    </View>
                </View>

                {/* Vehicle Info */}
                <View className="mt-8 px-6">
                    <View className="flex-row justify-between items-center mb-4 ml-2">
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">Vehicle Details</Text>
                        <TouchableOpacity onPress={() => router.push("/edit-vehicle")}>
                            <Text className="text-[#F59E0B] text-[10px] font-black uppercase tracking-widest">Edit / Add</Text>
                        </TouchableOpacity>
                    </View>
                    <View className="bg-[#1E293B] p-6 rounded-[30px] shadow-xl shadow-slate-900/20 relative overflow-hidden border-t-4 border-[#FFD700]">
                        {/* Decorative Circles */}
                        <View className="absolute -top-10 -right-10 w-40 h-40 bg-[#FFD700] rounded-full opacity-10" />
                        <View className="absolute bottom-10 left-10 w-20 h-20 bg-white rounded-full opacity-5" />

                        <View className="flex-row justify-between items-start mb-6">
                            <View>
                                <Text className="text-white text-xl font-black tracking-wider">{driver?.vehicleModel || 'No Vehicle'}</Text>
                                <Text className="text-slate-400 text-sm font-bold">{driver?.vehicleType || 'Unknown'} • {driver?.vehicleColor || 'Color'}</Text>
                            </View>
                            <View className="bg-yellow-500/20 px-3 py-1 rounded-lg border border-yellow-500/30">
                                <Text className="text-[#FFD700] font-bold text-xs">Primary</Text>
                            </View>
                        </View>

                        <View className="bg-black/20 p-4 rounded-2xl flex-row justify-between items-center border border-white/5">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">Plate Number</Text>
                            <Text className="text-white text-lg font-black tracking-widest">{driver?.vehicleNumber || '----------'}</Text>
                        </View>
                    </View>
                </View>

                {/* Service specialty */}
                <View className="mt-6 px-6">
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 ml-2">Service Specialty</Text>
                    <View className="bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm flex-row">
                        {/* Cab Option */}
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    const res = await driverAPI.updateVehicle({ serviceType: 'cab' });
                                    if (res.data) {
                                        const current = await getDriverData();
                                        await setDriverData({ ...current, serviceType: 'cab' });
                                        setDriver({ ...driver, serviceType: 'cab' });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                } catch (e) {
                                    console.log("Update service type error:", e);
                                }
                            }}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 20,
                                alignItems: 'center',
                                marginRight: 8,
                                backgroundColor: driver?.serviceType === 'cab' ? '#0F172A' : '#F8FAFC',
                                ... (driver?.serviceType === 'cab' ? {
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 10
                                } : {})
                            }}
                        >
                            <Text style={{
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontSize: 10,
                                color: driver?.serviceType === 'cab' ? '#FFD700' : '#94A3B8'
                            }}>cab</Text>
                        </TouchableOpacity>

                        {/* Rental Option */}
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    const res = await driverAPI.updateVehicle({ serviceType: 'rental' });
                                    if (res.data) {
                                        const current = await getDriverData();
                                        await setDriverData({ ...current, serviceType: 'rental' });
                                        setDriver({ ...driver, serviceType: 'rental' });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                } catch (e) {
                                    console.log("Update service type error:", e);
                                }
                            }}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 20,
                                alignItems: 'center',
                                marginRight: 8,
                                backgroundColor: driver?.serviceType === 'rental' ? '#0F172A' : '#F8FAFC',
                                ... (driver?.serviceType === 'rental' ? {
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 10
                                } : {})
                            }}
                        >
                            <Text style={{
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontSize: 10,
                                color: driver?.serviceType === 'rental' ? '#FFD700' : '#94A3B8'
                            }}>rental</Text>
                        </TouchableOpacity>

                        {/* Both Option */}
                        <TouchableOpacity
                            onPress={async () => {
                                try {
                                    const res = await driverAPI.updateVehicle({ serviceType: 'both' });
                                    if (res.data) {
                                        const current = await getDriverData();
                                        await setDriverData({ ...current, serviceType: 'both' });
                                        setDriver({ ...driver, serviceType: 'both' });
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    }
                                } catch (e) {
                                    console.log("Update service type error:", e);
                                }
                            }}
                            style={{
                                flex: 1,
                                paddingVertical: 12,
                                borderRadius: 20,
                                alignItems: 'center',
                                backgroundColor: driver?.serviceType === 'both' ? '#0F172A' : '#F8FAFC',
                                ... (driver?.serviceType === 'both' ? {
                                    shadowColor: "#000",
                                    shadowOffset: { width: 0, height: 10 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 10,
                                    elevation: 10
                                } : {})
                            }}
                        >
                            <Text style={{
                                fontWeight: '900',
                                textTransform: 'uppercase',
                                fontSize: 10,
                                color: driver?.serviceType === 'both' ? '#FFD700' : '#94A3B8'
                            }}>both</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Settings Section */}
                <View className="mt-8 px-6">
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 ml-2">Settings</Text>

                    <TouchableOpacity
                        onPress={() => router.push("/history")}
                        className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm mb-3"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center">
                                <Ionicons name="time" size={20} color="#3B82F6" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base ml-4">Ride History</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/earnings")}
                        className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm mb-3"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-green-50 rounded-full items-center justify-center">
                                <Ionicons name="card" size={20} color="#22C55E" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base ml-4">Earnings & Payouts</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/documents")}
                        className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm"
                    >
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
                        className="bg-red-50 py-5 rounded-[24px] border border-red-100 flex-row items-center justify-center mb-8"
                        onPress={handleLogout}
                    >
                        <Ionicons name="log-out" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text className="text-red-500 font-black text-base uppercase tracking-wider">Logout</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}
