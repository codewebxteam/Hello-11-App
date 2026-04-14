import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, StatusBar as RNStatusBar, Linking, Alert, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../utils/mapCompat';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolate, runOnUI } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { driverAPI, locationAPI } from '../utils/api';
import { getSocket, initSocket } from '../utils/socket';

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = height * 0.75;
const SHEET_MIN_HEIGHT = 120;

export default function PickupScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const { bookingId } = params;
    const resolvedBookingId = Array.isArray(bookingId) ? bookingId[0] : bookingId;
    const [booking, setBooking] = useState<any>(null);
    const [driverLoc, setDriverLoc] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [region, setRegion] = useState<any>(null);
    const [distance, setDistance] = useState<string>("---");
    const [eta, setEta] = useState<string>("---");
    const [sheetMeasuredHeight, setSheetMeasuredHeight] = useState<number>(SHEET_MAX_HEIGHT);
    const lastUpdateCoords = useRef<{ lat: number; lon: number } | null>(null);

    // Animation Shared Values
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const sheetHeight = useSharedValue(SHEET_MAX_HEIGHT); // Initial guess to prevent jump
    const PEEK_HEIGHT = 120; // Increased peek height

    const gesture = Gesture.Pan()
        .onStart(() => {
            context.value = { y: translateY.value };
        })
        .onUpdate((event) => {
            const maxDrag = Math.max(0, sheetHeight.value - PEEK_HEIGHT);
            translateY.value = Math.max(0, Math.min(event.translationY + context.value.y, maxDrag));
        })
        .onEnd((event) => {
            const maxDrag = Math.max(0, sheetHeight.value - PEEK_HEIGHT);
            const shouldCollapse = translateY.value > maxDrag / 2 || event.velocityY > 500;

            translateY.value = withSpring(shouldCollapse ? maxDrag : 0, {
                damping: 20,
                stiffness: 90,
                mass: 1,
                overshootClamping: true
            });
        });

    const animatedSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: translateY.value }],
        };
    });

    const animatedContentOpacity = useAnimatedStyle(() => {
        const maxDrag = Math.max(0, sheetHeight.value - PEEK_HEIGHT);
        const opacity = interpolate(
            translateY.value,
            [0, Math.max(1, maxDrag * 0.5)],
            [1, 0],
            Extrapolate.CLAMP
        );
        return { opacity };
    });

    useEffect(() => {
        runOnUI((nextHeight: number, peekHeight: number) => {
            'worklet';
            sheetHeight.value = nextHeight;
            const maxDrag = Math.max(0, nextHeight - peekHeight);
            if (translateY.value > maxDrag) {
                translateY.value = maxDrag;
            }
        })(sheetMeasuredHeight, PEEK_HEIGHT);
    }, [sheetMeasuredHeight]);

    useEffect(() => {
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
                    if (!isNaN(loc.coords.latitude) && !isNaN(loc.coords.longitude)) {
                        setRegion({
                            latitude: loc.coords.latitude,
                            longitude: loc.coords.longitude,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        });
                    }
                }

                let b: any = null;

                // Primary: use explicit bookingId passed from previous screen/event.
                if (resolvedBookingId) {
                    try {
                        const byIdRes = await driverAPI.getBookingStatus(String(resolvedBookingId));
                        if (byIdRes?.data?.booking) {
                            b = byIdRes.data.booking;
                        }
                    } catch (err) {
                        console.log("Pickup: getBookingStatus failed, trying current booking fallback");
                    }
                }

                // Fallback: legacy current booking endpoint.
                if (!b) {
                    try {
                        const currentRes = await driverAPI.getCurrentBooking();
                        if (currentRes?.data?.booking) {
                            b = currentRes.data.booking;
                        }
                    } catch (err: any) {
                        const msg = err?.message || "";
                        // Suppress noisy known case when booking is not yet marked as active.
                        if (!msg.includes("No active booking found")) {
                            throw err;
                        }
                    }
                }

                if (b) {
                    setBooking(b);

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
                } else {
                    console.log("Pickup: booking not found from both bookingId and current endpoints.");
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
                }

                s.on("bookingCancelledByUser", (data: any) => {
                    if (String(data.bookingId) === String(resolvedBookingId || bookingId)) {
                        Alert.alert("Ride Cancelled", "The user has cancelled the ride.");
                        router.replace("/");
                    }
                });
            } catch (err) {
                console.warn("Socket setup failed in Pickup Screen", err);
            }
        };

        fetchBookingAndRoute();
        setupSocket();

        return () => {
            const s = getSocket();
            if (s) {
                s.off("bookingCancelledByUser");
            }
        };
    }, [resolvedBookingId]);

    useEffect(() => {
        if (!booking) return;

        let locationSubscription: any = null;
        const startTracking = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 10,
                    },
                    (newLoc) => {
                        const { latitude, longitude } = newLoc.coords;
                        setDriverLoc(newLoc.coords);
                        if (!isNaN(latitude) && !isNaN(longitude)) {
                            setRegion((prev: any) => ({
                                latitude,
                                longitude,
                                latitudeDelta: prev?.latitudeDelta || 0.05,
                                longitudeDelta: prev?.longitudeDelta || 0.05,
                            }));
                        }
                        driverAPI.updateLocation({ latitude, longitude }).catch(() => { });
                        
                        // Only fetch directions if we've moved significantly (>100m) or if it's the first time
                        const shouldUpdateDirections = !lastUpdateCoords.current || 
                            Math.abs(lastUpdateCoords.current.lat - latitude) > 0.001 || 
                            Math.abs(lastUpdateCoords.current.lon - longitude) > 0.001;

                        if (shouldUpdateDirections && booking?.pickupLatitude && booking?.pickupLongitude) {
                            lastUpdateCoords.current = { lat: latitude, lon: longitude };
                            locationAPI.getDirections(latitude, longitude, Number(booking.pickupLatitude), Number(booking.pickupLongitude))
                                .then(res => {
                                    if (res.data?.data) {
                                        setDistance(`${res.data.data.distanceKm} km`);
                                        setEta(`${Math.ceil(res.data.data.duration / 60)} min`);
                                        if (res.data.data.geometry?.coordinates) {
                                            const coords = res.data.data.geometry.coordinates.map((c: any) => ({
                                                latitude: Number(c[1]),
                                                longitude: Number(c[0])
                                            }));
                                            setRouteCoords(coords);
                                        }
                                    }
                                }).catch(() => { });
                        }
                    }
                );
            } catch (err) { console.error(err); }
        };

        startTracking();
        return () => locationSubscription?.remove();
    }, [booking?._id]);

    const handleCall = () => {
        if (booking?.user?.mobile) {
            Linking.openURL(`tel:${booking.user.mobile}`);
        } else {
            Alert.alert("Error", "Passenger mobile number not available.");
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

                        {Number(booking?.pickupLatitude || params.pLat) !== 0 && (
                            <Marker
                                tracksViewChanges={false}
                                coordinate={{
                                    latitude: Number(booking?.pickupLatitude || params.pLat) || 0,
                                    longitude: Number(booking?.pickupLongitude || params.pLon) || 0
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
            <SafeAreaView edges={['top']} className="absolute top-0 w-full z-10 px-4" style={{ paddingTop: insets.top + 8 }}>
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
            <Animated.View
                style={[{ position: 'absolute', bottom: 0, width: '100%', zIndex: 20 }, animatedSheetStyle]}
            >
                <GestureDetector gesture={gesture}>
                    <View
                        onLayout={(e) => {
                            const { height: h } = e.nativeEvent.layout;
                            if (h > 0 && Math.abs(sheetMeasuredHeight - h) > 1) {
                                setSheetMeasuredHeight(h);
                            }
                        }}
                        style={{ paddingBottom: insets.bottom + 20, minHeight: SHEET_MIN_HEIGHT }}
                        className="bg-[#0F172A] rounded-t-[40px] px-6 pt-4 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50"
                    >
                        {/* Handle Indicator */}
                        <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-4 opacity-50" />

                        {/* Collapsed view info (visible when dragging) */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center border border-[#FFD700] overflow-hidden">
                                    {booking?.user?.profileImage ? (
                                        <Image source={{ uri: booking.user.profileImage }} className="w-full h-full" />
                                    ) : (
                                        <Ionicons name="person" size={20} color="#CBD5E1" />
                                    )}
                                </View>
                                <View className="ml-3">
                                    <Text className="text-white font-bold">{booking?.user?.name || 'Passenger'}</Text>
                                    <Text className="text-slate-400 text-[10px] uppercase font-bold">{eta} • {distance}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={handleCall} className="w-10 h-10 bg-[#FFD700] rounded-xl items-center justify-center">
                                <Ionicons name="call" size={18} color="#0F172A" />
                            </TouchableOpacity>
                        </View>

                        <Animated.View style={animatedContentOpacity}>
                            <View className="h-[1px] bg-slate-800 w-full mb-6" />

                            {/* Stats Grid */}
                            <View className="flex-row justify-between mb-6">
                                <View className="flex-1 items-center">
                                    <Text className="text-slate-500 text-[10px] font-black uppercase tracking-wider mb-1">Time to Pickup</Text>
                                    <Text className="text-white text-xl font-black italic">{eta}</Text>
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
                                className="flex-row items-center mb-6 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50"
                            >
                                <View className="w-10 h-10 rounded-full bg-blue-500/20 items-center justify-center border border-blue-500/30 mr-4">
                                    <Ionicons name="location" size={20} color="#3B82F6" />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Pickup Location</Text>
                                    <Text className="text-white text-sm font-bold leading-5" numberOfLines={2}>{booking?.pickupLocation || 'Unknown'}</Text>
                                </View>
                                <View className="bg-slate-700 p-2 rounded-lg">
                                    <Ionicons name="navigate" size={18} color="#FFF" />
                                </View>
                            </TouchableOpacity>

                            {/* Chat Button */}
                            <TouchableOpacity
                                onPress={() => router.push({
                                    pathname: "/chat",
                                    params: { bookingId: bookingId, userName: booking?.user?.name || 'Passenger' }
                                })}
                                className="bg-blue-500 rounded-[20px] p-4 flex-row items-center justify-between mb-4"
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
                                <Ionicons name="chevron-forward" size={18} color="#FFF" />
                            </TouchableOpacity>

                            {/* Arrived Button */}
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
                                        router.push("/start-ride");
                                    }
                                }}
                                className="w-full bg-[#22C55E] py-5 rounded-[24px] items-center flex-row justify-center shadow-lg"
                            >
                                <Text className="text-[#0F172A] font-black text-lg tracking-[3px] uppercase mr-2">I Have Arrived</Text>
                                <Ionicons name="arrow-forward-circle" size={24} color="#0F172A" />
                            </TouchableOpacity>
                        </Animated.View>
                    </View>
                </GestureDetector>
            </Animated.View>
        </View>
    );
}
