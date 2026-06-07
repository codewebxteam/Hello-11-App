import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert,
    useWindowDimensions,
    NativeModules,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getImageUrl } from '../utils/imagekit';
import * as Haptics from 'expo-haptics';
import RazorpayCheckout from "react-native-razorpay";
import { driverAPI } from '../utils/api';
import { clearDriverData, getDriverData, setDriverData } from '../utils/storage';
import { useDriverAuth } from '../context/DriverAuthContext';

import Header from '../components/Header';

export default function ProfileScreen() {
    const { width: screenWidth } = useWindowDimensions();
    const isLargePhone = screenWidth >= 412;
    const isTablet = screenWidth >= 768;
    const contentMaxWidth = isTablet ? 760 : isLargePhone ? 560 : undefined;
    const insets = useSafeAreaInsets();
    
    const { driver, setDriver, refreshProfile: contextRefresh, profileVersion } = useDriverAuth();
    const bgBlobLarge = Math.min(400, Math.max(260, Math.round(screenWidth * 0.9)));
    const bgBlobSmall = Math.min(220, Math.max(160, Math.round(screenWidth * 0.5)));

    const router = useRouter();

    // States for Payment & Live Wallet Data
    const [isPaying, setIsPaying] = useState(false);
    const [walletData, setWalletData] = useState<any>(null);

    const profileImageSource = React.useMemo(() => {
        if (!driver?.profileImage) return null;
        const url = getImageUrl(driver.profileImage, { width: 300, height: 300, quality: 90, version: profileVersion });
        return { uri: url };
    }, [driver?.profileImage, profileVersion]);

    // Exact backend API call from WalletScreen to fetch identical data
    // Exact backend API call from WalletScreen to fetch identical data
    const fetchWalletData = async () => {
        try {
            // Yahan chauthe parameter mein se 'period' hata diya hai
            const response = await driverAPI.getEarnings('week', undefined, undefined, {
                txPage: 1,
                commPage: 1,
                txLimit: 1,
                commLimit: 1
            });
            if (response.data?.earnings) {
                setWalletData(response.data.earnings);
            }
        } catch (err) {
            console.error("Failed to fetch wallet data on profile screen:", err);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            contextRefresh();
            fetchWalletData(); // Fetches fresh backend numbers every time screen focuses
        }, [contextRefresh])
    );

    const handleLogout = async () => {
        try {
            await clearDriverData();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace("/(auth)/login");
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            "Logout",
            "Are you sure you want to logout?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: handleLogout }
            ]
        );
    };

    const confirmServiceTypeChange = (nextServiceType: 'cab' | 'rental' | 'both') => {
        if (!driver || driver.serviceType === nextServiceType) return;

        Alert.alert(
            "Change Service Specialty",
            `Do you want to change your service specialty to ${nextServiceType.toUpperCase()}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Confirm",
                    onPress: async () => {
                        try {
                            const res = await driverAPI.updateVehicle({ serviceType: nextServiceType });
                            if (res.data) {
                                const current = await getDriverData();
                                await setDriverData({ ...current, serviceType: nextServiceType });
                                if (driver) {
                                    setDriver({ ...driver, serviceType: nextServiceType });
                                }
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            }
                        } catch (e) {
                            console.log("Update service type error:", e);
                        }
                    }
                }
            ]
        );
    };

    // --- Dynamic Data Extraction Matching Wallet Screen ---
    const todayEarnings = (driver as any)?.todayEarnings || 0;
    const adminDues = Number(walletData?.pendingCommission || 0);
    const unpaidRidesDone = walletData?.unpaidRideCount || 0; 
    const lifetimeEarnings = Number(walletData?.lifetimeBalance || 0);

    // --- RAZORPAY PAYMENT LOGIC ---
    const handlePayAdmin = async () => {
        if (isPaying) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        if (adminDues <= 0) {
            Alert.alert("No Balance", "You don't have any pending commission to pay.");
            return;
        }

        try {
            setIsPaying(true);
            const razorpayNative =
                (NativeModules as any)?.RNRazorpayCheckout ||
                (NativeModules as any)?.RazorpayCheckout;
            
            if (
                !razorpayNative ||
                !RazorpayCheckout ||
                typeof (RazorpayCheckout as any).open !== "function"
            ) {
                Alert.alert(
                    "Razorpay Unavailable",
                    "Payment SDK is not loaded in this build. Use a Dev Build / APK (not Expo Go) and rebuild the app."
                );
                return;
            }

            const orderRes = await driverAPI.createPaymentOrder();
            const order = orderRes?.data?.order;
            const keyId = orderRes?.data?.key_id;

            if (!order?.id || !order?.amount || !keyId) {
                Alert.alert("Payment Setup Error", "Payment gateway configuration is incomplete. Please contact support.");
                return;
            }

            const options = {
                description: "Commission Payment to Admin",
                image: "https://i.imgur.com/3986X31.png",
                currency: "INR",
                key: keyId,
                amount: order.amount,
                name: "Hello-11 Admin",
                order_id: order.id,
                prefill: {
                    email: driver?.email || "driver@hello11.com",
                    contact: driver?.mobile || "",
                    name: driver?.name || "Driver",
                },
                theme: { color: "#FFD700" },
            };

            const data: any = await RazorpayCheckout.open(options);
            await driverAPI.verifyPaymentVerify({
                razorpay_order_id: data.razorpay_order_id,
                razorpay_payment_id: data.razorpay_payment_id,
                razorpay_signature: data.razorpay_signature,
            });
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Success", "Payment successful! Your balance has been updated.");
            
            // Refresh both contexts instantly after payment
            contextRefresh(); 
            fetchWalletData();
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            console.error("Order creation failed:", error);
            Alert.alert(
                "Payment Failed",
                error?.reason ||
                error?.description ||
                error?.message ||
                error?.response?.data?.reason ||
                error?.response?.data?.message ||
                "Checkout cancelled"
            );
        } finally {
            setIsPaying(false);
        }
    };

    return (
        <View className="flex-1 bg-slate-50 relative">
            <StatusBar style="dark" />

            {/* --- YELLOW BACKGROUND BLOBS --- */}
            <View
                style={{
                    position: 'absolute',
                    borderRadius: 9999,
                    backgroundColor: '#FFD700',
                    opacity: 0.2,
                    top: -Math.round(bgBlobLarge * 0.38),
                    right: -Math.round(bgBlobLarge * 0.25),
                    width: bgBlobLarge,
                    height: bgBlobLarge
                }}
            />
            <View
                style={{
                    position: 'absolute',
                    borderRadius: 9999,
                    backgroundColor: '#FFD700',
                    opacity: 0.1,
                    top: Math.round(bgBlobSmall * 0.45),
                    left: -Math.round(bgBlobSmall * 0.5),
                    width: bgBlobSmall,
                    height: bgBlobSmall
                }}
            />

            {/* Header */}
            <Header 
                title="My Profile" 
                transparent={true}
                rightIcon="pencil"
                onRightPress={() => router.push("/edit-profile")}
            />

            <ScrollView 
                style={{ flex: 1 }} 
                contentContainerStyle={{ paddingBottom: 40 + insets.bottom, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}
                showsVerticalScrollIndicator={false}
            >

                {/* Profile Card */}
                <View className="items-center mt-8 px-6">
                    <View className="w-28 h-28 bg-[#FFD700] p-1 rounded-full shadow-2xl shadow-yellow-500/40 mb-4 relative">
                        <View className="w-full h-full bg-slate-100 rounded-full items-center justify-center overflow-hidden border-[3px] border-white">
                            {profileImageSource ? (
                                <Image 
                                    source={profileImageSource} 
                                    style={{ width: '100%', height: '100%' }} 
                                />
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
                        <Text className="text-slate-900 text-xl font-black">{driver?.rating?.toFixed(1) || '5.0'}</Text>
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

                {/* --- PREMIUM WALLET & DUES CARD (DATA SYNCED) --- */}
                <View className="mt-8 px-6">
                    <View className="flex-row justify-between items-center mb-4 ml-2">
                        <Text className="text-slate-400 text-xs font-black uppercase tracking-widest">Premium Wallet</Text>
                        <TouchableOpacity onPress={() => router.push("/wallet")}>
                            <Text className="text-[#F59E0B] text-[10px] font-black uppercase tracking-widest">View All</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Premium Hero Banner identical to WalletScreen */}
                    <View className="rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/20">
                        <LinearGradient
                            colors={["#0F172A", "#1E293B", "#334155"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={{ padding: 32 }}
                        >
                            {/* Top Row: Title & Badge */}
                            <View className="flex-row justify-between items-center mb-8">
                                <View className="bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30 max-w-[58%]">
                                    <Text className="text-amber-400 text-[8px] font-black uppercase tracking-[1px]" numberOfLines={1} adjustsFontSizeToFit>Premium Driver Wallet</Text>
                                </View>
                                <View className="flex-row items-center flex-1 justify-end pl-2">
                                    <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-sm shadow-emerald-400/50" />
                                    <Text className="text-emerald-400 text-[9px] font-black uppercase tracking-[1px]" numberOfLines={1} adjustsFontSizeToFit>Active & Verified</Text>
                                </View>
                            </View>

                            {/* Main Stat: Balance */}
                            <View className="mb-10">
                                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">
                                    Payable Commission
                                </Text>
                                <View className="flex-row items-baseline">
                                    <Text className="text-white text-5xl font-black italic tracking-tighter">
                                        ₹{adminDues.toFixed(2)}
                                    </Text>
                                    <View className="ml-3 bg-white/10 px-2 py-0.5 rounded-lg border border-white/5">
                                        <Text className="text-slate-300 text-[9px] font-bold uppercase">Due</Text>
                                    </View>
                                </View>
                            </View>

                            {/* Quick Stats Grid */}
                            <View className="flex-row justify-between pt-6 border-t border-white/10">
                                <View>
                                    <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Total Lifetime Earned</Text>
                                    <Text className="text-white text-xl font-black italic">₹{lifetimeEarnings.toFixed(0)}</Text>
                                </View>
                                <View className="items-end flex-1">
                                    <Text className="text-slate-500 text-[8px] font-black uppercase mb-1 text-right" numberOfLines={1}>Rides Pending Pay</Text>
                                    <View className="flex-row items-center justify-end w-full">
                                        <Ionicons name="car-sport" size={14} color="#FFD700" />
                                        <Text className="text-amber-400 text-xl font-black italic ml-1">{unpaidRidesDone}</Text>
                                    </View>
                                </View>
                            </View>
                        </LinearGradient>
                    </View>

                    {/* Action Area for Premium Wallet */}
                    <View className="flex-row gap-4 mt-6">
                        <TouchableOpacity
                            onPress={handlePayAdmin}
                            disabled={isPaying || adminDues <= 0}
                            activeOpacity={0.9}
                            className={`flex-[2] rounded-2xl h-14 flex-row items-center justify-center shadow-lg ${
                                isPaying || adminDues <= 0 ? "bg-amber-300 shadow-amber-300/20 opacity-80" : "bg-amber-400 shadow-amber-400/20"
                            }`}
                        >
                            {isPaying ? (
                                <ActivityIndicator size="small" color="#0F172A" />
                            ) : (
                                <Ionicons name="arrow-forward-circle" size={24} color="#0F172A" />
                            )}
                            <Text className="text-[#0F172A] font-black text-sm uppercase tracking-[1px] ml-2" numberOfLines={1} adjustsFontSizeToFit>
                                {isPaying ? "Processing..." : "Pay Now"}
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            onPress={() => router.push("/wallet")}
                            activeOpacity={0.8}
                            className="flex-1 bg-white rounded-2xl h-14 items-center justify-center border border-slate-100 shadow-sm"
                        >
                            <Ionicons name="receipt-outline" size={24} color="#64748B" />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* --- RESTORED VEHICLE INFO CARD --- */}
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
                            <Text className="text-white text-base font-black tracking-wide ml-2 flex-shrink" numberOfLines={1}>
                                {driver?.vehicleNumber || '----------'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Service specialty */}
                <View className="mt-6 px-6">
                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-4 ml-2">Service Specialty</Text>
                    <View className="bg-white p-2 rounded-[24px] border border-slate-100 shadow-sm flex-row">
                        {['cab', 'rental', 'both'].map((type) => {
                            const isSelected = driver?.serviceType === type;
                            return (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => confirmServiceTypeChange(type as 'cab' | 'rental' | 'both')}
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        borderRadius: 20,
                                        alignItems: 'center',
                                        marginRight: type !== 'both' ? 8 : 0,
                                        backgroundColor: isSelected ? '#0F172A' : '#F8FAFC',
                                        ...(isSelected ? {
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
                                        color: isSelected ? '#FFD700' : '#94A3B8'
                                    }}>{type}</Text>
                                </TouchableOpacity>
                            )
                        })}
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
                            <Text className="text-slate-900 font-bold text-base ml-4">Earnings Summary</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.push("/wallet")}
                        className="bg-white p-5 rounded-[24px] flex-row items-center justify-between border border-slate-100 shadow-sm mb-3"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-amber-50 rounded-full items-center justify-center">
                                <Ionicons name="wallet" size={20} color="#EAB308" />
                            </View>
                            <Text className="text-slate-900 font-bold text-base ml-4">My Wallet</Text>
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
                            <Text className="text-slate-900 font-bold text-base ml-4">Documents & KYC</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
                    </TouchableOpacity>

                    <Text className="text-slate-400 text-xs font-black uppercase tracking-widest mb-2 mt-4 ml-2">Legal</Text>

                    <TouchableOpacity
                        onPress={() => router.push("/terms")}
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
                        onPress={() => router.push("/privacy")}
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
                        onPress={() => router.push("/refund")}
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

                {/* Logout Button */}
                <View className="px-6 mt-10">
                    <TouchableOpacity
                        className="bg-red-50 py-5 rounded-[24px] border border-red-100 flex-row items-center justify-center mb-8"
                        onPress={confirmLogout}
                    >
                        <Ionicons name="log-out" size={20} color="#EF4444" style={{ marginRight: 8 }} />
                        <Text className="text-red-500 font-black text-base uppercase tracking-wider">Logout</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </View>
    );
}