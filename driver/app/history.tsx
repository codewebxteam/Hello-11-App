import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Platform,
    StatusBar as RNStatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from "expo-router";
import { StatusBar } from 'expo-status-bar';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

import { driverAPI } from '../utils/api';

interface RideItem {
    id: string;
    date: string;
    amount: string;
    pickup: string;
    drop: string;
    status: 'Completed' | 'Cancelled';
    rating: number;
    feedback: string;
    distance: number;
    user: any;
    rawStatus: string;
}

export default function RideHistoryScreen() {
    const router = useRouter();
    const [history, setHistory] = React.useState<RideItem[]>([]);
    const [loading, setLoading] = React.useState(true);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await driverAPI.getBookingsHistory();
            if (response.data && response.data.bookings) {
                setHistory(response.data.bookings.map((item: any) => ({
                    id: item.id || item._id,
                    date: new Date(item.createdAt).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }),
                    amount: `₹${item.totalFare || item.fare}`,
                    pickup: item.pickupLocation,
                    drop: item.dropLocation,
                    status: item.status === 'completed' ? 'Completed' : 'Cancelled',
                    rating: item.rating || 0,
                    feedback: item.feedback || "",
                    distance: item.distance || 0,
                    user: item.user,
                    rawStatus: item.status
                })));
            }
        } catch (error) {
            console.error("Error fetching history:", error);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        fetchHistory();
    }, []);

    const renderRideItem = ({ item }: { item: RideItem }) => (
        <View className="bg-white rounded-[26px] p-5 mb-4 shadow-sm border border-slate-100">

            {/* Header row */}
            <View className="flex-row justify-between items-start mb-4">
                <View>
                    <Text className="text-slate-400 text-[10px] font-black uppercase tracking-wider mb-1">{item.date}</Text>
                    <View className={`self-start px-2 py-1 rounded-md ${item.status === 'Completed' ? 'bg-green-50' : 'bg-red-50'}`}>
                        <Text className={`text-[10px] font-bold uppercase ${item.status === 'Completed' ? 'text-green-600' : 'text-red-500'}`}>
                            {item.status}
                        </Text>
                    </View>
                </View>
                {/* Amount removed per user request */}
            </View>

            {/* Route Info */}
            <View className="pl-1 relative mb-4">
                {/* Line */}
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

            {/* Footer */}
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
                        params: { bookingId: item.id }
                    })}
                    className="flex-row items-center"
                >
                    <Text className="text-slate-400 text-xs font-bold mr-1">View Details</Text>
                    <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
                </TouchableOpacity>
            </View>

        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />

            {/* Header */}
            <View
                className="bg-white shadow-sm z-10"
                style={{ paddingTop: STATUSBAR_HEIGHT }}
            >
                <View className="px-6 py-4 flex-row items-center justify-between">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100"
                    >
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-slate-900 font-black text-lg tracking-wider uppercase">Ride History</Text>
                    <View className="w-10" />
                </View>
            </View>

            <FlatList
                data={history}
                renderItem={renderRideItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ padding: 24, paddingBottom: 100 }}
                showsVerticalScrollIndicator={false}
                refreshing={loading}
                onRefresh={fetchHistory}
            />
        </View>
    );
}
