import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter } from "expo-router";
import ReturnTripOfferModal from '../../components/ReturnTripOfferModal';



const { width, height } = Dimensions.get('window');

type RideStatus = 'on_the_way' | 'arrived' | 'started';

interface LiveRideTrackingScreenProps {
    driverName?: string;
    carModel?: string;
    carNumber?: string;
    eta?: string;
    rideStatus?: RideStatus;
    otp?: string;
}


const LiveRideTrackingScreen = ({
    driverName = "Vikram Singh",
    carModel = "Swift Dzire",
    carNumber = "UP 32 HA 1947",
    eta = "4 mins",
    rideStatus = "on_the_way",
    otp = "4921"
}: LiveRideTrackingScreenProps) => {
    const router = useRouter();
    const [showReturnOffer, setShowReturnOffer] = useState(false);

    // Simulate offer appearing shortly after screen load
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setShowReturnOffer(true);
        }, 1500); // Show after 1.5 seconds
        return () => clearTimeout(timer);
    }, []);


    const getStatusConfig = () => {
        switch (rideStatus) {
            case 'arrived':
                return {
                    text: 'Driver has arrived',
                    color: 'bg-green-500',
                    icon: 'checkmark-circle' as const
                };
            case 'started':
                return {
                    text: 'Ride in progress',
                    color: 'bg-blue-500',
                    icon: 'navigate-circle' as const
                };
            default:
                return {
                    text: 'Driver is on the way',
                    color: 'bg-[#FFD700]',
                    icon: 'car' as const
                };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            {/* Mock Map Section (Top - 60% of screen) */}
            <View className="flex-[3] bg-slate-100 relative">
                {/* Mock Map Pattern */}
                <View className="absolute inset-0 opacity-10">
                    <View className="absolute top-20 left-10 w-full h-3 bg-slate-400 transform -rotate-12" />
                    <View className="absolute top-60 left-0 w-full h-2 bg-slate-400 transform rotate-6" />
                    <View className="absolute top-40 right-10 w-2 h-full bg-slate-400 transform rotate-12" />
                    <View className="absolute bottom-40 left-20 w-full h-2 bg-slate-400" />
                </View>

                {/* Moving Car Icon (Center of map) */}
                <View className="absolute top-1/2 left-1/2 -ml-8 -mt-8">
                    <Animated.View
                        entering={FadeIn.duration(500)}
                        className="bg-slate-900 p-3 rounded-full border-4 border-white shadow-2xl"
                    >
                        <Ionicons name="car-sport" size={32} color="#FFD700" />
                    </Animated.View>
                </View>

                {/* Destination Pin */}
                <View className="absolute bottom-20 right-10">
                    <View className="bg-green-500 p-2 rounded-full border-2 border-white shadow-lg">
                        <Ionicons name="location" size={20} color="white" />
                    </View>
                </View>

                {/* Header: Back Button & OTP/ETA Card */}
                <SafeAreaView className="absolute top-0 left-0 right-0 p-4">
                    <View className="flex-row justify-between items-start">
                        {/* Back Button */}
                        <TouchableOpacity
                            onPress={() => router.replace("/screens/HomeScreen")}
                            className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-lg active:scale-90"
                        >
                            <Ionicons name="arrow-back" size={24} color="#000" />
                        </TouchableOpacity>

                        {/* Modern Status Card */}
                        <View className="bg-white rounded-2xl shadow-xl p-1.5 flex-row items-center">
                            {/* OTP Section */}
                            <View className="bg-[#FFD700] px-4 py-2 rounded-xl items-center justify-center mr-3">
                                <Text className="text-[10px] font-black text-slate-800 uppercase tracking-wider">otp</Text>
                                <Text className="text-xl font-black text-black leading-5">{otp}</Text>
                            </View>

                            {/* ETA Section */}
                            <View className="pr-4 py-1">
                                <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Arriving</Text>
                                <View className="flex-row items-baseline">
                                    <Text className="text-lg font-black text-slate-900">{eta.split(' ')[0]}</Text>
                                    <Text className="text-xs font-bold text-slate-500 ml-1">{eta.split(' ')[1]}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </SafeAreaView>
            </View>


            {/* Bottom Info Section - Optimized to fit without scrolling */}
            <View className="flex-[2] bg-white rounded-t-[35px] -mt-8 shadow-2xl px-6 py-4">
                {/* Handle Bar */}
                <View className="items-center mb-3">
                    <View className="w-12 h-1 bg-slate-200 rounded-full" />
                </View>

                {/* Ride Status Banner */}
                <View className={`${statusConfig.color} p-3 rounded-2xl mb-4 flex-row items-center`}>
                    <Ionicons name={statusConfig.icon} size={20} color="black" />
                    <Text className="text-black text-sm font-black ml-2">{statusConfig.text}</Text>
                </View>

                {/* Driver Info Card */}
                <View className="bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
                    <Text className="text-slate-500 text-xs font-bold mb-2">YOUR DRIVER</Text>

                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center border-2 border-white shadow-sm">
                            <Ionicons name="person" size={24} color="#64748B" />
                        </View>

                        <View className="ml-3 flex-1">
                            <Text className="text-slate-900 text-base font-black">{driverName}</Text>
                            <Text className="text-slate-500 text-xs font-bold">{carModel} • {carNumber}</Text>
                        </View>

                        <View className="flex-row items-center bg-slate-900 px-2 py-1 rounded-full">
                            <Ionicons name="star" size={10} color="#FFD700" />
                            <Text className="text-white text-xs font-bold ml-1">4.8</Text>
                        </View>
                    </View>
                </View>

                {/* Action Buttons */}
                <View className="flex-row gap-3 mb-3">
                    {/* Call Driver */}
                    <TouchableOpacity className="flex-1 bg-green-500 py-3 rounded-2xl items-center flex-row justify-center shadow-lg active:scale-95">
                        <Ionicons name="call" size={18} color="white" />
                        <Text className="text-white font-black text-sm ml-2">CALL DRIVER</Text>
                    </TouchableOpacity>

                    {/* End Ride Button (For Demo) */}
                    <TouchableOpacity
                        onPress={() => router.push("/screens/RideCompletionScreen")}
                        className="bg-slate-900 w-12 h-12 rounded-2xl items-center justify-center shadow-lg active:scale-95"
                    >
                        <Ionicons name="checkmark-done" size={20} color="#FFD700" />
                    </TouchableOpacity>

                    {/* Cancel Ride Button */}
                    <TouchableOpacity
                        onPress={() => {
                            Alert.alert(
                                "Cancel Ride",
                                "Are you sure you want to cancel this ride?",
                                [
                                    {
                                        text: "No",
                                        style: "cancel"
                                    },
                                    {
                                        text: "Yes, Cancel",
                                        onPress: () => router.replace("/screens/HomeScreen"),
                                        style: "destructive"
                                    }
                                ]
                            );
                        }}
                        className="bg-red-500 w-12 h-12 rounded-2xl items-center justify-center shadow-lg active:scale-95"
                    >
                        <Ionicons name="close" size={24} color="white" />
                    </TouchableOpacity>
                </View>


                {/* Support Button */}
                <TouchableOpacity className="bg-slate-100 py-3 rounded-2xl items-center flex-row justify-center border border-slate-200 active:bg-slate-200">
                    <Ionicons name="help-circle-outline" size={18} color="#475569" />
                    <Text className="text-slate-600 font-black text-sm ml-2">CONTACT SUPPORT</Text>
                </TouchableOpacity>
            </View>

            {/* Return Trip Offer Popup */}
            <ReturnTripOfferModal
                isVisible={showReturnOffer}
                onClose={() => setShowReturnOffer(false)}
                onAccept={() => {
                    setShowReturnOffer(false);
                    router.push("/screens/WaitingTimerScreen");
                }}
            />
        </View>

    );
};


export default LiveRideTrackingScreen;
