import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    Platform,
    StatusBar as RNStatusBar,
    ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { driverAPI } from '../utils/api';
import { getEarningsData, setEarningsData } from '../utils/storage';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

export default function EarningsScreen() {
    const router = useRouter();
    const [earnings, setEarnings] = React.useState<any>(null);
    const [selectedPeriod, setSelectedPeriod] = React.useState('week');
    const [periodData, setPeriodData] = React.useState<Record<string, any>>({});
    const [loading, setLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);

    const loadData = async (period = 'week', isInitial = false) => {
        try {
            setSelectedPeriod(period);
            
            // Show cached data immediately if available
            if (periodData[period]) {
                setEarnings(periodData[period]);
                setRefreshing(true); // Still fetch update in background
            } else if (isInitial) {
                const cached = await getEarningsData();
                if (cached) {
                    setEarnings(cached);
                    setPeriodData(prev => ({ ...prev, week: cached }));
                    setLoading(false);
                }
            } else {
                setRefreshing(true);
            }

            const response = await driverAPI.getEarnings(period);
            if (response.data && response.data.earnings) {
                const newData = response.data.earnings;
                setEarnings(newData);
                setPeriodData(prev => ({ ...prev, [period]: newData }));
                
                if (period === 'week') { // Cache the default/weekly view to storage
                    await setEarningsData(newData);
                }
            }
        } catch (error) {
            console.error("Error fetching earnings:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        React.useCallback(() => {
            loadData('week', true);
        }, [])
    );

    const StatCard = ({ title, value, icon, color, subtitle, isCurrency }: any) => (
        <View style={{ flex: 1, backgroundColor: 'white', padding: 20, borderRadius: 28, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 16, marginHorizontal: 4 }}>
            <View style={{ width: 40, height: 40, backgroundColor: color, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Ionicons name={icon} size={20} color="white" />
            </View>
            <Text style={{ color: '#0F172A', fontSize: 20, fontWeight: '900' }}>{isCurrency ? '₹' : ''}{value}</Text>
            <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: '700', marginTop: 4, textTransform: 'uppercase' }}>{title}</Text>
            {subtitle && <Text style={{ color: '#CBD5E1', fontSize: 8, fontWeight: '700', marginTop: 2 }}>{subtitle}</Text>}
        </View>
    );

    if (loading && !earnings) {
        return (
            <View style={{ flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
            <StatusBar style="dark" />

            {/* Header */}
            <View style={{ paddingTop: STATUSBAR_HEIGHT, backgroundColor: 'white' }}>
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity 
                        onPress={() => router.back()} 
                        style={{ width: 40, height: 40, backgroundColor: '#F8FAFC', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' }}
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text style={{ color: '#0F172A', fontWeight: '900', fontSize: 18, textTransform: 'uppercase' }}>Analytics</Text>
                    <TouchableOpacity 
                        onPress={() => loadData(earnings?.period || 'week')}
                        style={{ width: 40, height: 40, backgroundColor: '#F8FAFC', borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' }}
                    >
                        <Ionicons name="refresh" size={20} color="#1E293B" />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView 
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: 20 }}
                showsVerticalScrollIndicator={false}
            >
                {/* Main Hero Card */}
                <View
                    style={{ 
                        borderRadius: 32, 
                        padding: 32, 
                        marginBottom: 24, 
                        backgroundColor: '#0F172A',
                    }}
                >
                    <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, backgroundColor: '#FFD700', borderRadius: 80, opacity: 0.1 }} />
                    
                    <Text style={{ color: '#94A3B8', fontWeight: '700', textTransform: 'uppercase', fontSize: 10, marginBottom: 4 }}>Total Balance</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                        <Text style={{ color: 'white', fontSize: 40, fontWeight: '900' }}>₹{earnings?.totalEarnings || 0}</Text>
                        <Text style={{ color: '#FFD700', marginLeft: 12, fontWeight: '700', marginBottom: 4, textTransform: 'uppercase', fontSize: 12 }}>Overall: ₹{earnings?.lifetimeBalance || 0}</Text>
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 32, paddingTop: 24, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)' }}>
                        <View>
                            <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Today's Gain</Text>
                            <Text style={{ color: 'white', fontSize: 24, fontWeight: '900' }}>₹{earnings?.todayEarnings || 0}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ color: '#94A3B8', fontSize: 9, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 }}>Efficiency</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="trending-up" size={14} color="#22C55E" style={{ marginRight: 4 }} />
                                <Text style={{ color: '#22C55E', fontSize: 24, fontWeight: '900' }}>94%</Text>
                            </View>
                        </View>
                    </View>
                </View>

                <View style={{ backgroundColor: 'white', padding: 6, borderRadius: 40, borderWidth: 1, borderColor: '#F1F5F9', flexDirection: 'row', marginBottom: 32 }}>
                    {['day', 'week', 'month'].map((p) => (
                        <TouchableOpacity
                            key={p}
                            onPress={() => loadData(p)}
                            style={{ 
                                flex: 1, 
                                paddingVertical: 12, 
                                borderRadius: 30, 
                                alignItems: 'center',
                                backgroundColor: selectedPeriod === p ? '#0F172A' : 'transparent'
                            }}
                        >
                            <Text style={{ 
                                fontSize: 10, 
                                fontWeight: '900', 
                                textTransform: 'uppercase',
                                color: selectedPeriod === p ? '#FFD700' : '#94A3B8'
                            }}>
                                {p === 'day' ? 'Today' : p === 'week' ? 'Weekly' : 'Monthly'}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Grid Layout Stats */}
                <View style={{ flexDirection: 'row' }}>
                    <StatCard 
                        title="Avg / Trip" 
                        value={earnings?.averageFare || 0} 
                        icon="cash" 
                        color="#10B981" 
                        isCurrency={true}
                    />
                    <StatCard 
                        title="Total Trips" 
                        value={earnings?.totalTrips || 0} 
                        icon="car" 
                        color="#3B82F6" 
                        isCurrency={false}
                    />
                </View>

                <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <StatCard 
                        title="Online Time" 
                        value={earnings?.onlineHours || '0.0'} 
                        icon="time" 
                        color="#F59E0B" 
                        isCurrency={false}
                    />
                    <StatCard 
                        title="Rating" 
                        value="4.9" 
                        icon="star" 
                        color="#A855F7" 
                        isCurrency={false}
                    />
                </View>


                {/* Decorative Footer */}
                <View className="mt-10 mb-8 items-center">
                    <View className="w-12 h-1 bg-slate-200 rounded-full mb-4 opacity-50" />
                    <Text className="text-slate-300 text-[10px] font-black uppercase tracking-[4px]">Hello-11 Premium Analytics</Text>
                </View>
            </ScrollView>
        </View>
    );
}
