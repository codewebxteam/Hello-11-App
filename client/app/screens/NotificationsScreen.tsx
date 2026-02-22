import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    RefreshControl,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { notificationAPI } from '../../utils/api';
import { StatusBar } from 'expo-status-bar';

interface NotificationItem {
    _id: string;
    title: string;
    body: string;
    type: string;
    createdAt: string;
    read: boolean;
}

const NotificationsScreen = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNotifications = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await notificationAPI.getNotifications();
            setNotifications(res.data.notifications);
        } catch (err) {
            console.error("Fetch notifications error:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNotifications(false);
    };

    const handleClearAll = () => {
        Alert.alert(
            "Clear All",
            "Are you sure you want to delete all notifications?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await notificationAPI.clearAll();
                            setNotifications([]);
                        } catch (err) {
                            Alert.alert("Error", "Failed to clear notifications.");
                        }
                    }
                }
            ]
        );
    };

    const markAsRead = async (id: string) => {
        try {
            await notificationAPI.markAsRead(id);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (err) {
            console.error("Mark as read error:", err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'ride_accepted': return { name: 'car-sharp', color: '#3B82F6' };
            case 'ride_nearby': return { name: 'location-sharp', color: '#F59E0B' };
            case 'ride_arrived': return { name: 'checkmark-circle-sharp', color: '#10B981' };
            case 'ride_started': return { name: 'navigate-circle-sharp', color: '#6366F1' };
            case 'ride_completed': return { name: 'star-sharp', color: '#8B5CF6' };
            case 'ride_cancelled': return { name: 'close-circle-sharp', color: '#EF4444' };
            default: return { name: 'notifications-sharp', color: '#94A3B8' };
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
    };

    const renderItem = ({ item }: { item: NotificationItem }) => {
        const iconInfo = getIcon(item.type);
        return (
            <TouchableOpacity
                className={`flex-row p-4 border-b border-slate-100 ${item.read ? 'bg-white' : 'bg-slate-50'}`}
                onPress={() => !item.read && markAsRead(item._id)}
            >
                <View className={`w-12 h-12 rounded-2xl items-center justify-center bg-white shadow-sm border border-slate-50`}>
                    <Ionicons name={iconInfo.name as any} size={24} color={iconInfo.color} />
                </View>
                <View className="flex-1 ml-4">
                    <View className="flex-row justify-between items-start">
                        <Text className={`text-sm flex-1 ${item.read ? 'text-slate-600 font-medium' : 'text-slate-900 font-bold'}`}>
                            {item.title}
                        </Text>
                        <Text className="text-[10px] text-slate-400 font-medium ml-2">
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                    <Text className="text-xs text-slate-500 mt-1 leading-4" numberOfLines={2}>
                        {item.body}
                    </Text>
                    <Text className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest">
                        {formatDate(item.createdAt)}
                    </Text>
                </View>
                {!item.read && (
                    <View className="w-2 h-2 rounded-full bg-blue-500 self-center ml-2" />
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView className="flex-1 bg-white" edges={['top']}>
            <StatusBar style="dark" />
            <View className="px-6 py-4 flex-row justify-between items-center border-b border-slate-50">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="mr-4">
                        <Ionicons name="arrow-back" size={24} color="#1E293B" />
                    </TouchableOpacity>
                    <Text className="text-xl font-black text-slate-800 tracking-tight">Notifications</Text>
                </View>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={handleClearAll}>
                        <Text className="text-red-500 font-bold text-sm">Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#FFD700" />
                </View>
            ) : notifications.length === 0 ? (
                <View className="flex-1 items-center justify-center px-10">
                    <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6">
                        <Ionicons name="notifications-off-outline" size={40} color="#CBD5E1" />
                    </View>
                    <Text className="text-lg font-black text-slate-800 text-center">No notifications yet</Text>
                    <Text className="text-slate-400 text-sm text-center mt-2 leading-5">
                        We'll notify you when something important happens regarding your rides.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#FFD700"]} />
                    }
                    contentContainerClassName="pb-10"
                />
            )}
        </SafeAreaView>
    );
};

export default NotificationsScreen;
