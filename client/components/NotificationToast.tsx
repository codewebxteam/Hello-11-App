import React, { useState, useEffect, useRef } from 'react';
import { Animated, Text, View, DeviceEventEmitter, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SHOW_TOAST = 'SHOW_TOAST';

export const showToast = (title: string, body: string, type: 'info' | 'success' | 'error' = 'info') => {
    DeviceEventEmitter.emit(SHOW_TOAST, { title, body, type });
};

const NotificationToast = () => {
    const [visible, setVisible] = useState(false);
    const [data, setData] = useState({ title: '', body: '', type: 'info' });
    const translateY = useRef(new Animated.Value(-100)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener(SHOW_TOAST, (payload) => {
            setData(payload);
            show();
        });

        return () => subscription.remove();
    }, []);

    const show = () => {
        setVisible(true);
        Animated.spring(translateY, {
            toValue: insets.top + 10,
            useNativeDriver: true,
            tension: 40,
            friction: 7
        }).start();

        // Auto hide after 4 seconds
        setTimeout(hide, 4000);
    };

    const hide = () => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true
        }).start(() => setVisible(false));
    };

    if (!visible) return null;

    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    top: 0,
                    left: 16,
                    right: 16,
                    zIndex: 9999,
                    transform: [{ translateY }],
                }
            ]}
        >
            <Pressable
                onPress={hide}
                className="bg-slate-900 rounded-[24px] p-4 flex-row items-center shadow-2xl border border-slate-700"
            >
                <View className="bg-[#FFD700] w-10 h-10 rounded-full items-center justify-center mr-3">
                    <Ionicons name="notifications" size={20} color="black" />
                </View>
                <View className="flex-1">
                    <Text className="text-white font-black text-sm" numberOfLines={1}>{data.title}</Text>
                    <Text className="text-slate-400 text-xs font-bold" numberOfLines={2}>{data.body}</Text>
                </View>
                <TouchableOpacity onPress={hide} className="ml-2">
                    <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
            </Pressable>
        </Animated.View>
    );
};

export default NotificationToast;
