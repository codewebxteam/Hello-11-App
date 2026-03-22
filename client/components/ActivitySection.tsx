import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Dimensions, RefreshControl } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { userAPI } from '../utils/api';
import Shimmer from './Shimmer';
import { HistoryFilterBar } from './HistoryFilterBar';

const { width } = Dimensions.get('window');

interface ActivitySectionProps {
    onBookRide: () => void;
}

// ─── Sub-Components (Defined outside for stability) ──────────────────────────

// Responsive sizes based on screen width
const CARD_PADDING = width > 380 ? 20 : 16;
const ICON_SIZE = width > 380 ? 16 : 14;
const HEADER_TEXT_SIZE = width > 380 ? 12 : 10;

const RenderRideItem = ({ item, onRidePress }: { item: any; onRidePress: (item: any) => void }) => {
    const isActive = ['accepted', 'arrived', 'started'].includes(item.status);
    const px = CARD_PADDING;

    // Status configuration with better styling
    const getStatusConfig = (status: string) => {
        const statusMap: { [key: string]: { color: string; bg: string; icon: string; label: string } } = {
            'completed': { color: 'text-green-600', bg: 'bg-green-50', icon: 'checkmark-circle', label: '✓ Completed' },
            'cancelled': { color: 'text-red-600', bg: 'bg-red-50', icon: 'close-circle', label: '✕ Cancelled' },
            'accepted': { color: 'text-blue-600', bg: 'bg-blue-50', icon: 'checkmark', label: '⚡ Active' },
            'arrived': { color: 'text-blue-600', bg: 'bg-blue-50', icon: 'pin', label: '📍 Arrived' },
            'started': { color: 'text-blue-600', bg: 'bg-blue-50', icon: 'play-circle', label: '🚗 In Progress' },
            'scheduled': { color: 'text-sky-600', bg: 'bg-sky-50', icon: 'calendar', label: '🗓️ Scheduled' },
        };
        return statusMap[status] || { color: 'text-slate-600', bg: 'bg-slate-50', icon: 'help-circle', label: '• ' + status };
    };

    const statusConfig = getStatusConfig(item.status);

    return (
        <View className="bg-white mb-3 shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
            {/* Card Content with responsive padding */}
            <View style={{ padding: px }}>
                {/* Date & Status Header - Responsive */}
                <View className={`flex-row justify-between items-center mb-4 pb-3 border-b border-slate-50 ${width > 380 ? "gap-3" : "gap-2"}`}>
                    <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-lg flex-1">
                        <Ionicons name="calendar-outline" size={ICON_SIZE} color="#64748B" />
                        <Text
                            className="text-slate-600 font-bold ml-1.5 flex-1"
                            style={{ fontSize: HEADER_TEXT_SIZE }}
                            numberOfLines={1}
                        >
                            {new Date(item.bookingType === 'schedule' ? item.scheduledDate : item.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short' })}
                        </Text>
                    </View>
                    <View className={`px-3 py-1.5 rounded-lg border-l-4 ${statusConfig.bg} ${statusConfig.color.replace('text', 'border')}`}>
                        <Text
                            className={`font-black uppercase tracking-wider ${statusConfig.color}`}
                            style={{ fontSize: HEADER_TEXT_SIZE - 1 }}
                        >
                            {statusConfig.label.replace(/[✓✕⚡📍🚗🗓️]/g, '').trim()}
                        </Text>
                    </View>
                </View>

                {/* Route Details - Responsive */}
                <View className="flex-row items-start mb-4 relative">
                    {/* Connector Line */}
                    <View className="absolute left-[8px] top-4 bottom-4 w-0.5 bg-slate-100 border-l border-dashed border-slate-300" />

                    <View className="flex-1 gap-3">
                        {/* Source */}
                        <View className="flex-row items-center flex-1">
                            <View className={`rounded-full bg-blue-50 border-2 border-blue-100 items-center justify-center flex-shrink-0 ${width > 380 ? "w-5 h-5" : "w-4 h-4"}`}>
                                <View className={`rounded-full bg-blue-500 ${width > 380 ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
                            </View>
                            <Text
                                className="text-slate-800 font-bold ml-3 flex-1"
                                style={{ fontSize: width > 380 ? 14 : 13 }}
                                numberOfLines={2}
                            >
                                {item.pickupLocation}
                            </Text>
                        </View>

                        {/* Destination */}
                        <View className="flex-row items-center flex-1">
                            <View className={`rounded-full bg-orange-50 border-2 border-orange-100 items-center justify-center flex-shrink-0 ${width > 380 ? "w-5 h-5" : "w-4 h-4"}`}>
                                <View className={`rounded-full bg-orange-500 ${width > 380 ? "w-2 h-2" : "w-1.5 h-1.5"}`} />
                            </View>
                            <Text
                                className="text-slate-800 font-bold ml-3 flex-1"
                                style={{ fontSize: width > 380 ? 14 : 13 }}
                                numberOfLines={2}
                            >
                                {item.dropLocation}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Toll Fee - Responsive */}
                {Number(item.tollFee || 0) > 0 && (
                    <View className="flex-row justify-between items-center mb-3 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
                        <Text className="text-amber-700 font-bold uppercase tracking-wide flex-1" style={{ fontSize: HEADER_TEXT_SIZE - 1 }}>
                            Toll
                        </Text>
                        <Text className="text-amber-700 font-bold" style={{ fontSize: HEADER_TEXT_SIZE }}>
                            +₹{Number(item.tollFee || 0)}
                        </Text>
                    </View>
                )}

                {/* Footer Info – Responsive */}
                <View className={`flex-row justify-between items-center pt-2 border-t border-slate-50 ${width > 380 ? "gap-2" : "gap-1"}`}>
                    <View className="flex-row items-center flex-1 min-w-0">
                        <View className="bg-slate-100 p-1.5 rounded-lg flex-shrink-0">
                            <Ionicons name="car-sport-outline" size={width > 380 ? 14 : 12} color="#475569" />
                        </View>
                        <Text
                            className="text-slate-400 font-bold uppercase tracking-wider ml-2 flex-1"
                            style={{ fontSize: HEADER_TEXT_SIZE - 1 }}
                            numberOfLines={1}
                        >
                            {item.rideType} • {item.distance}km
                        </Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => onRidePress(item)}
                        className={`px-3 py-1.5 rounded-lg flex-row items-center flex-shrink-0 ${isActive ? 'bg-blue-600' : 'bg-slate-900'}`}
                    >
                        <Text
                            className="text-white font-black uppercase tracking-wider"
                            style={{ fontSize: HEADER_TEXT_SIZE - 1 }}
                        >
                            {isActive ? 'Track' : 'Details'}
                        </Text>
                        <Ionicons name="chevron-forward" size={width > 380 ? 12 : 10} color="white" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const RenderShimmerCard = ({ cardKey }: { cardKey: string }) => (
    <View key={cardKey} className="bg-white mb-3 border border-slate-100 rounded-2xl overflow-hidden">
        <View style={{ padding: CARD_PADDING }}>
            <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-slate-50">
                <Shimmer width={width > 380 ? 120 : 80} height={16} borderRadius={8} />
                <Shimmer width={width > 380 ? 60 : 50} height={16} borderRadius={8} />
            </View>
            <View className="mb-4 gap-3">
                <View className="flex-row items-center mb-3">
                    <Shimmer width={width > 380 ? 20 : 16} height={width > 380 ? 20 : 16} borderRadius={10} />
                    <Shimmer width={width > 380 ? "75%" : "70%"} height={14} style={{ marginLeft: 12 }} />
                </View>
                <View className="flex-row items-center">
                    <Shimmer width={width > 380 ? 20 : 16} height={width > 380 ? 20 : 16} borderRadius={10} />
                    <Shimmer width={width > 380 ? "75%" : "70%"} height={14} style={{ marginLeft: 12 }} />
                </View>
            </View>
            <View className="flex-row justify-between items-center pt-2 border-t border-slate-50">
                <Shimmer width={width > 380 ? 100 : 80} height={14} />
                <Shimmer width={width > 380 ? 80 : 65} height={24} borderRadius={8} />
            </View>
        </View>
    </View>
);

const ActivitySection: React.FC<ActivitySectionProps> = ({ onBookRide }) => {
    const [rides, setRides] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({ bookingType: "now", rideType: "" });
    const [currentFetchFilters, setCurrentFetchFilters] = useState({ bookingType: "now", rideType: "" });
    const router = useRouter();

    useEffect(() => {
        fetchHistory(1, false);
    }, [filters.bookingType, filters.rideType]);

    const fetchHistory = async (nextPage = 1, append = false) => {
        try {
            if (append) setLoadingMore(true);
            else setLoading(true);

            const queryParams: any = {
                page: nextPage,
                limit: 10,
                bookingType: filters.bookingType || "now",
                ...(filters.rideType && { rideType: filters.rideType }),
            };


            const response = await userAPI.getHistory(queryParams.page, queryParams.limit, queryParams);
            const newRides = response.data.bookings || [];
            const pages = response.data.pagination?.pages || 1;


            setRides(prev => append ? [...prev, ...newRides] : newRides);
            setTotalPages(pages);
            setPage(nextPage);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const handleFilterChange = (newFilters: any) => {
        console.log('🔄 Filter changed to:', JSON.stringify(newFilters));
        setFilters(newFilters);
        setPage(1);
        setRides([]);
        setLoadingMore(false);
    };

    const loadMore = () => {
        if (!loadingMore && page < totalPages) {
            fetchHistory(page + 1, true);
        }
    };

    const handleRidePress = useCallback((item: any) => {
        const activeStatuses = ['accepted', 'arrived', 'started'];
        const bookingId = item._id || item.id;

        if (activeStatuses.includes(item.status)) {
            router.push({
                pathname: "/screens/LiveRideTrackingScreen",
                params: { bookingId }
            });
        } else {
            router.push({
                pathname: "/screens/RideDetailsScreen",
                params: {
                    bookingId: String(bookingId),
                    prefill: JSON.stringify(item)
                }
            });
        }
    }, [router]);

    if (loading && page === 1) {
        return (
            <View className="flex-1 bg-slate-50">
                <HistoryFilterBar activeFilters={filters} onFilterChange={handleFilterChange} />
                <View style={{ paddingHorizontal: width > 380 ? 24 : 16, paddingTop: 16 }}>
                    <RenderShimmerCard cardKey="s1" />
                    <RenderShimmerCard cardKey="s2" />
                    <RenderShimmerCard cardKey="s3" />
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            {/* Filter Bar */}
            <HistoryFilterBar activeFilters={filters} onFilterChange={handleFilterChange} />

            {/* Content */}
            <View className="flex-1">
                {rides.length > 0 ? (
                    <>
                        {/* Rides List */}
                        <FlatList
                            data={rides}
                            renderItem={({ item }) => <RenderRideItem item={item} onRidePress={handleRidePress} />}
                            keyExtractor={(item, index) => (item._id || item.id || index).toString()}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{
                                paddingHorizontal: width > 380 ? 16 : 12,
                                paddingVertical: 12,
                                paddingBottom: 100
                            }}
                            refreshControl={
                                <RefreshControl
                                    refreshing={loading}
                                    onRefresh={() => fetchHistory(1, false)}
                                    tintColor="#FFD700"
                                />
                            }
                            onEndReached={() => loadMore()}
                            onEndReachedThreshold={0.5}
                            ListFooterComponent={
                                loadingMore ? (
                                    <View className="py-4 items-center">
                                        <Text className="text-slate-400 font-medium text-xs">
                                            Loading...
                                        </Text>
                                    </View>
                                ) : page < totalPages ? (
                                    <TouchableOpacity
                                        onPress={loadMore}
                                        className="bg-slate-900 mx-4 py-3 px-6 rounded-lg mb-6 flex-row items-center justify-center"
                                    >
                                        <Text className="text-[#FFD700] font-black uppercase text-sm tracking-widest">
                                            Load More
                                        </Text>
                                    </TouchableOpacity>
                                ) : rides.length > 0 ? (
                                    <View className="py-4 items-center">
                                        <Text className="text-slate-400 font-medium text-xs">
                                            No more rides
                                        </Text>
                                    </View>
                                ) : null
                            }
                        />
                    </>
                ) : (
                    <View className="flex-1 justify-center items-center px-4">
                        <View className={`bg-white rounded-full shadow-lg shadow-slate-200 mb-6 relative ${width > 380 ? "p-6" : "p-4"}`}>
                            <View className="absolute inset-0 bg-[#FFD700] opacity-20 rounded-full blur-xl scale-125" />
                            <MaterialCommunityIcons
                                name="clock-time-eight-outline"
                                size={width > 380 ? 64 : 48}
                                color="#CBD5E1"
                            />
                        </View>
                        <Text
                            className="font-black text-slate-800 mb-2 text-center"
                            style={{ fontSize: width > 380 ? 24 : 20 }}
                        >
                            No Rides
                        </Text>
                        <Text
                            className="text-slate-400 text-center font-medium leading-5 px-4 mb-8"
                            style={{ fontSize: width > 380 ? 14 : 13 }}
                        >
                            {filters.rideType && filters.rideType !== "all"
                                ? `No ${filters.rideType} rides found.`
                                : `No ${filters.bookingType === "schedule" ? "scheduled" : "immediate"} rides yet.`}
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onBookRide}
                            className="bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20 flex-row items-center"
                            style={{ paddingHorizontal: width > 380 ? 32 : 24, paddingVertical: 14 }}
                        >
                            <Text
                                className="text-[#FFD700] font-black tracking-wide flex-1"
                                style={{ fontSize: width > 380 ? 16 : 14 }}
                            >
                                BOOK A RIDE
                            </Text>
                            <Ionicons
                                name="arrow-forward"
                                size={width > 380 ? 20 : 16}
                                color="#FFD700"
                                style={{ marginLeft: 8 }}
                            />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ActivitySection;
