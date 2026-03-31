import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    Animated,
    Easing,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../utils/api';
import { getEarningsData, setEarningsData } from '../utils/storage';

const { width } = Dimensions.get('window');
const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

// Shimmer Component
const ShimmerPlaceHolder = ({ className }: { className?: string }) => {
    const shimmerAnim = React.useRef(new Animated.Value(-1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1500,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const translateX = shimmerAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-width, width],
    });

    return (
        <View className={`${className || ""} bg-slate-200 overflow-hidden relative`}>
            <Animated.View
                style={{
                    transform: [{ translateX }],
                    width: '100%',
                    height: '100%',
                    position: 'absolute',
                }}
            >
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ flex: 1 }}
                />
            </Animated.View>
        </View>
    );
};

export default function EarningsScreen() {
    const router = useRouter();
    const [earnings, setEarnings] = React.useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = async (period = 'week', isInitial = false) => {
        try {
            setSelectedPeriod(period);
            setLoading(true);
            
            if (isInitial) {
                const cached = await getEarningsData();
                if (cached) setEarnings(cached);
            }

            const response = await driverAPI.getEarnings(period);
            const newData = response.data?.earnings || response.data;
            
            if (newData) {
                setEarnings(newData);
                if (period === 'week') await setEarningsData(newData);
            }
        } catch (error) {
            console.error("Error fetching earnings:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    React.useEffect(() => {
        loadData('week', true);
    }, []);

    // Metric Calculations
    const velocity = React.useMemo(() => {
        if (!earnings) return "0.0";
        const hours = parseFloat(earnings.onlineHours);
        const income = parseFloat(earnings.totalEarnings || 0);
        if (isNaN(hours) || isNaN(income) || hours <= 0) return "0.0";
        return (income / hours).toFixed(1);
    }, [earnings]);

    const roi = React.useMemo(() => {
        if (!earnings) return "0";
        const trips = parseInt(earnings.totalTrips);
        const income = parseFloat(earnings.totalEarnings || 0);
        if (isNaN(trips) || isNaN(income) || trips <= 0) return "0";
        return (income / trips).toFixed(0);
    }, [earnings]);

    // Full Screen Shimmer Guard (Restored as requested)
    if (loading && !earnings) {
        return (
            <View className="flex-1 bg-slate-50">
                <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-slate-50">
                    <ShimmerPlaceHolder className="w-10 h-10 rounded-full" />
                    <ShimmerPlaceHolder className="w-32 h-6 rounded-full" />
                    <ShimmerPlaceHolder className="w-10 h-10 rounded-full" />
                </View>
                <ScrollView className="flex-1 px-8 mt-8">
                    <ShimmerPlaceHolder className="h-56 rounded-[32px] mb-8" />
                    <ShimmerPlaceHolder className="h-14 rounded-full mb-8" />
                    <View className="flex-row gap-4 mb-8">
                        <ShimmerPlaceHolder className="flex-1 h-32 rounded-[28px]" />
                        <ShimmerPlaceHolder className="flex-1 h-32 rounded-[28px]" />
                    </View>
                    <ShimmerPlaceHolder className="h-48 rounded-[32px]" />
                </ScrollView>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            {/* Premium Header */}
            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white px-6 py-4 flex-row items-center justify-between border-b border-slate-50 shadow-sm">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                    <Ionicons name="chevron-back" size={24} color="#1E293B" />
                </TouchableOpacity>
                <Text style={{ color: '#0f172a', fontWeight: '900', fontSize: 12, textTransform: 'uppercase', letterSpacing: 4 }}>Financial Center</Text>
                <TouchableOpacity onPress={() => loadData(selectedPeriod)} className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100">
                    <Ionicons name="sync" size={18} color="#1E293B" />
                </TouchableOpacity>
            </View>

            <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
                {/* Main Glassmorphism Card */}
                <View className="rounded-[32px] overflow-hidden shadow-2xl shadow-slate-900/10 mb-8">
                    <LinearGradient
                        colors={['#0F172A', '#1E293B']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-8"
                    >
                        {loading ? (
                            <View>
                                <ShimmerPlaceHolder className="w-24 h-3 rounded mb-2 bg-slate-700" />
                                <ShimmerPlaceHolder className="w-48 h-10 rounded bg-slate-700 mb-8" />
                                <View className="flex-row justify-between pt-6 border-t border-white/5">
                                    <View>
                                        <ShimmerPlaceHolder className="w-16 h-2 rounded mb-2 bg-slate-700" />
                                        <ShimmerPlaceHolder className="w-24 h-6 rounded bg-slate-700" />
                                    </View>
                                    <View className="items-end">
                                        <ShimmerPlaceHolder className="w-20 h-2 rounded mb-2 bg-slate-700" />
                                        <ShimmerPlaceHolder className="w-28 h-6 rounded bg-slate-700" />
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <>
                                <View className="flex-row justify-between items-start mb-6">
                                    <View>
                                        <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest mb-1">Total Balance</Text>
                                        <Text className="text-white text-5xl font-black italic">₹{earnings?.totalEarnings || 0}</Text>
                                    </View>
                                    <View className="bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
                                        <Text className="text-amber-400 text-[8px] font-black uppercase">Premium Account</Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center justify-between pt-6 border-t border-white/5">
                                    <View>
                                        <Text className="text-slate-400 text-[8px] font-black uppercase mb-1">Today's Earnings</Text>
                                        <Text className="text-[#FFD700] text-xl font-black italic">₹{earnings?.todayEarnings || 0}</Text>
                                    </View>
                                    <View className="items-end">
                                        <Text className="text-slate-400 text-[8px] font-black uppercase mb-1">Professional Identity</Text>
                                        <View className="flex-row items-center">
                                            <Ionicons name="shield-checkmark" size={12} color="#10B981" />
                                            <Text className="text-green-500 text-xl font-black italic ml-1">VERIFIED</Text>
                                        </View>
                                    </View>
                                </View>
                            </>
                        )}
                    </LinearGradient>
                </View>

                {/* Period Selector */}
                <View className="bg-white p-1 rounded-full border border-slate-100 flex-row mb-8 shadow-sm">
                    <TouchableOpacity
                        onPress={() => loadData('day')}
                        style={{ backgroundColor: selectedPeriod === 'day' ? '#0F172A' : 'transparent' }}
                        className="flex-1 py-3 rounded-full items-center"
                    >
                        <Text style={{ color: selectedPeriod === 'day' ? '#FFD700' : '#94A3B8' }} className="text-[9px] font-black uppercase tracking-widest">Daily</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => loadData('week')}
                        style={{ backgroundColor: selectedPeriod === 'week' ? '#0F172A' : 'transparent' }}
                        className="flex-1 py-3 rounded-full items-center"
                    >
                        <Text style={{ color: selectedPeriod === 'week' ? '#FFD700' : '#94A3B8' }} className="text-[9px] font-black uppercase tracking-widest">Weekly</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => loadData('month')}
                        style={{ backgroundColor: selectedPeriod === 'month' ? '#0F172A' : 'transparent' }}
                        className="flex-1 py-3 rounded-full items-center"
                    >
                        <Text style={{ color: selectedPeriod === 'month' ? '#FFD700' : '#94A3B8' }} className="text-[9px] font-black uppercase tracking-widest">Monthly</Text>
                    </TouchableOpacity>
                </View>

                {/* Performance Metrics */}
                <View className="flex-row gap-4 mb-8">
                    <View className="flex-1 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm items-center">
                        <View className="w-10 h-10 bg-emerald-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="speedometer" size={18} color="#10B981" />
                        </View>
                        {loading ? (
                            <ShimmerPlaceHolder className="w-16 h-6 rounded" />
                        ) : (
                            <Text className="text-slate-900 text-xl font-black italic">₹{velocity}</Text>
                        )}
                        <Text className="text-slate-400 text-[8px] font-black uppercase mt-1 tracking-widest">₹/per Hour</Text>
                    </View>
                    <View className="flex-1 bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm items-center">
                        <View className="w-10 h-10 bg-blue-50 rounded-full items-center justify-center mb-3">
                            <Ionicons name="rocket" size={18} color="#3B82F6" />
                        </View>
                        {loading ? (
                            <ShimmerPlaceHolder className="w-16 h-6 rounded" />
                        ) : (
                            <Text className="text-slate-900 text-xl font-black italic">₹{roi}</Text>
                        )}
                        <Text className="text-slate-400 text-[8px] font-black uppercase mt-1 tracking-widest">Avg ROI/Trip</Text>
                    </View>
                </View>

                {/* Stats Summary - Replacing Visual Trends */}
                <View className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm mb-8">
                    <View className="flex-row justify-between items-center mb-6">
                        <Text className="text-slate-900 font-black text-[10px] uppercase tracking-widest">Period Summary</Text>
                        <View className="flex-row items-center border border-slate-100 px-2 py-1 rounded-full">
                            <Ionicons name="calendar" size={10} color="#94A3B8" />
                            <Text className="text-slate-400 text-[8px] font-bold uppercase ml-1">{selectedPeriod}</Text>
                        </View>
                    </View>

                    <View className="flex-row justify-between items-center py-4 border-b border-slate-50">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-slate-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="car" size={14} color="#64748B" />
                            </View>
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Total Trips</Text>
                        </View>
                        {loading ? (
                            <ShimmerPlaceHolder className="w-12 h-6 rounded" />
                        ) : (
                            <Text className="text-slate-900 font-black italic text-xl">{earnings?.totalTrips || 0}</Text>
                        )}
                    </View>

                    <View className="flex-row justify-between items-center py-4 border-b border-slate-50">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-slate-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="time" size={14} color="#64748B" />
                            </View>
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Online Hours</Text>
                        </View>
                        {loading ? (
                            <ShimmerPlaceHolder className="w-12 h-6 rounded" />
                        ) : (
                            <Text className="text-slate-900 font-black italic text-xl">{earnings?.onlineHours || 0}h</Text>
                        )}
                    </View>

                    <View className="flex-row justify-between items-center py-4">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-amber-50 rounded-full items-center justify-center mr-3">
                                <Ionicons name="star" size={14} color="#F59E0B" />
                            </View>
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Avg Rating</Text>
                        </View>
                        {loading ? (
                            <ShimmerPlaceHolder className="w-12 h-6 rounded" />
                        ) : (
                            <Text className="text-slate-900 font-black italic text-xl">4.98</Text>
                        )}
                    </View>
                </View>

                {/* Decorative Premium Footer */}
                <View className="mt-4 mb-4 items-center">
                    <View className="w-10 h-1 bg-slate-200 rounded-full mb-4 opacity-50" />
                    <Text className="text-slate-300 text-[9px] font-black uppercase tracking-[5px]">Hello-11 Premium</Text>
                </View>
            </ScrollView>
        </View>
    );
}
