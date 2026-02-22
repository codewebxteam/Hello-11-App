import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, StatusBar as RNStatusBar, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { driverAPI, locationAPI } from '../utils/api';
import { getSocket, initSocket } from '../utils/socket';

const { width, height } = Dimensions.get('window');

export default function PickupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { bookingId } = useLocalSearchParams();
    const [booking, setBooking] = useState<any>(null);
    const [driverLoc, setDriverLoc] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [region, setRegion] = useState<any>(null);
    const [distance, setDistance] = useState<string>("---");
    const [eta, setEta] = useState<string>("---");

    useEffect(() => {
        let locationSubscription: any = null;

        const startTracking = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 10, // Update every 10 meters
                    },
                    (newLoc) => {
                        const { latitude, longitude } = newLoc.coords;
                        setDriverLoc(newLoc.coords);

                        if (!isNaN(latitude) && !isNaN(longitude)) {
                            setRegion((prev: any) => ({
                                latitude: latitude,
                                longitude: longitude,
                                latitudeDelta: prev?.latitudeDelta || 0.05,
                                longitudeDelta: prev?.longitudeDelta || 0.05,
                            }));
                        }

                        // Update backend
                        driverAPI.updateLocation({ latitude, longitude }).catch(err =>
                            console.log("Failed to update driver location:", err)
                        );

                        // Refresh directions for real-time ETA/Distance
                        if (booking?.pickupLatitude && booking?.pickupLongitude) {
                            locationAPI.getDirections(latitude, longitude, Number(booking.pickupLatitude), Number(booking.pickupLongitude))
                                .then(res => {
                                    if (res.data?.data) {
                                        setDistance(`${res.data.data.distanceKm} km`);
                                        const etaMin = Math.ceil(res.data.data.duration / 60);
                                        setEta(`${etaMin} min`);
                                    }
                                }).catch(() => { });
                        }
                    }
                );
            } catch (err) {
                console.error("Error starting location tracking:", err);
            }
        };

        const fetchBookingAndRoute = async () => {
            try {
                // 1. Get initial location
                let { status } = await Location.requestForegroundPermissionsAsync();
                let currentLat, currentLon;
                if (status === 'granted') {
                    let loc = await Location.getCurrentPositionAsync({});
                    currentLat = loc.coords.latitude;
                    currentLon = loc.coords.longitude;
                    setDriverLoc(loc.coords);
                    setDriverLoc(loc.coords);
                    if (!isNaN(loc.coords.latitude) && !isNaN(loc.coords.longitude)) {
                        setRegion({
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        });
                    }
                }

                // 2. Fetch booking
                const response = await driverAPI.getCurrentBooking();
                if (response.data && response.data.booking) {
                    const b = response.data.booking;
                    setBooking(b);

                    // 3. Get directions if we have driver location
                    if (status === 'granted' && currentLat && currentLon) {
                        const pickupLat = Number(b.pickupLatitude);
                        const pickupLon = Number(b.pickupLongitude);

                        if (pickupLat && pickupLon) {
                            const dirRes = await locationAPI.getDirections(currentLat, currentLon, pickupLat, pickupLon);
                            if (dirRes.data && dirRes.data.data) {
                                setDistance(`${dirRes.data.data.distanceKm} km`);
                                const etaMin = Math.ceil(dirRes.data.data.duration / 60);
                                setEta(`${etaMin} min`);

                                if (dirRes.data.data.geometry && Array.isArray(dirRes.data.data.geometry.coordinates)) {
                                    const coords = dirRes.data.data.geometry.coordinates
                                        .filter((c: any) => Array.isArray(c) && c.length >= 2 && c[1] !== null && c[0] !== null)
                                        .map((c: any) => ({
                                            latitude: Number(c[1]),
                                            longitude: Number(c[0])
                                        }));
                                    if (coords.length > 0) setRouteCoords(coords);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching booking or route:", error);
            }
        };

        const setupSocket = async () => {
            try {
                const s = await initSocket();
                const profile = await driverAPI.getProfile();
                const driverId = profile.data?.driver?._id || profile.data?.driver?.id;
                if (driverId) {
                    s.emit("join", driverId);
                    console.log("Pickup Screen joined socket room:", driverId);
                }

                s.on("bookingCancelledByUser", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        Alert.alert("Ride Cancelled", "The user has cancelled the ride.");
                        router.replace("/");
                    }
                });
            } catch (err) {
                console.warn("Socket setup failed in Pickup Screen", err);
            }
        };

        startTracking();
        fetchBookingAndRoute();
        setupSocket();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
            const s = getSocket();
            if (s) {
                s.off("bookingCancelledByUser");
            }
        };
    }, [bookingId]);

    const handleCall = () => {
        if (booking?.user?.mobile) {
            Linking.openURL(`tel:${booking.user.mobile}`);
        } else {
            Alert.alert("Error", "Passenger mobile number not available.");
        }
    };

    const handleChat = () => {
        if (booking?.user?.mobile) {
            Linking.openURL(`sms:${booking.user.mobile}`);
        } else {
            Alert.alert("Chat", "Chat feature coming soon!");
        }
    };

    const handleNavigate = () => {
        if (booking?.pickupLatitude && booking?.pickupLongitude) {
            const url = Platform.select({
                ios: `maps:0,0?q=${booking.pickupLatitude},${booking.pickupLongitude}`,
                android: `geo:0,0?q=${booking.pickupLatitude},${booking.pickupLongitude}`
            });
            if (url) Linking.openURL(url);
        }
    };

    const handleCancelRide = async () => {
        Alert.alert(
            "Cancel Ride",
            "Are you sure you want to cancel this ride?",
            [
                { text: "No", style: "cancel" },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            if (booking?._id) {
                                await driverAPI.cancelBooking(booking._id, "Driver cancelled");
                                Alert.alert("Success", "Ride cancelled successfully");
                                router.replace("/");
                            }
                        } catch (error: any) {
                            Alert.alert("Error", error?.response?.data?.message || "Failed to cancel ride");
                        }
                    }
                }
            ]
        );
    };

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="dark" />

            {/* --- REAL MAP BACKGROUND --- */}
            <View className="absolute inset-0 bg-slate-200">
                {region ? (
                    <MapView
                        style={{ width, height }}
                        region={region}
                        showsUserLocation={true}
                        provider={PROVIDER_GOOGLE}
                    >

                        {routeCoords.length > 0 && (
                            <Polyline
                                coordinates={routeCoords}
                                strokeWidth={5}
                                strokeColor="#3b82f6"
                            />
                        )}

                        {booking && Number(booking.pickupLatitude) !== 0 && Number(booking.pickupLongitude) !== 0 && (
                            <Marker
                                coordinate={{
                                    latitude: Number(booking.pickupLatitude || 0) || 0,
                                    longitude: Number(booking.pickupLongitude || 0) || 0
                                }}
                            >
                                <View className="bg-white p-2 rounded-full border-[3px] border-green-500 shadow-lg">
                                    <Ionicons name="person" size={20} color="#0F172A" />
                                </View>
                            </Marker>
                        )}
                    </MapView>
                ) : (
                    <View className="flex-1 items-center justify-center">
                        <Text className="text-slate-400 font-bold">Loading Map...</Text>
                    </View>
                )}
            </View>

            {/* --- TOP BAR --- */}
            <SafeAreaView edges={['top']} className="absolute top-0 w-full z-10 px-4 pt-2">
                <View className="bg-[#0F172A] rounded-2xl p-4 shadow-2xl flex-row items-center border border-slate-700/50">
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-slate-700 active:bg-slate-700"
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </TouchableOpacity>

                    <View className="flex-1 ml-4">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Picking up</Text>
                        <Text className="text-white text-lg font-black tracking-tight" numberOfLines={2}>{booking?.user?.name || 'Passenger'}</Text>
                    </View>

                    <View className="bg-green-500/20 px-3 py-1.5 rounded-lg border border-green-500/50">
                        <Text className="text-green-400 font-bold text-xs">ON TIME</Text>
                    </View>
                </View>
            </SafeAreaView>

            {/* --- BOTTOM SHEET (INFORMATION) --- */}
            <View className="absolute bottom-0 w-full z-20">
                <View
                    style={{ paddingBottom: insets.bottom + 20 }}
                    className="bg-[#0F172A] rounded-t-[40px] px-6 pt-8 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50"
                >
                    {/* Handle Indicator */}
                    <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-8 opacity-50" />

                    {/* User Profile Row */}
                    <View className="flex-row items-center justify-between mb-8">
                        <View className="flex-row items-center flex-1">
                            <View className="relative">
                                <View className="w-16 h-16 bg-slate-700 rounded-full items-center justify-center border-2 border-[#FFD700] shadow-glow overflow-hidden">
                                    {booking?.user?.profileImage ? (
                                        <Image
                                            source={{ uri: booking.user.profileImage }}
                                            className="w-full h-full"
                                        />
                                    ) : (
                                        <Text className="text-2xl">👤</Text>
                                    )}
                                </View>
                            </View>

                            <View className="ml-4 flex-1">
                                <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Passenger</Text>
                                <Text className="text-white text-xl font-black" numberOfLines={2}>{booking?.user?.name || 'Passenger'}</Text>
                            </View>
                        </View>

                        {/* Communication Actions */}
                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={handleCall}
                                className="w-12 h-12 bg-[#FFD700] rounded-2xl items-center justify-center shadow-lg shadow-yellow-500/20 active:bg-[#FCD34D]"
                            >
                                <Ionicons name="call" size={22} color="#0F172A" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-800 w-full mb-8" />

                    {/* Stats Grid */}
                    <View className="flex-row justify-between mb-8">
                        <View className="flex-1 items-center">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Time to Pickup</Text>
                            <View className="flex-row items-end">
                                <Text className="text-white text-xl font-black italic">{eta}</Text>
                            </View>
                        </View>
                        <View className="w-[1px] h-8 bg-slate-800 self-center" />
                        <View className="flex-1 items-center">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Distance</Text>
                            <Text className="text-white text-xl font-black italic">{distance}</Text>
                        </View>
                        <View className="w-[1px] h-8 bg-slate-800 self-center" />
                        <View className="flex-1 items-center">
                            <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Method</Text>
                            <Text className="text-green-400 text-xl font-black italic uppercase">{booking?.paymentMethod || 'Cash'}</Text>
                        </View>
                    </View>

                    {/* Location Details */}
                    <TouchableOpacity
                        onPress={handleNavigate}
                        className="flex-row items-center mb-10 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50"
                    >
                        <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center border border-blue-500/30 mr-4">
                            <Ionicons name="location" size={20} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Pickup Location</Text>
                            <Text className="text-white text-sm font-bold leading-5" numberOfLines={3}>{booking?.pickupLocation || 'Unknown'}</Text>
                        </View>
                        <View className="bg-slate-700 p-2 rounded-lg">
                            <Ionicons name="navigate" size={18} color="#FFF" />
                        </View>
                    </TouchableOpacity>

                    {/* Chat Button */}
                    <TouchableOpacity
                        onPress={() => router.push({
                            pathname: "/chat",
                            params: {
                                bookingId: bookingId,
                                userName: booking?.user?.name || 'Passenger'
                            }
                        })}
                        className="bg-blue-500 rounded-[20px] p-4 flex-row items-center justify-between mb-4 shadow-sm"
                    >
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center mr-3">
                                <Ionicons name="chatbubbles" size={20} color="#FFF" />
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">Chat with Passenger</Text>
                                <Text className="text-blue-100 text-xs font-bold">Send a message</Text>
                            </View>
                        </View>
                        <View className="bg-white/20 p-2 rounded-lg">
                            <Ionicons name="chevron-forward" size={18} color="#FFF" />
                        </View>
                    </TouchableOpacity>



                    {/* Slider / Button */}
                    <TouchableOpacity
                        activeOpacity={0.9}
                        onPress={async () => {
                            try {
                                if (booking?._id) {
                                    await driverAPI.updateBookingStatus(booking._id, 'arrived');
                                }
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                router.push("/start-ride");
                            } catch (err) {
                                console.log("Arrived update error:", err);
                                // Fallback navigation if API fails
                                router.push("/start-ride");
                            }
                        }}
                        className="w-full bg-[#22C55E] py-5 rounded-[24px] items-center flex-row justify-center shadow-lg shadow-green-500/20 relative overflow-hidden"
                    >
                        {/* Shine Effect */}
                        <View className="absolute top-0 bottom-0 left-0 w-full bg-white/10 skew-x-12 -ml-[100%]" />

                        <Text className="text-[#0F172A] font-black text-lg tracking-[3px] uppercase mr-2">I Have Arrived</Text>
                        <Ionicons name="arrow-forward-circle" size={24} color="#0F172A" />
                    </TouchableOpacity>

                </View>
            </View>

        </View >
    );
}
