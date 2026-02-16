import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Mock Data for Past Rides
const MOCK_RIDES = [
    {
        id: '1',
        date: 'Today, 10:30 AM',
        source: 'Home',
        destination: 'Office Complex, Sector 62',
        price: '₹245',
        status: 'Completed',
        vehicle: 'Swift Dzire',
        rating: 5,
    },
    {
        id: '2',
        date: 'Yesterday, 06:15 PM',
        source: 'Office Complex, Sector 62',
        destination: 'Home',
        price: '₹250',
        status: 'Completed',
        vehicle: 'WagonR',
        rating: 4,
    },
    {
        id: '3',
        date: '14 Feb, 09:00 PM',
        source: 'PVR Cinema',
        destination: 'Home',
        price: '₹180',
        status: 'Cancelled',
        vehicle: 'Auto',
        rating: 0,
    },
];

interface ActivitySectionProps {
    onBookRide: () => void;
}

const ActivitySection: React.FC<ActivitySectionProps> = ({ onBookRide }) => {
    // Toggle this to test empty state
    const [rides, setRides] = useState(MOCK_RIDES);
    // const [rides, setRides] = useState([]); 

    const renderRideItem = ({ item }: { item: any }) => (
        <View className="bg-white p-5 rounded-[25px] mb-4 shadow-sm border border-slate-100">
            {/* Date & Status Header */}
            <View className="flex-row justify-between items-center mb-4 border-b border-slate-50 pb-3">
                <View className="flex-row items-center bg-slate-50 px-3 py-1 rounded-full">
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text className="text-xs font-bold text-slate-500 ml-1.5">{item.date}</Text>
                </View>
                <View className={`px-3 py-1 rounded-full ${item.status === 'Completed' ? 'bg-green-50' : 'bg-red-50'}`}>
                    <Text className={`text-[10px] font-black uppercase tracking-wider ${item.status === 'Completed' ? 'text-green-600' : 'text-red-500'}`}>
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
                        <Text className="text-slate-800 font-bold ml-3 flex-1" numberOfLines={1}>{item.source}</Text>
                    </View>

                    {/* Destination */}
                    <View className="flex-row items-center">
                        <View className="w-5 h-5 rounded-full bg-orange-50 border-[3px] border-orange-100 items-center justify-center z-10">
                            <View className="w-2 h-2 rounded-full bg-orange-500" />
                        </View>
                        <Text className="text-slate-800 font-bold ml-3 flex-1" numberOfLines={1}>{item.destination}</Text>
                    </View>
                </View>

                {/* Price */}
                <View>
                    <Text className="text-lg font-black text-slate-900">{item.price}</Text>
                </View>
            </View>

            {/* Footer Info */}
            <View className="flex-row justify-between items-center pt-2">
                <View className="flex-row items-center">
                    <View className="bg-slate-100 p-1.5 rounded-lg mr-2">
                        <Ionicons name="car-sport-outline" size={16} color="#475569" />
                    </View>
                    <Text className="text-xs font-bold text-slate-600">{item.vehicle}</Text>
                </View>

                {item.rating > 0 && (
                    <View className="flex-row items-center bg-[#FFD700]/10 px-2 py-1 rounded-lg">
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text className="text-xs font-bold text-slate-800 ml-1">{item.rating}.0</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-slate-50">
            {/* Header */}
            <View className="bg-white pt-16 pb-6 px-6 rounded-b-[40px] shadow-sm z-10">
                <View className="flex-row justify-between items-center">
                    <Text className="text-3xl font-black text-slate-900">Your Activity</Text>
                    <TouchableOpacity className="bg-slate-50 p-2.5 rounded-full">
                        <Ionicons name="filter" size={20} color="#1E293B" />
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
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={{ paddingVertical: 20, paddingBottom: 100 }}
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
