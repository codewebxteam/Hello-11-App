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
    useWindowDimensions,
 Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { driverAPI } from '../utils/api';
import { getEarningsData, setEarningsData } from '../utils/storage';
import Header from '../components/Header';

// Calendar Config
LocaleConfig.locales['en'] = {
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
};
LocaleConfig.defaultLocale = 'en';


const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

// Shimmer Component
const ShimmerPlaceHolder = ({ className }: { className?: string }) => {
    const { width } = useWindowDimensions();
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
    }, [shimmerAnim]);

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
    const insets = useSafeAreaInsets();
    const [earnings, setEarnings] = React.useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [loading, setLoading] = React.useState(true);
    const [, setRefreshing] = React.useState(false);

    // Calendar & Range State
    const [showCalendar, setShowCalendar] = React.useState(false);
    const [range, setRange] = React.useState<{ start: string | null; end: string | null }>({ start: null, end: null });
    const [dailyStats, setDailyStats] = React.useState<any>({});

    const loadData = async (period = 'week', isInitial = false, customStart?: string, customEnd?: string) => {
        try {
            setSelectedPeriod(period);
            setLoading(true);
            
            if (isInitial && !customStart) {
                const cached = await getEarningsData();
                if (cached) setEarnings(cached);
            }

            const response = await driverAPI.getEarnings(period, customStart, customEnd);
            const data = response.data?.earnings || response.data;
            
            if (data) {
                setEarnings(data);
                if (data.dailyStats) setDailyStats(data.dailyStats);
                if (period === 'week' && !customStart) await setEarningsData(data);
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
            <Header 
                title="Financial Center" 
                rightIcon="refresh"
                onRightPress={() => loadData(selectedPeriod, false, range.start || undefined, range.end || undefined)}
            />

            <ScrollView 
                className="flex-1" 
                showsVerticalScrollIndicator={false} 
                contentContainerStyle={{ padding: 24, paddingBottom: Math.max(40, insets.bottom + 20) }}
            >
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
                                <View className="flex-row justify-between items-start mb-2">
                                    <View>
                                        <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Net Earnings</Text>
                                        <Text className="text-white text-5xl font-black italic tracking-tighter">
                                            ₹{earnings?.totalEarnings || 0}
                                        </Text>
                                    </View>
                                    <View className="bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
                                        <Text className="text-amber-400 text-[8px] font-black uppercase">Premium Account</Text>
                                    </View>
                                </View>

                                <View className="flex-row items-center mb-6">
                                    <View className="w-1.5 h-1.5 rounded-full bg-blue-400 mr-2" />
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                        {earnings?.onlineHours || "0.0"}h Online Today
                                    </Text>
                                </View>

                                <View className="flex-row items-center justify-between pt-6 border-t border-white/5">
                                    <View>
                                        <Text className="text-slate-400 text-[8px] font-black uppercase mb-1">Today&apos;s Earnings</Text>
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

                {/* Wallet Shortcut Card */}
                <TouchableOpacity
                    onPress={() => router.push("/wallet")}
                    activeOpacity={0.8}
                    className="bg-white p-5 rounded-[28px] border border-slate-100 shadow-sm flex-row items-center justify-between mb-8"
                >
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-yellow-400/10 rounded-2xl items-center justify-center mr-4">
                            <MaterialCommunityIcons name="wallet-outline" size={24} color="#EAB308" />
                        </View>
                        <View>
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">My Driver Wallet</Text>
                            <Text className="text-slate-900 font-black text-base italic">₹{earnings?.pendingCommission?.toFixed(2) || "0.00"} <Text className="text-slate-400 text-[10px] font-bold not-italic">PENDING</Text></Text>
                        </View>
                    </View>
                    <View className="bg-slate-50 p-2 rounded-xl">
                        <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
                    </View>
                </TouchableOpacity>

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
                    <TouchableOpacity
                        onPress={() => {
                            setShowCalendar(true);
                            loadData('month', false); // Fetch month data to show dots on calendar
                        }}
                        style={{ backgroundColor: selectedPeriod === 'custom' ? '#0F172A' : 'transparent' }}
                        className="flex-1 py-3 rounded-full items-center"
                    >
                        <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={10} color={selectedPeriod === 'custom' ? '#FFD700' : '#94A3B8'} className="mr-1" />
                            <Text style={{ color: selectedPeriod === 'custom' ? '#FFD700' : '#94A3B8' }} className="text-[9px] font-black uppercase tracking-widest">Range</Text>
                        </View>
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

            {/* Calendar Range Selection Modal */}
            <Modal
                visible={showCalendar}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setShowCalendar(false)}
            >
                <View className="flex-1 bg-black/60 justify-center px-6">
                    <View className="bg-[#F8FAFC] rounded-[32px] p-5 pb-6 shadow-2xl relative">
                        <View className="items-center mb-4">
                            <View className="w-10 h-1 bg-slate-200 rounded-full mb-4" />
                            <Text className="text-slate-900 font-black tracking-widest uppercase text-[11px]">Select Earning Period</Text>
                            {range.start && (
                                <Text className="text-slate-400 font-bold text-[9px] mt-1 italic">
                                    {range.start} {range.end ? ` to ${range.end}` : '(Selecting End Date)'}
                                </Text>
                            )}
                        </View>

                        <Calendar
                            onDayPress={(day) => {
                                if (!range.start || (range.start && range.end)) {
                                    setRange({ start: day.dateString, end: null });
                                } else {
                                    const start = new Date(range.start);
                                    const end = new Date(day.dateString);
                                    if (end < start) {
                                        setRange({ start: day.dateString, end: null });
                                    } else {
                                        setRange({ ...range, end: day.dateString });
                                    }
                                }
                            }}
                            markedDates={{
                                // First, add dots for all days with earnings
                                ...Object.keys(dailyStats).reduce((acc: any, date) => {
                                    acc[date] = { 
                                        marked: true, 
                                        dotColor: '#2563EB',
                                        customStyles: {
                                            container: { 
                                                borderWidth: 1,
                                                borderColor: '#E2E8F0',
                                            },
                                            text: { fontWeight: 'bold' }
                                        }
                                    };
                                    return acc;
                                }, {}),
                                // Then overlay the selection range
                                ...(range.start ? { 
                                    [range.start]: { 
                                        customStyles: {
                                            container: { backgroundColor: '#0F172A', borderRadius: 20 },
                                            text: { color: '#FFD700', fontWeight: '900' }
                                        }
                                    } 
                                } : {}),
                                ...(range.end ? { 
                                    [range.end]: { 
                                        customStyles: {
                                            container: { backgroundColor: '#0F172A', borderRadius: 20 },
                                            text: { color: '#FFD700', fontWeight: '900' }
                                        }
                                    } 
                                } : {}),
                            }}
                            markingType={'custom'}
                            theme={{
                                calendarBackground: '#F8FAFC',
                                textSectionTitleColor: '#b6c1cd',
                                selectedDayBackgroundColor: '#0F172A',
                                selectedDayTextColor: '#FFD700',
                                todayTextColor: '#2563EB',
                                dayTextColor: '#2d4150',
                                textDisabledColor: '#d9e1e8',
                                dotColor: '#2563EB',
                                monthTextColor: '#0F172A',
                                textDayFontWeight: '800',
                                textMonthFontWeight: '900',
                                textDayHeaderFontWeight: '900',
                                textDayFontSize: 13,
                                textMonthFontSize: 15,
                                textDayHeaderFontSize: 11
                            }}
                        />

                        <View className="flex-row gap-4 mt-4">
                            <TouchableOpacity 
                                onPress={() => {
                                    setRange({ start: null, end: null });
                                    setShowCalendar(false);
                                }}
                                className="flex-1 py-3.5 bg-white rounded-2xl items-center border border-slate-100"
                            >
                                <Text className="text-slate-400 font-black uppercase tracking-widest text-[9px]">Close</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                disabled={!range.start || !range.end}
                                onPress={() => {
                                    if (range.start && range.end) {
                                        loadData('custom', false, range.start, range.end);
                                        setShowCalendar(false);
                                    }
                                }}
                                style={{ opacity: (!range.start || !range.end) ? 0.5 : 1 }}
                                className="flex-[2] py-4 bg-slate-900 rounded-2xl items-center shadow-lg shadow-slate-900/10"
                            >
                                <Text className="text-amber-400 font-black uppercase tracking-widest text-[10px]">Filter Earnings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
