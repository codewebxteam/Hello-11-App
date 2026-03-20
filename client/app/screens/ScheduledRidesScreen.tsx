import React, { useEffect, useState, useCallback } from 'react';
import {
    View, Text, TouchableOpacity, FlatList,
    Alert, RefreshControl, Animated, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { bookingAPI } from '../../utils/api';

type Tab = 'upcoming' | 'history';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
    pending: { label: 'Searching Driver', color: '#f59e0b', bg: '#fef3c7' },
    accepted: { label: 'Driver Accepted', color: '#3b82f6', bg: '#dbeafe' },
    started: { label: 'Ride Started', color: '#8b5cf6', bg: '#ede9fe' },
    completed: { label: 'Completed', color: '#22c55e', bg: '#dcfce7' },
    cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
    scheduled: { label: 'Upcoming', color: '#0ea5e9', bg: '#e0f2fe' },
};

const formatDate = (d: string) =>
    new Date(d).toLocaleString('en-IN', {
        weekday: 'short', day: '2-digit', month: 'short',
        hour: '2-digit', minute: '2-digit', hour12: true,
    });

const getCountdown = (d: string) => {
    const diff = new Date(d).getTime() - Date.now();
    if (diff <= 0) return 'Due now';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h >= 24) { const days = Math.floor(h / 24); return `in ${days}d`; }
    return h > 0 ? `in ${h}h ${m}m` : `in ${m}m`;
};

