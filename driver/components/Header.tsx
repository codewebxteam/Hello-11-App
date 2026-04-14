import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar as RNStatusBar, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

interface HeaderProps {
    title: string;
    rightIcon?: keyof typeof Ionicons.glyphMap;
    onRightPress?: () => void;
    transparent?: boolean;
    showBackButton?: boolean;
    onBackPress?: () => void;
}

export default function Header({ 
    title, 
    rightIcon, 
    onRightPress, 
    transparent = false,
    showBackButton = true,
    onBackPress
}: HeaderProps) {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const compact = width < 380;
    const router = useRouter();

    return (
        <View 
            className={`${transparent ? '' : 'bg-white border-b border-slate-50 shadow-sm'} z-50`} 
            style={{ paddingTop: Math.max(insets.top, STATUSBAR_HEIGHT || 0) }}
        >
            <View className="py-4 flex-row items-center justify-between" style={{ paddingHorizontal: compact ? 14 : 24 }}>
                {showBackButton ? (
                    <TouchableOpacity 
                        onPress={onBackPress || (() => router.back())} 
                        className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100 shadow-sm"
                        activeOpacity={0.7}
                    >
                        <Ionicons name="chevron-back" size={24} color="#0F172A" />
                    </TouchableOpacity>
                ) : (
                    <View className="w-10 h-10" />
                )}
                
                <Text 
                    className="text-slate-900 font-black text-center flex-1 mx-2" 
                    style={{ fontSize: compact ? 13 : 15, textTransform: 'uppercase', letterSpacing: 2 }}
                    numberOfLines={1}
                >
                    {title}
                </Text>
                
                {rightIcon ? (
                    <TouchableOpacity 
                        onPress={onRightPress} 
                        className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100 shadow-sm"
                        activeOpacity={0.7}
                    >
                        <Ionicons name={rightIcon} size={20} color="#0F172A" />
                    </TouchableOpacity>
                ) : (
                    <View className="w-10 h-10" />
                )}
            </View>
        </View>
    );
}
