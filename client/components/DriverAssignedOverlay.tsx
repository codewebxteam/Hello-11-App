import React from 'react';
import { View, Text, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInDown, FadeIn } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

interface DriverAssignedOverlayProps {
    isVisible: boolean;
    onClose: () => void;
    onCallDriver?: () => void;
    onCancel?: () => void;
    onBookRide?: () => void;
    driverName?: string;
    carModel?: string;
    carNumber?: string;
    rating?: string;
    eta?: string;
}


const DriverAssignedOverlay = ({
    isVisible,
    onClose,
    onCallDriver,
    onCancel,
    onBookRide,
    driverName = "Vikram Singh",
    carModel = "Swift Dzire",
    carNumber = "UP 32 HA 1947",
    rating = "4.8",
    eta = "4 mins"
}: DriverAssignedOverlayProps) => {

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="none"
            onRequestClose={onClose}
        >
            {/* Animated Backdrop */}
            <Animated.View
                entering={FadeIn.duration(300)}
                className="flex-1 bg-black/60 justify-end"
            >
                {/* Overlay Content with Smooth Slide */}
                <Animated.View
                    entering={SlideInDown.springify().damping(20).mass(0.8).stiffness(90)}
                    className="bg-white rounded-t-[35px] shadow-2xl overflow-hidden h-[85%]"
                >
                    {/* Map Placeholder (Top Half) */}
                    <View className="flex-1 bg-slate-100 relative overflow-hidden">
                        {/* Mock Map Background pattern */}
                        <View className="absolute inset-0 opacity-20">
                            <View className="absolute top-10 left-10 w-full h-2 bg-slate-300 transform -rotate-12" />
                            <View className="absolute top-40 left-0 w-full h-4 bg-slate-300 transform rotate-6" />
                            <View className="absolute top-20 right-20 w-2 h-full bg-slate-300 transform rotate-12" />
                        </View>

                        {/* Live Location Indicators */}
                        <View className="flex-1 justify-center items-center">
                            {/* Car Icon on Map */}
                            <View className="bg-slate-900 p-2 rounded-full border-2 border-white shadow-lg">
                                <Ionicons name="car" size={24} color="#FFD700" />
                            </View>
                            <View className="w-1 h-8 bg-black/80 border-l-2 border-dashed border-white/50" />
                            {/* User Pin */}
                            <View className="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-sm" />
                        </View>

                        {/* ETA Floating Badge */}
                        <View className="absolute top-6 left-6 bg-slate-900 px-4 py-2 rounded-full shadow-lg border border-slate-700">
                            <Text className="text-white font-black text-xs">ARRIVING IN {eta.toUpperCase()}</Text>
                        </View>

                        {/* Close Button */}
                        <TouchableOpacity
                            onPress={onClose}
                            className="absolute top-6 right-6 bg-white w-10 h-10 rounded-full items-center justify-center shadow-lg"
                        >
                            <Ionicons name="close" size={22} color="#000" />
                        </TouchableOpacity>
                    </View>

                    {/* Driver & Ride Info (Bottom Sheet) */}
                    <View className="bg-white px-6 pt-6 pb-8 rounded-t-[35px] -mt-6 shadow-top shadow-xl">
                        {/* Handle Bar */}
                        <View className="items-center mb-6">
                            <View className="w-12 h-1 bg-slate-200 rounded-full" />
                        </View>

                        {/* Driver Profile */}
                        <View className="flex-row items-center mb-8">
                            <View className="relative">
                                <View className="w-16 h-16 bg-slate-200 rounded-full border-2 border-white shadow-md items-center justify-center">
                                    <Ionicons name="person" size={32} color="#94A3B8" />
                                </View>
                                <View className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                                    <View className="flex-row items-center bg-slate-900 px-1.5 py-0.5 rounded-full">
                                        <Ionicons name="star" size={10} color="#FFD700" />
                                        <Text className="text-white text-[10px] font-bold ml-0.5">{rating}</Text>
                                    </View>
                                </View>
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="text-lg font-black text-slate-900">{driverName}</Text>
                                <Text className="text-slate-500 font-bold text-sm">{carModel}</Text>
                                <View className="bg-slate-100 self-start px-2 py-0.5 rounded-md mt-1 border border-slate-200">
                                    <Text className="text-slate-700 text-xs font-black uppercase tracking-wider">{carNumber}</Text>
                                </View>
                            </View>

                            {/* Call Button */}
                            <TouchableOpacity
                                onPress={onCallDriver}
                                className="bg-green-500 w-12 h-12 rounded-full items-center justify-center shadow-lg shadow-green-200 active:scale-95"
                            >
                                <Ionicons name="call" size={22} color="white" />
                            </TouchableOpacity>
                        </View>

                        {/* Action Buttons */}
                        <View className="flex-row gap-4 mt-4">
                            <TouchableOpacity
                                onPress={onCancel}
                                className="flex-1 bg-slate-100 py-4 rounded-2xl items-center border border-slate-200 active:bg-slate-200"
                            >
                                <Text className="font-extrabold text-slate-600">CANCEL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={onBookRide}
                                className="flex-1 bg-slate-900 py-4 rounded-2xl items-center shadow-lg shadow-slate-300 active:scale-95"
                            >
                                <Text className="font-extrabold text-[#FFD700]">BOOK RIDE</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
};

export default DriverAssignedOverlay;
