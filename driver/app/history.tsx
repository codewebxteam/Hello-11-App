import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    TextInput,
    ScrollView,
    Animated,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { driverAPI } from '../utils/api';

import Header from '../components/Header';

interface RideItem {
    id: string;
    createdAt: string;
    date: string;
    amount: string;
    totalFare: number;
    fare: number;
    tollFee: number;
    penaltyApplied: number;
    returnTripFare: number;
    hasReturnTrip: boolean;
    pickup: string;
    drop: string;
    status: 'Completed' | 'Cancelled' | 'Other';
    rating: number;
    feedback: string;
    distance: number;
    user: any;
    rawStatus: string;
    rideType: string;
    bookingType: string;
    paymentStatus: string;
    paymentMethod: string;
    isNightFare: boolean;
    nightFareApplied: boolean;
    nightFareAmount: number;
    scheduledDate?: string | null;
}



const statusTabs = [
    { label: 'All', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
];

const rideTypeTabs = [
    { label: 'All Rides', value: 'all' },
    { label: 'Outstation', value: 'outstation' },
    { label: 'Normal', value: 'normal' },
];

const bookingTypeTabs = [
    { label: 'All Bookings', value: 'all' },
    { label: 'Ride Now', value: 'now' },
    { label: 'Scheduled', value: 'schedule' },
];

const scheduleViewTabs = [
    { label: 'Upcoming', value: 'upcoming' },
    { label: 'History', value: 'history' },
];

export default function RideHistoryScreen() {
    const { width } = useWindowDimensions();
    const compact = width < 380;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const hasLoadedOnceRef = React.useRef(false);

    const [history, setHistory] = React.useState<RideItem[]>([]);
    const [initialLoading, setInitialLoading] = React.useState(true);
    const [refreshing, setRefreshing] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);

    const [page, setPage] = React.useState(1);
    const [totalPages, setTotalPages] = React.useState(1);

    const [statusFilter, setStatusFilter] = React.useState('all');
    const [rideTypeFilter, setRideTypeFilter] = React.useState('all');
    const [bookingTypeFilter, setBookingTypeFilter] = React.useState('all');
    const [scheduleViewFilter, setScheduleViewFilter] = React.useState('upcoming');

    const [search, setSearch] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');
    const shimmer = React.useRef(new Animated.Value(0.35)).current;


    React.useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(shimmer, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(shimmer, {
                    toValue: 0.35,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [shimmer]);

    React.useEffect(() => {
        const timer = setTimeout(() => {
            setSearchQuery(search.trim());
        }, 350);

        return () => clearTimeout(timer);
    }, [search]);

    const mapBookingToRide = React.useCallback((item: any): RideItem => {
        const status = item.status === 'completed' ? 'Completed' : item.status === 'cancelled' ? 'Cancelled' : 'Other';
        return {
            id: item.id || item._id,
            createdAt: item.createdAt,
            date: new Date(item.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
            amount: `Rs ${item.totalFare || item.fare || 0}`,
            totalFare: Number(item.totalFare || item.fare || 0),
            fare: Number(item.fare || 0),
            tollFee: Number(item.tollFee || 0),
            penaltyApplied: Number(item.penaltyApplied || 0),
            returnTripFare: Number(item.returnTripFare || 0),
            hasReturnTrip: !!item.hasReturnTrip,
            pickup: item.pickupLocation,
            drop: item.dropLocation,
            status,
            rating: item.rating || 0,
            feedback: item.feedback || "",
            distance: item.distance || 0,
            user: item.user,
            rawStatus: item.status,
            rideType: item.rideType || 'normal',
            bookingType: item.bookingType || 'now',
            paymentStatus: item.paymentStatus || 'pending',
            paymentMethod: item.paymentMethod || 'cash',
            isNightFare: !!item.isNightFare || (item.nightSurcharge && Number(item.nightSurcharge) > 0),
            nightFareApplied: !!item.nightFareApplied || (item.nightSurcharge && Number(item.nightSurcharge) > 0),
            nightFareAmount: Number(item.nightSurcharge || item.nightFareAmount || 0),
            scheduledDate: item.scheduledDate || null
        };
    }, []);

    const fetchHistory = React.useCallback(async (
        nextPage: number = 1,
        append = false,
        mode: 'initial' | 'refresh' | 'silent' = 'silent'
    ) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else if (mode === 'initial') {
                setInitialLoading(true);
            } else if (mode === 'refresh') {
                setRefreshing(true);
            }

            const response = await driverAPI.getBookingsHistory({
                page: nextPage,
                limit: 10,
                status: statusFilter,
                rideType: rideTypeFilter,
                bookingType: bookingTypeFilter,
                search: searchQuery || undefined,
            });

            const rawBookings = (response.data?.bookings || []).map(mapBookingToRide);
            const bookings = rawBookings.filter((item: RideItem) => {
                const now = Date.now();
                const isScheduled = item.bookingType === 'schedule';
                const scheduledAt = item.scheduledDate ? new Date(item.scheduledDate).getTime() : 0;
                const isUpcomingScheduled =
                    isScheduled &&
                    !!item.scheduledDate &&
                    scheduledAt >= now &&
                    !['completed', 'cancelled'].includes(item.rawStatus);

                const matchesStatus = statusFilter === 'all' || item.rawStatus === statusFilter;
                const matchesRideType =
                    rideTypeFilter === 'all' ||
                    (rideTypeFilter === 'outstation' ? item.rideType === 'outstation' : item.rideType !== 'outstation');
                const matchesBookingType =
                    bookingTypeFilter === 'all' ||
                    (bookingTypeFilter === 'now' && item.bookingType !== 'schedule') ||
                    (bookingTypeFilter === 'schedule' && item.bookingType === 'schedule');
                const matchesScheduleView =
                    bookingTypeFilter !== 'schedule' ||
                    (scheduleViewFilter === 'upcoming' ? isUpcomingScheduled : !isUpcomingScheduled);
                const q = searchQuery.toLowerCase();
                const matchesSearch = !q || item.pickup.toLowerCase().includes(q) || item.drop.toLowerCase().includes(q);
                return matchesStatus && matchesRideType && matchesBookingType && matchesScheduleView && matchesSearch;
            });
            const pages = Number(response.data?.pagination?.pages || 1);

            setTotalPages(pages);
            setPage(nextPage);
            setHistory((prev) => append ? [...prev, ...bookings] : bookings);
        } catch (error) {
            console.error("Error fetching history:", error);
            if (!append && mode === 'initial') setHistory([]);
        } finally {
            setInitialLoading(false);
            setRefreshing(false);
            setLoadingMore(false);
        }
    }, [statusFilter, rideTypeFilter, bookingTypeFilter, scheduleViewFilter, searchQuery, mapBookingToRide]);

    React.useEffect(() => {
        fetchHistory(1, false, hasLoadedOnceRef.current ? 'silent' : 'initial');
        hasLoadedOnceRef.current = true;
    }, [fetchHistory]);

    const loadMore = () => {
        if (!loadingMore && page < totalPages) {
            fetchHistory(page + 1, true);
        }
    };

    const renderFilterRow = (
        title: string,
        tabs: { label: string; value: string }[],
        selected: string,
        onSelect: (value: string) => void
    ) => (
        <View className="mb-3">
            <Text className="text-slate-400 font-black uppercase tracking-wider mb-2" style={{ fontSize: compact ? 9 : 10 }}>{title}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tabs.map((tab) => (
                    <TouchableOpacity
                        key={`${title}-${tab.value}`}
                        onPress={() => onSelect(tab.value)}
                        className={`mr-2 rounded-full border ${selected === tab.value ? 'bg-slate-900 border-slate-900' : 'bg-white border-slate-200'}`}
                        style={{ paddingHorizontal: compact ? 12 : 16, paddingVertical: compact ? 7 : 8 }}
                    >
                        <Text className={`font-black uppercase ${selected === tab.value ? 'text-[#FFD700]' : 'text-slate-500'}`} style={{ fontSize: compact ? 9 : 10 }}>{tab.label}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );

    const renderRideItem = ({ item }: { item: RideItem }) => (
        <View className="bg-white rounded-[26px] p-5 mb-4 shadow-sm border border-slate-100">
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{item.date}</Text>
                    <View className={`self-start px-2 py-1 rounded-md ${item.status === 'Completed' ? 'bg-green-50' : item.status === 'Cancelled' ? 'bg-red-50' : 'bg-slate-50'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${item.status === 'Completed' ? 'text-green-600' : item.status === 'Cancelled' ? 'text-red-500' : 'text-slate-500'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                <View />
            </View>

            <View className="pl-1 relative mb-4">
                <View className="absolute left-[6px] top-3 bottom-3 w-[2px] bg-slate-100" />

                <View className="flex-row items-center mb-3">
                    <View className="w-3 h-3 rounded-full bg-slate-200 border-2 border-white z-10" />
                    <Text className="text-slate-600 font-bold ml-3 text-sm flex-1" numberOfLines={2}>{item.pickup}</Text>
                </View>

                <View className="flex-row items-center">
                    <View className="w-3 h-3 rounded-sm bg-slate-900 border-2 border-white z-10" />
                    <Text className="text-slate-900 font-bold ml-3 text-sm flex-1" numberOfLines={2}>{item.drop}</Text>
                </View>
            </View>

            {item.tollFee > 0 && (
                <View className="flex-row justify-between items-center mb-3 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                    <Text className="text-amber-700 text-xs font-black uppercase tracking-wider">Toll Charges</Text>
                    <Text className="text-amber-700 text-sm font-black">+Rs {item.tollFee}</Text>
                </View>
            )}

            <View className="flex-row justify-between items-center pt-4 border-t border-slate-50">
                {item.status === 'Completed' ? (
                    <View className="flex-row items-center bg-[#FFFBEB] px-2 py-1 rounded-full border border-[#FEF3C7]">
                        <Ionicons name="star" size={10} color="#F59E0B" />
                        <Text className="text-[#B45309] text-xs font-bold ml-1">
                            {item.rating > 0 ? `${item.rating}.0 Rating` : "Unrated"}
                        </Text>
                    </View>
                ) : (
                    <View />
                )}

                <TouchableOpacity
                    onPress={() => router.push({
                        pathname: "/ride-details",
                        params: {
                            bookingId: item.id,
                            prefill: JSON.stringify({
                                id: item.id,
                                status: item.rawStatus,
                                fare: item.fare,
                                totalFare: item.totalFare,
                                tollFee: item.tollFee,
                                penaltyApplied: item.penaltyApplied,
                                returnTripFare: item.returnTripFare,
                                hasReturnTrip: item.hasReturnTrip,
                                pickupLocation: item.pickup,
                                dropLocation: item.drop,
                                distance: item.distance,
                                rideType: item.rideType,
                                bookingType: item.bookingType,
                                paymentStatus: item.paymentStatus,
                                paymentMethod: item.paymentMethod,
                                rating: item.rating,
                                feedback: item.feedback,
                                createdAt: item.createdAt,
                                isNightFare: item.isNightFare,
                                nightFareApplied: item.nightFareApplied,
                                nightFareAmount: item.nightFareAmount,
                                scheduledDate: item.scheduledDate
                            })
                        }
                    })}
                    className="flex-row items-center"
                >
                    <Text className="text-slate-400 text-xs font-bold mr-1">View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderShimmerCard = (key: string) => (
        <Animated.View
            key={key}
            style={{ opacity: shimmer }}
            className="bg-white rounded-[26px] p-5 mb-4 border border-slate-100"
        >
            <View className="flex-row justify-between items-start mb-4">
                <View className="flex-1">
                    <View className="h-3 w-28 bg-slate-200 rounded mb-2" />
                    <View className="h-5 w-20 bg-slate-200 rounded" />
                </View>
                <View className="h-4 w-16" />
            </View>

            <View className="mb-4">
                <View className="h-3 w-full bg-slate-200 rounded mb-2" />
                <View className="h-3 w-[85%] bg-slate-200 rounded mb-4" />
                <View className="h-3 w-full bg-slate-200 rounded mb-2" />
                <View className="h-3 w-[78%] bg-slate-200 rounded" />
            </View>

            <View className="pt-4 border-t border-slate-100 flex-row justify-between items-center">
                <View className="h-5 w-24 bg-slate-200 rounded-full" />
                <View className="h-4 w-20 bg-slate-200 rounded" />
            </View>
        </Animated.View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            <Header title="Ride History" />

            <FlatList
                data={history}
                renderItem={renderRideItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: compact ? 12 : 24, paddingTop: compact ? 14 : 24, paddingBottom: Math.max(100, insets.bottom + 40) }}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={() => fetchHistory(1, false, 'refresh')}
                ListHeaderComponent={
                    <View className="mb-4">
                        <View className="bg-white rounded-2xl border border-slate-100 px-4 py-3 mb-4">
                            <View className="flex-row items-center">
                                <Ionicons name="search" size={16} color="#94A3B8" />
                                <TextInput
                                    value={search}
                                    onChangeText={setSearch}
                                    placeholder="Search pickup or drop"
                                    placeholderTextColor="#94A3B8"
                                    className="flex-1 ml-2 text-slate-800 font-semibold"
                                />
                                {search.length > 0 ? (
                                    <TouchableOpacity onPress={() => setSearch('')}>
                                        <Ionicons name="close-circle" size={16} color="#94A3B8" />
                                    </TouchableOpacity>
                                ) : null}
                            </View>
                        </View>

                        

                        {renderFilterRow('Ride Status', statusTabs, statusFilter, setStatusFilter)}
                        {renderFilterRow('Ride Type', rideTypeTabs, rideTypeFilter, setRideTypeFilter)}
                        {renderFilterRow('Booking Type', bookingTypeTabs, bookingTypeFilter, setBookingTypeFilter)}
                        {bookingTypeFilter === 'schedule' && renderFilterRow('Scheduled', scheduleViewTabs, scheduleViewFilter, setScheduleViewFilter)}
                    </View>
                }
                ListEmptyComponent={
                    initialLoading ? (
                        <View className="py-2">
                            {renderShimmerCard('shimmer-1')}
                            {renderShimmerCard('shimmer-2')}
                            {renderShimmerCard('shimmer-3')}
                        </View>
                    ) : (
                        <View className="bg-white rounded-[24px] p-8 border border-slate-100 items-center justify-center">
                            <Ionicons name="receipt-outline" size={32} color="#CBD5E1" />
                            <Text className="text-slate-400 font-bold mt-2">No rides found for selected filters</Text>
                        </View>
                    )
                }
                ListFooterComponent={
                    page < totalPages ? (
                        <TouchableOpacity
                            onPress={loadMore}
                            disabled={loadingMore}
                            className={`py-4 rounded-2xl items-center mt-2 ${loadingMore ? 'bg-slate-300' : 'bg-slate-900'}`}
                        >
                            <Text className={`font-black uppercase tracking-wider text-xs ${loadingMore ? 'text-slate-700' : 'text-[#FFD700]'}`}>
                                {loadingMore ? 'Loading...' : 'Load More'}
                            </Text>
                        </TouchableOpacity>
                    ) : history.length > 0 ? (
                        <Text className="text-slate-400 text-center font-bold mt-2">End of history</Text>
                    ) : null
                }
            />
        </View>
    );
}
