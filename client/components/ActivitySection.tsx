import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { userAPI } from '../utils/api';

const { width } = Dimensions.get('window');

interface ActivitySectionProps {
    onBookRide: () => void;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ onBookRide }) => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await userAPI.getHistory();
            setRides(response.data.bookings || []);
        } catch (error) {
            console.error("Failed to fetch history:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleRidePress = (item: any) => {
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
                params: { bookingId }
            });
        }
    };

    const renderRideItem = ({ item }: { item: any }) => {
        const isActive = ['accepted', 'arrived', 'started'].includes(item.status);

        return (
            <View className="bg-white p-5 rounded-[25px] mb-4 shadow-sm border border-slate-100">
                {/* Date & Status Header */}
                <View className="flex-row justify-between items-center mb-4 border-b border-slate-50 pb-3">
                    <View className="flex-row items-center bg-slate-50 px-3 py-1 rounded-full">
                        <Ionicons name="calendar-outline" size={14} color="#64748B" />
                        <Text className="text-xs font-bold text-slate-500 ml-1.5">
                            {new Date(item.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${item.status === 'completed' ? 'bg-green-50' : isActive ? 'bg-blue-50' : 'bg-red-50'}`}>
                        <Text className={`text-[10px] font-black uppercase tracking-wider ${item.status === 'completed' ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-red-500'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>

                {/* Route Details */}
                <View className="flex-row items-start mb-5 relative">
                    {/* Connector Line */}
                    <View className="absolute left-[9px] top-4 bottom-4 w-[2px] bg-slate-100 border-l border-dashed border-slate-300" />

                    <View className="flex-1 space-y-4">
                        {/* Source */}
                        <View className="flex-row items-center">
                            <View className="w-5 h-5 rounded-full bg-blue-50 border-[3px] border-blue-100 items-center justify-center z-10">
                                <View className="w-2 h-2 rounded-full bg-blue-500" />
                            </View>
                            <Text className="text-slate-800 font-bold ml-3 flex-1" numberOfLines={2}>{item.pickupLocation}</Text>
                        </View>

                        {/* Destination */}
                        <View className="flex-row items-center pt-2">
                            <View className="w-5 h-5 rounded-full bg-orange-50 border-[3px] border-orange-100 items-center justify-center z-10">
                                <View className="w-2 h-2 rounded-full bg-orange-500" />
                            </View>
                            <Text className="text-slate-800 font-bold ml-3 flex-1" numberOfLines={2}>{item.dropLocation}</Text>
                        </View>
                    </View>

                    {/* Price - REMOVED per user request */}
                </View>

                {/* Footer Info – Showing Ride Type & More */}
                <View className="flex-row justify-between items-center pt-2 border-t border-slate-50 mt-1">
                    <View className="flex-row items-center">
                        <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
                            <Ionicons name="car-sport-outline" size={16} color="#475569" />
                        </View>
                        <Text className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.rideType} • {item.distance}km</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => handleRidePress(item)}
                        className={`px-4 py-2 rounded-xl flex-row items-center ${isActive ? 'bg-blue-600' : 'bg-slate-900'}`}
                    >
                        <Text className="text-white font-black text-[10px] uppercase tracking-widest">
                            {isActive ? 'Track' : 'View Details'}
                        </Text>
                        <Ionicons name="chevron-forward" size={12} color="white" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-slate-50">
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white pt-16 pb-6 px-6 rounded-b-[40px] shadow-sm z-10">
                <View className="flex-row justify-between items-center">
                    <Text className="text-3xl font-black text-slate-900">Your Activity</Text>
                    <TouchableOpacity onPress={fetchHistory} className="bg-slate-50 p-2.5 rounded-full">
                        <Ionicons name="refresh" size={20} color="#1E293B" />
                    </TouchableOpacity>
                </View>
                <Text className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-widest">
                    Past Rides & History
                </Text>
            </View>

            {/* Content */}
            <View className="flex-1 px-6 pt-2">
                {rides.length > 0 ? (
                    <FlatList
                        data={rides}
                        renderItem={renderRideItem}
                        keyExtractor={(item, index) => (item._id || item.id || index).toString()}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 100 }}
                        refreshing={loading}
                        onRefresh={fetchHistory}
                    />
                ) : (
                    <View className="flex-1 justify-center items-center -mt-20">
                        <View className="bg-white p-6 rounded-full shadow-lg shadow-slate-200 mb-8 relative">
                            <View className="absolute inset-0 bg-[#FFD700] opacity-20 rounded-full blur-xl scale-125" />
                            <MaterialCommunityIcons name="clock-time-eight-outline" size={64} color="#CBD5E1" />
                        </View>
                        <Text className="text-2xl font-black text-slate-800 mb-3 text-center">No Rides Yet</Text>
                        <Text className="text-base text-slate-400 text-center font-medium leading-6 px-10 mb-10">
                            Looks like you haven't taken a ride with us yet. Start your journey today!
                        </Text>

                        <TouchableOpacity
                            activeOpacity={0.8}
                            onPress={onBookRide}
                            className="bg-slate-900 px-8 py-4 rounded-2xl shadow-xl shadow-slate-900/20 flex-row items-center"
                        >
                            <Text className="text-[#FFD700] font-black text-lg tracking-wide mr-2">BOOK A RIDE</Text>
                            <Ionicons name="arrow-forward" size={20} color="#FFD700" />
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
};

export default ActivitySection;
