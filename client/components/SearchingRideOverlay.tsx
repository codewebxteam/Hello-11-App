import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    // withSequence,
    FadeInDown,
    // FadeIn
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface SearchingRideOverlayProps {
    isVisible: boolean;
    onCancel: () => void;
    pickupLocation?: string;
    dropLocation?: string;
    rideMode?: string;
}

const SearchingRideOverlay = ({
    isVisible,
    onCancel,
    pickupLocation = "Current Location",
    dropLocation = "Select Destination",
    rideMode = "Standard"
}: SearchingRideOverlayProps) => {

    // Animation values for Pulse Effect
    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0.3);

    useEffect(() => {
        if (isVisible) {
            pulseScale.value = 1;
            pulseOpacity.value = 0.3;

            // Start Animation
            pulseScale.value = withRepeat(
                withTiming(1.5, { duration: 1500 }),
                -1, // Infinite
                false // No reverse
            );
            pulseOpacity.value = withRepeat(
                withTiming(0, { duration: 1500 }),
                -1,
                false
            );
        }
    }, [isVisible]);

    const pulseStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: pulseScale.value }],
            opacity: pulseOpacity.value,
        };
    });

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View className="flex-1 bg-black/60 justify-end">
                {/* Backdrop blur effect could be added here if using expo-blur */}

                <View className="bg-white rounded-t-[35px] shadow-2xl overflow-hidden">
                    {/* Header Bar */}
                    <View className="items-center pt-4 pb-2">
                        <View className="w-16 h-1.5 bg-slate-200 rounded-full" />
                    </View>

                    <View className="px-6 pb-10 pt-4">
                        {/* Title & Animation */}
                        <View className="items-center mb-8">
                            <View className="relative justify-center items-center mb-6 mt-2">
                                {/* Ripple Effect Circles (Reanimated) */}
                                <Animated.View
                                    style={[
                                        {
                                            position: 'absolute',
                                            width: 80,
                                            height: 80,
                                            backgroundColor: '#FFD700',
                                            borderRadius: 9999,
                                        },
                                        pulseStyle
                                    ]}
                                />

                                <View className="absolute w-20 h-20 bg-[#FFD700]/20 rounded-full" />

                                <View className="w-16 h-16 bg-[#FFD700] rounded-full items-center justify-center shadow-lg shadow-orange-200">
                                    <ActivityIndicator size="large" color="#000" />
                                </View>
                            </View>

                            <Text className="text-2xl font-black text-slate-900 text-center mb-1">
                                Finding your driver
                            </Text>
                            <Text className="text-slate-500 font-medium text-center">
                                Checking {rideMode} rides nearby...
                            </Text>
                        </View>

                        {/* Ride Details Card */}
                        <View className="bg-slate-50 p-5 rounded-3xl border border-slate-100 mb-8 space-y-4">
                            {/* Pickup */}
                            <View className="flex-row items-start">
                                <View className="mt-1">
                                    <View className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm" />
                                    <View className="w-0.5 h-8 bg-slate-200 ml-[5px] my-1" />
                                </View>
                                <View className="ml-3 flex-1 border-b border-slate-100 pb-3">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Pickup</Text>
                                    <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                                        {pickupLocation}
                                    </Text>
                                </View>
                            </View>

                            {/* Drop */}
                            <View className="flex-row items-start">
                                <View className="mt-1">
                                    <View className="w-3 h-3 rounded-none bg-slate-900 border-2 border-white shadow-sm rotate-45" />
                                </View>
                                <View className="ml-3 flex-1">
                                    <Text className="text-[10px] font-black text-slate-400 uppercase mb-0.5">Drop-off</Text>
                                    <Text className="text-slate-900 font-bold text-sm" numberOfLines={1}>
                                        {dropLocation}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Cancel Button */}
                        <TouchableOpacity
                            onPress={onCancel}
                            className="bg-slate-100 py-4 rounded-2xl items-center flex-row justify-center border border-slate-200 active:bg-slate-200"
                        >
                            <Ionicons name="close-circle" size={20} color="#64748B" />
                            <Text className="font-black text-slate-600 ml-2">CANCEL REQUEST</Text>
                        </TouchableOpacity>

                    </View>
                </View>
            </View>
        </Modal>
    );
};

export default SearchingRideOverlay;

