import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, StatusBar as RNStatusBar, Alert, TextInput } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolate } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { driverAPI, locationAPI } from '../utils/api';

const { width, height } = Dimensions.get('window');
const SHEET_MAX_HEIGHT = height * 0.85;
const SHEET_MIN_HEIGHT = 140;

export default function ActiveRideScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [booking, setBooking] = React.useState<any>(null);

    // Check if this is a return trip or if coming back from waiting
    const isReturnTrip = params.mode === 'return';
    // penaltyAmount: use live state (updated by API and socket), fallback to params
    const [penaltyAmount, setPenaltyAmount] = React.useState<number>(params.penalty ? Number(params.penalty) : 0);
    const [tollAmount, setTollAmount] = React.useState<number>(params.toll ? Number(params.toll) : 0);
    const [tollInput, setTollInput] = React.useState<string>(params.toll ? String(params.toll) : "");

    const bookingId = params.bookingId as string;
    const distanceKm = params.distance ? parseFloat(params.distance as string) : 12.4;

    const [hasReturnTrip, setHasReturnTrip] = React.useState(false);
    const [routeCoords, setRouteCoords] = React.useState<any[]>([]);
    const [region, setRegion] = React.useState<any>(() => {
        if (params.pLat && params.pLon) {
            return {
                latitude: Number(params.pLat),
                longitude: Number(params.pLon),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            };
        }
        return null;
    });

    const [distance, setDistance] = React.useState<string>("---");
    const [eta, setEta] = React.useState<string>("---");
    const lastUpdateCoords = useRef<{ lat: number; lon: number } | null>(null);

    // Animation Shared Values
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const sheetHeight = useSharedValue(SHEET_MAX_HEIGHT); // Initial guess
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
        const fetchBookingAndRoute = async () => {
            try {
                // 1. Fetch booking
                const response = await driverAPI.getCurrentBooking();
                if (response.data && response.data.booking) {
                    const b = response.data.booking;
                    setBooking(b);
                    setHasReturnTrip(b.hasReturnTrip || false);
                    // Sync penalty from backend
                    if (b.penaltyApplied !== undefined) {
                        setPenaltyAmount(Number(b.penaltyApplied) || 0);
                    }
                    if (b.tollFee !== undefined) {
                        const nextToll = Number(b.tollFee) || 0;
                        setTollAmount(nextToll);
                        setTollInput(nextToll > 0 ? String(nextToll) : "");
                    }

                    // 2. Set initial region
                    const pLat = Number(b.pickupLatitude);
                    const pLon = Number(b.pickupLongitude);

                    if (!isNaN(pLat) && !isNaN(pLon) && pLat !== 0 && pLon !== 0) {
                        setRegion({
                            latitude: pLat,
                            longitude: pLon,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05,
                        });
                    }

                    // 3. Get directions to target
                    const startLat = isReturnTrip ? b.dropLatitude : b.pickupLatitude;
                    const startLon = isReturnTrip ? b.dropLongitude : b.pickupLongitude;
                    const endLat = isReturnTrip ? b.pickupLatitude : b.dropLatitude;
                    const endLon = isReturnTrip ? b.pickupLongitude : b.dropLongitude;

                    if (startLat && startLon && endLat && endLon) {
                        const dirRes = await locationAPI.getDirections(startLat, startLon, endLat, endLon);
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
            } catch (error: any) {
                console.error("Error fetching booking or route:", error);
                // Redirect back if no active booking found
                if (error.message === "No active booking found" || error.status === 404) {
                    Alert.alert("No Active Ride", "No active ride was found for this session.");
                    router.replace("/");
                }
            }
        };

        fetchBookingAndRoute();
    }, [bookingId]);

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
                        setRegion((prev: any) => ({
                            latitude,
                            longitude,
                            latitudeDelta: prev?.latitudeDelta || 0.05,
                            longitudeDelta: prev?.longitudeDelta || 0.05,
                        }));
                        driverAPI.updateLocation({ latitude, longitude }).catch(() => { });

                        const targetLat = isReturnTrip ? Number(booking?.pickupLatitude) : Number(booking?.dropLatitude);
                        const targetLon = isReturnTrip ? Number(booking?.pickupLongitude) : Number(booking?.dropLongitude);

                        if (targetLat && targetLon) {
                            // Only fetch directions if we've moved significantly (>100m) or if it's the first time
                            const shouldUpdateDirections = !lastUpdateCoords.current || 
                                Math.abs(lastUpdateCoords.current.lat - latitude) > 0.001 || 
                                Math.abs(lastUpdateCoords.current.lon - longitude) > 0.001;

                            if (shouldUpdateDirections) {
                                lastUpdateCoords.current = { lat: latitude, lon: longitude };
                                locationAPI.getDirections(latitude, longitude, targetLat, targetLon)
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
                    }
                );
            } catch (err) { console.error(err); }
        };

        startTracking();
        return () => locationSubscription?.remove();
    }, [booking?._id]);

    useEffect(() => {
        const setupSocket = async () => {
            const socket = await require("../utils/socket").getSocket();
            if (socket) {
                socket.on("returnTripAccepted", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        setHasReturnTrip(true);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                });

                socket.on("bookingCancelledByUser", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        Alert.alert("Ride Cancelled", "The user has cancelled the ride.");
                        router.replace("/");
                    }
                });

                // Real-time penalty update for driver
                socket.on("penaltyApplied", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        setPenaltyAmount(Number(data.penaltyApplied) || 0);
                        setBooking((prev: any) => prev ? { ...prev, penaltyApplied: data.penaltyApplied } : prev);
                    }
                });

                socket.on("tollFeeUpdated", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        const nextToll = Number(data.tollFee) || 0;
                        setTollAmount(nextToll);
                        setTollInput(nextToll > 0 ? String(nextToll) : "");
                        setBooking((prev: any) => prev ? { ...prev, tollFee: data.tollFee, totalFare: data.totalFare } : prev);
                    }
                });
            }
        };
        setupSocket();
    }, [bookingId]);

    const updateTollFee = (value: number) => {
        const next = Math.max(0, Number(value) || 0);
        driverAPI.updateTollFee(bookingId, next)
            .then(() => {
                setTollAmount(next);
                setTollInput(next > 0 ? String(next) : "");
                setBooking((prev: any) => prev ? { ...prev, tollFee: next } : prev);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            })
            .catch(() => Alert.alert("Error", "Failed to update toll fee."));
    };

    const handleApplyManualToll = () => {
        const parsed = Number((tollInput || "").trim());
        if (!Number.isFinite(parsed) || parsed < 0) {
            Alert.alert("Invalid Toll", "Please enter a valid toll amount.");
            return;
        }
        updateTollFee(parsed);
    };

    const handleClearToll = () => {
        setTollInput("");
        updateTollFee(0);
    };

    const handleEndRide = () => {
        Alert.alert(
            "End Ride?",
            "Are you sure you have reached the destination?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, End Ride",
                    style: "destructive",
                    onPress: () => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        // Navigate to Payment Screen with ride details
                        router.push({
                            pathname: "/payment",
                            params: {
                                bookingId,
                                penalty: penaltyAmount || '0',
                                toll: tollAmount || '0',
                                distance: distance.replace(' km', '') || distanceKm.toString(),
                                outboundDistance: (booking?.distance || 0).toString(),
                                time: eta.replace(' min', '') || '0',
                                baseFare: (booking?.fare || 0).toString(),
                                nightSurcharge: (booking?.nightSurcharge || 0).toString(),
                                returnFare: (booking?.returnTripFare || 0).toString(),
                                pickup: booking?.pickupLocation || '',
                                drop: booking?.dropLocation || '',
                                isReturn: isReturnTrip ? 'true' : 'false',
                                hasReturnTrip: hasReturnTrip ? 'true' : 'false',
                                firstLegPaid: booking?.firstLegPaid ? 'true' : 'false'
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleEndLeg1 = () => {
        const isOutstation = booking?.rideType === 'outstation';
        const distanceVal = booking?.distance || 0;

        if (isOutstation && distanceVal > 40) {
            Alert.alert(
                "End of First Leg",
                "This is an outstation trip. How would the passenger like to pay?",
                [
                    {
                        text: "Collect Half Fare Now",
                        onPress: () => {
                            router.push({
                                pathname: "/payment",
                                params: {
                                    bookingId,
                                    nextRoute: "/waiting-for-return",
                                    isFirstLeg: 'true',
                                    toll: tollAmount || '0',
                                    baseFare: (booking?.fare || 0).toString(),
                                    nightSurcharge: (booking?.nightSurcharge || 0).toString(),
                                    distance: distance.replace(' km', '') || distanceKm.toString(),
                                    pickup: booking?.pickupLocation || '',
                                    drop: booking?.dropLocation || '',
                                }
                            });
                        }
                    },
                    {
                        text: "Pay Total at End",
                        onPress: async () => {
                            try {
                                await driverAPI.updatePaymentChoice(bookingId, 'total_at_end');
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                router.push({
                                    pathname: "/waiting-for-return",
                                    params: { bookingId, distance: distanceKm.toString() }
                                });
                            } catch (err) {
                                Alert.alert("Error", "Failed to update payment choice.");
                            }
                        }
                    },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        } else {
            // Normal trip (local) - Enforce intermediate payment
            Alert.alert(
                "Start Waiting?",
                "Finish first leg? (Mandatory half-fare collection for local rides)",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Collect Fare & Wait",
                        onPress: () => {
                            router.push({
                                pathname: "/payment",
                                params: {
                                    bookingId,
                                    nextRoute: "/waiting-for-return",
                                    isFirstLeg: 'true',
                                    toll: tollAmount || '0',
                                    baseFare: (booking?.fare || 0).toString(),
                                    nightSurcharge: (booking?.nightSurcharge || 0).toString(),
                                    distance: distance.replace(' km', '') || distanceKm.toString(),
                                    pickup: booking?.pickupLocation || '',
                                    drop: booking?.dropLocation || '',
                                }
                            });
                        }
                    }
                ]
            );
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

                        {/* Markers show even before booking data loads if params are present */}
                        {Number(booking?.pickupLatitude || (isReturnTrip ? params.dLat : params.pLat)) !== 0 && (
                            <Marker
                                tracksViewChanges={false}
                                coordinate={{
                                    latitude: Number(isReturnTrip ? (booking?.dropLatitude || params.dLat) : (booking?.pickupLatitude || params.pLat)) || 0,
                                    longitude: Number(isReturnTrip ? (booking?.dropLongitude || params.dLon) : (booking?.pickupLongitude || params.pLon)) || 0
                                }}
                            >
                                <View className="items-center">
                                    <View className="bg-blue-500 px-2 py-0.5 rounded mb-1 shadow-md">
                                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                            {isReturnTrip ? 'START' : 'PICKUP'}
                                        </Text>
                                    </View>
                                    <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
                                        <Ionicons name="location" size={16} color="white" />
                                    </View>
                                </View>
                            </Marker>
                        )}

                        {Number(booking?.dropLatitude || (isReturnTrip ? params.pLat : params.dLat)) !== 0 && (
                            <Marker
                                tracksViewChanges={false}
                                coordinate={{
                                    latitude: Number(isReturnTrip ? (booking?.pickupLatitude || params.pLat) : (booking?.dropLatitude || params.dLat)) || 0,
                                    longitude: Number(isReturnTrip ? (booking?.pickupLongitude || params.pLon) : (booking?.dropLongitude || params.dLon)) || 0
                                }}
                            >
                                <View className="items-center">
                                    <View className="bg-red-500 px-2 py-0.5 rounded mb-1 shadow-md">
                                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                            {isReturnTrip ? 'HOME' : 'DROP'}
                                        </Text>
                                    </View>
                                    <View className="bg-red-600 p-2 rounded-full border-2 border-white shadow-lg">
                                        <Ionicons name="flag" size={18} color="white" />
                                    </View>
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

            {/* --- TOP BAR (NAVIGATION) --- */}
            <View className="absolute top-0 w-full z-10 pt-12 px-4">
                <View className="bg-[#0F172A] p-4 rounded-2xl shadow-2xl border border-slate-700/50 flex-row">
                    <View className="mr-4 bg-slate-800 p-3 rounded-xl items-center justify-center border border-slate-700">
                        <Ionicons name="arrow-redo" size={32} color="#FFF" />
                        <Text className="text-white text-[10px] font-bold mt-1">{Number(distance.split(' ')[0]) < 1 ? Math.round(Number(distance.split(' ')[0]) * 1000) + 'm' : distance}</Text>
                    </View>
                    <View className="flex-1 justify-center">
                        <Text className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mb-1">Navigation To</Text>
                        <Text className="text-white text-base font-black leading-6" numberOfLines={3}>
                            {isReturnTrip ? (booking?.pickupLocation || 'Original Pickup') : (booking?.dropLocation || 'Your Destination')}
                        </Text>
                    </View>
                </View>

                {/* Penalty / Return Status Indicator */}
                {hasReturnTrip && (
                    <View className="bg-[#FFD700] p-3 rounded-xl mt-4 border border-yellow-600 shadow-lg flex-row items-center justify-between">
                        <View>
                            <Text className="text-[#0F172A] font-black text-sm uppercase">Return Trip Active</Text>
                            {Number(penaltyAmount) > 0 && (
                                <Text className="text-red-600 font-bold text-xs mt-1">
                                    Penalty Added: ₹{penaltyAmount}
                                </Text>
                            )}
                        </View>
                        <Ionicons name="repeat" size={24} color="#0F172A" />
                    </View>
                )}
            </View>

            {/* --- BOTTOM SHEET (RIDE CONTROLS) --- */}
            <Animated.View
                style={[{ position: 'absolute', bottom: 0, width: '100%', zIndex: 20 }, animatedSheetStyle]}
            >
                <GestureDetector gesture={gesture}>
                    <View
                        onLayout={(e) => {
                            const { height: h } = e.nativeEvent.layout;
                            if (h > 0 && Math.abs(sheetHeight.value - h) > 1) {
                                sheetHeight.value = h;
                            }
                        }}
                        style={{ paddingBottom: insets.bottom + 20, minHeight: SHEET_MIN_HEIGHT }}
                        className="bg-[#0F172A] rounded-t-[40px] px-6 pt-4 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50"
                    >
                        {/* Handle Indicator */}
                        <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-4 opacity-50" />

                        {/* Collapsed view info */}
                        <View className="flex-row items-center justify-between mb-4">
                            <View className="flex-row items-center flex-1">
                                <View className="w-10 h-10 bg-slate-700 rounded-full items-center justify-center border border-slate-600 overflow-hidden">
                                    {booking?.user?.profileImage ? (
                                        <Image source={{ uri: booking.user.profileImage }} className="w-full h-full" />
                                    ) : (
                                        <Text className="text-lg">👤</Text>
                                    )}
                                </View>
                                <View className="ml-3">
                                    <Text className="text-white font-bold">{booking?.user?.name || 'Passenger'}</Text>
                                    <Text className="text-slate-400 text-[10px] uppercase font-bold">{eta} • {distance}</Text>
                                </View>
                            </View>
                            <View className="bg-red-500/20 px-3 py-1 rounded-lg border border-red-500/30">
                                <Text className="text-red-400 font-bold text-[10px] uppercase tracking-wider">LIVE TRIP</Text>
                            </View>
                        </View>

                        <Animated.View style={animatedContentOpacity}>
                            <View className="h-[1px] bg-slate-800 w-full mb-6" />

                            {/* Ride Progress */}
                            <View className="flex-row justify-between items-end mb-6">
                                <View>
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Time Remaining</Text>
                                    <Text className="text-white text-4xl font-black italic">{eta.split(' ')[0]} <Text className="text-lg text-slate-500 not-italic">{eta.split(' ')[1] || 'min'}</Text></Text>
                                </View>
                                <View className="items-end">
                                    <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Distance</Text>
                                    <Text className="text-white text-xl font-bold">{distance}</Text>
                                </View>
                            </View>

                            {/* LIVE BILLING CARD */}
                            <View className="bg-slate-800/50 rounded-3xl p-5 mb-6 border border-slate-700">
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Live Billing</Text>
                                    <View className="bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                                        <Text className="text-green-400 text-[9px] font-black uppercase">Active</Text>
                                    </View>
                                </View>

                                <View className="flex-row justify-between items-center mb-3">
                                    <View className="flex-row items-center flex-1">
                                        <View className="w-6 h-6 rounded-full bg-blue-500/20 items-center justify-center mr-2">
                                            <Ionicons name="car-outline" size={12} color="#3b82f6" />
                                        </View>
                                        <View>
                                            <Text className="text-slate-300 text-sm">
                                                {booking?.hasReturnTrip || Number(booking?.returnTripFare) > 0 ? 'Base Fare (Leg 1)' : 'Ride Fare'}
                                            </Text>
                                            {booking?.firstLegPaid && (
                                                <Text className="text-green-500 text-[9px] font-black uppercase tracking-wider">✓ Paid</Text>
                                            )}
                                        </View>
                                    </View>
                                    <Text className={`text-sm font-bold ${booking?.firstLegPaid ? 'text-green-500' : 'text-white'}`}>₹{booking?.baseFare || Math.max(0, Number(booking?.fare || 0) - Number(booking?.nightSurcharge || 0))}</Text>
                                </View>

                                {(Number(booking?.nightSurcharge) > 0) && (
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-6 h-6 rounded-full bg-indigo-500/20 items-center justify-center mr-2">
                                                <Ionicons name="moon" size={12} color="#6366f1" />
                                            </View>
                                            <View>
                                                <Text className="text-indigo-400 text-sm font-bold">Night Surcharge</Text>
                                                {booking?.firstLegPaid && (
                                                    <Text className="text-green-500 text-[9px] font-black uppercase tracking-wider">✓ Paid</Text>
                                                )}
                                            </View>
                                        </View>
                                        <Text className={`text-sm font-bold ${booking?.firstLegPaid ? 'text-green-500' : 'text-indigo-400'}`}>+₹{booking?.nightSurcharge || 0}</Text>
                                    </View>
                                )}

                                {hasReturnTrip && (
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-6 h-6 rounded-full bg-purple-500/20 items-center justify-center mr-2">
                                                <Ionicons name="return-down-back" size={12} color="#a855f7" />
                                            </View>
                                            <View className="flex-row items-center">
                                            <Text className="text-slate-300 text-sm italic">Leg 2 (Return)</Text>
                                            {isReturnTrip && (
                                                <View className="bg-green-500/20 px-1.5 py-0.5 rounded border border-green-500/30 ml-2">
                                                    <Text className="text-green-400 text-[8px] font-black uppercase">Active</Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>
                                    <Text className="text-white text-sm font-bold">₹{booking?.returnTripFare || 0}</Text>
                                    </View>
                                )}

                                {Number(penaltyAmount) > 0 && (
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-2">
                                                <Ionicons name="time-outline" size={12} color="#ef4444" />
                                            </View>
                                            <Text className="text-red-400 text-sm font-bold">Waiting Penalty</Text>
                                        </View>
                                        <Text className="text-red-400 text-sm font-bold">+₹{penaltyAmount}</Text>
                                    </View>
                                )}

                                {(Number(tollAmount) > 0) && (
                                    <View className="flex-row justify-between items-center mb-3">
                                        <View className="flex-row items-center flex-1">
                                            <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2">
                                                <Ionicons name="cash-outline" size={12} color="#f59e0b" />
                                            </View>
                                            <Text className="text-amber-400 text-sm font-bold">Toll Charges</Text>
                                        </View>
                                        <Text className="text-amber-400 text-sm font-bold">+₹{tollAmount || 0}</Text>
                                    </View>
                                )}
                                <View className="flex-row items-center gap-2 mb-3">
                                    <TextInput
                                        className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
                                        placeholder="Add Manual Toll (₹)"
                                        placeholderTextColor="#64748b"
                                        keyboardType="numeric"
                                        value={tollInput}
                                        onChangeText={setTollInput}
                                    />
                                    <TouchableOpacity 
                                        onPress={handleApplyManualToll}
                                        className="bg-amber-500/20 border border-amber-500/30 px-3 py-2 rounded-xl"
                                    >
                                        <Text className="text-amber-400 font-bold text-[10px] uppercase">Add Toll</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity 
                                        onPress={handleClearToll}
                                        className="bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-xl"
                                    >
                                        <Text className="text-red-400 font-bold text-[10px] uppercase">Clear</Text>
                                    </TouchableOpacity>
                                </View>

                                <View className="h-[1px] bg-slate-700/50 w-full my-3" />

                                <View className="flex-row justify-between items-center">
                                    <Text className="text-white font-bold">Estimated Total</Text>
                                    <Text className="text-[#FFD700] text-xl font-black italic">₹{(booking?.fare || 0) + (hasReturnTrip ? (booking?.returnTripFare || 0) : 0) + Number(penaltyAmount) + Number(tollAmount)}</Text>
                                </View>
                            </View>

                            {/* End Ride / Start Return Buttons */}
                            <TouchableOpacity
                                onPress={hasReturnTrip ? (isReturnTrip ? handleEndRide : handleEndLeg1) : handleEndRide}
                                className={`w-full py-5 rounded-2xl items-center flex-row justify-center shadow-xl ${hasReturnTrip ? (isReturnTrip ? 'bg-red-500' : 'bg-purple-600') : 'bg-red-500'}`}
                            >
                                <Ionicons name={hasReturnTrip ? (isReturnTrip ? "flag" : "repeat") : "flag"} size={24} color="white" style={{ marginRight: 10 }} />
                                <Text className="text-white font-black text-lg uppercase tracking-wider">
                                    {hasReturnTrip ? (isReturnTrip ? 'Complete Return Trip' : 'Arrived at Destination') : 'End Ride'}
                                </Text>
                            </TouchableOpacity>

                        </Animated.View>
                    </View>
                </GestureDetector>
            </Animated.View>
        </View>
    );
}