// ─── Ride Card ────────────────────────────────────────────────────────────────
const RideCard = ({
    item, isUpcoming, onCancel, onViewDetails
}: { item: any; isUpcoming: boolean; onCancel: (id: string) => void; onViewDetails: (item: any) => void }) => {
    const id = item._id || item.id;
    const st = STATUS_CONFIG[item.status] || { label: item.status, color: '#64748b', bg: '#f1f5f9' };
    const countdown = isUpcoming ? getCountdown(item.scheduledDate) : null;
    const isDueSoon = isUpcoming && (new Date(item.scheduledDate).getTime() - Date.now() < 3600000);

    return (
        <View style={{ backgroundColor: '#fff', marginBottom: 16, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' }}>
            {/* Status row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <View style={{ backgroundColor: '#f3e8ff', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ color: '#7c3aed', fontSize: 9, fontWeight: '900' }}>🛣️ OUTSTATION</Text>
                    </View>
                    <View style={{ backgroundColor: st.bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                        <Text style={{ color: st.color, fontSize: 9, fontWeight: '900' }}>{st.label.toUpperCase()}</Text>
                    </View>
                    {countdown && (
                        <View style={{ backgroundColor: isDueSoon ? '#ffedd5' : '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
                            <Text style={{ color: isDueSoon ? '#ea580c' : '#64748b', fontSize: 9, fontWeight: '900' }}>{countdown.toUpperCase()}</Text>
                        </View>
                    )}
                </View>
                {isUpcoming && (
                    <TouchableOpacity onPress={() => onCancel(id)}>
                        <Ionicons name="close-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                )}
            </View>

            {/* Date */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fffbeb', padding: 10, borderRadius: 12, marginBottom: 14 }}>
                <Ionicons name="calendar" size={15} color="#b45309" />
                <Text style={{ color: '#92400e', fontWeight: '900', marginLeft: 8, fontSize: 13 }}>{formatDate(item.scheduledDate)}</Text>
            </View>

            {/* Route */}
            <View style={{ marginBottom: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Pickup</Text>
                        <Text style={{ color: '#1e293b', fontSize: 12, fontWeight: '700' }} numberOfLines={2}>{item.pickupLocation}</Text>
                    </View>
                </View>
                <View style={{ width: 1, height: 10, backgroundColor: '#e2e8f0', marginLeft: 11 }} />
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                        <Ionicons name="location" size={12} color="#ef4444" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Drop</Text>
                        <Text style={{ color: '#1e293b', fontSize: 12, fontWeight: '700' }} numberOfLines={2}>{item.dropLocation}</Text>
                    </View>
                </View>
            </View>

            {/* Fare + Distance */}
            <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, gap: 20, alignItems: 'center' }}>
                <View>
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Distance</Text>
                    <Text style={{ color: '#1e293b', fontWeight: '900', fontSize: 14 }}>{item.distance?.toFixed(1) || '--'} km</Text>
                </View>
                <View>
                    <Text style={{ color: '#94a3b8', fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>Fare</Text>
                    <Text style={{ color: '#1e293b', fontWeight: '900', fontSize: 14 }}>₹{item.fare || '--'}</Text>
                </View>
            </View>

            <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity onPress={() => onViewDetails(item)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '800', marginRight: 4 }}>View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const ScheduledRidesScreen = () => {
    const router = useRouter();
    const [tab, setTab] = useState<Tab>('upcoming');
    const [upcoming, setUpcoming] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const shimmer = React.useRef(new Animated.Value(0.35)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, { toValue: 1, duration: 700, useNativeDriver: true }),
                Animated.timing(shimmer, { toValue: 0.35, duration: 700, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmer]);

    const fetchAll = useCallback(async () => {
        try {
            const [upRes, histRes] = await Promise.all([
                bookingAPI.getScheduledBookings(),
                bookingAPI.getScheduledHistory(),
            ]);
            setUpcoming(upRes.data?.bookings || []);
            setHistory(histRes.data?.bookings || []);
        } catch (err: any) {
            console.error('[ScheduledRides] error:', err?.response?.data || err?.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { fetchAll(); }, [fetchAll]);

    const handleCancel = (bookingId: string) => {
        Alert.alert('Cancel Scheduled Ride', 'Are you sure?', [
            { text: 'No', style: 'cancel' },
            {
                text: 'Yes, Cancel', style: 'destructive',
                onPress: async () => {
                    try {
                        await bookingAPI.cancelBooking(bookingId);
                        setUpcoming(prev => prev.filter(b => (b._id || b.id) !== bookingId));
                        Alert.alert('Cancelled', 'Scheduled ride cancelled.');
                    } catch { Alert.alert('Error', 'Failed to cancel.'); }
                }
            }
        ]);
    };

    const currentData = tab === 'upcoming' ? upcoming : history;

    const openDetails = (item: any) => {
        const bookingId = item._id || item.id;
        if (!bookingId) return;
        router.push({
            pathname: "/screens/RideDetailsScreen",
            params: {
                bookingId: String(bookingId),
                prefill: JSON.stringify(item),
            }
        });
    };

    const renderShimmerCard = (key: string) => (
        <Animated.View
            key={key}
            style={{ opacity: shimmer, backgroundColor: '#fff', marginBottom: 16, borderRadius: 28, padding: 20, borderWidth: 1, borderColor: '#f1f5f9' }}
        >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
                <View>
                    <View style={{ height: 12, width: 140, backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 }} />
                    <View style={{ height: 18, width: 96, backgroundColor: '#e2e8f0', borderRadius: 8 }} />
                </View>
                <View style={{ height: 20, width: 20, backgroundColor: '#e2e8f0', borderRadius: 10 }} />
            </View>
            <View style={{ height: 42, borderRadius: 12, backgroundColor: '#e2e8f0', marginBottom: 14 }} />
            <View style={{ height: 10, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 }} />
            <View style={{ height: 10, width: '85%', backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 16 }} />
            <View style={{ height: 10, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 8 }} />
            <View style={{ height: 10, width: '78%', backgroundColor: '#e2e8f0', borderRadius: 8, marginBottom: 16 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ height: 14, width: 90, backgroundColor: '#e2e8f0', borderRadius: 8 }} />
                <View style={{ height: 14, width: 70, backgroundColor: '#e2e8f0', borderRadius: 8 }} />
            </View>
        </Animated.View>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar style="dark" />

            {/* Header */}
            <View style={{ backgroundColor: '#FFD700', paddingTop: 16, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 35, borderBottomRightRadius: 35, marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                    <TouchableOpacity onPress={() => router.back()} style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: 8, borderRadius: 12, marginRight: 14 }}>
                        <Ionicons name="arrow-back" size={22} color="black" />
                    </TouchableOpacity>
                    <View>
                        <Text style={{ color: '#000', fontWeight: '900', fontSize: 20 }}>Scheduled Rides</Text>
                        <Text style={{ color: 'rgba(0,0,0,0.5)', fontSize: 12, fontWeight: '700' }}>Upcoming & past outstation bookings</Text>
                    </View>
                </View>

                {/* Tabs */}
                <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: 16, padding: 4 }}>
                    {(['upcoming', 'history'] as Tab[]).map(t => (
                        <TouchableOpacity
                            key={t}
                            onPress={() => setTab(t)}
                            style={{
                                flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
                                backgroundColor: tab === t ? '#fff' : 'transparent'
                            }}
                        >
                            <Text style={{ fontSize: 11, fontWeight: '900', color: tab === t ? '#0f172a' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t === 'upcoming' ? `📅 Upcoming (${upcoming.length})` : `🕐 History (${history.length})`}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {loading ? (
                <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
                    {renderShimmerCard('shim-1')}
                    {renderShimmerCard('shim-2')}
                    {renderShimmerCard('shim-3')}
                </ScrollView>
            ) : (
                <FlatList
                    data={currentData}
                    keyExtractor={item => item._id || item.id}
                    renderItem={({ item }) => (
                        <RideCard item={item} isUpcoming={tab === 'upcoming'} onCancel={handleCancel} onViewDetails={openDetails} />
                    )}
                    contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 30 }}>
                            <Ionicons name={tab === 'upcoming' ? 'calendar-outline' : 'time-outline'} size={60} color="#CBD5E1" />
                            <Text style={{ color: '#475569', fontWeight: '900', fontSize: 20, marginTop: 16, textAlign: 'center' }}>
                                {tab === 'upcoming' ? 'No Upcoming Rides' : 'No Past Rides'}
                            </Text>
                            <Text style={{ color: '#94a3b8', fontSize: 13, fontWeight: '700', marginTop: 8, textAlign: 'center' }}>
                                {tab === 'upcoming'
                                    ? 'Schedule an outstation ride from the Outstation screen.'
                                    : 'Completed and cancelled scheduled rides will appear here.'}
                            </Text>
                            {tab === 'upcoming' && (
                                <TouchableOpacity
                                    onPress={() => router.push('/screens/OutstationBookingScreen')}
                                    style={{ backgroundColor: '#0f172a', marginTop: 24, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 20 }}
                                >
                                    <Text style={{ color: '#FFD700', fontWeight: '900', letterSpacing: 1 }}>+ SCHEDULE RIDE</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => { setRefreshing(true); fetchAll(); }}
                            tintColor="#FFD700"
                        />
                    }
                />
            )}
        </SafeAreaView>
    );
};

export default ScheduledRidesScreen;
