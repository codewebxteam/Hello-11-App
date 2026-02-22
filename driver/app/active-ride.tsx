import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image, StatusBar as RNStatusBar, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { driverAPI, locationAPI } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function ActiveRideScreen() {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [booking, setBooking] = React.useState<any>(null);

    // Check if this is a return trip or if coming back from waiting
    const isReturnTrip = params.mode === 'return';
    // penaltyAmount: use live state (updated by API and socket), fallback to params
    const [penaltyAmount, setPenaltyAmount] = React.useState<number>(params.penalty ? Number(params.penalty) : 0);

    const bookingId = params.bookingId as string;
    const distanceKm = params.distance ? parseFloat(params.distance as string) : 12.4;

    const [hasReturnTrip, setHasReturnTrip] = React.useState(false);
    const [routeCoords, setRouteCoords] = React.useState<any[]>([]);
    const [region, setRegion] = React.useState<any>(null);
    const [distance, setDistance] = React.useState<string>("---");
    const [eta, setEta] = React.useState<string>("---");

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
                        setRegion((prev: any) => ({
                            latitude: latitude,
                            longitude: longitude,
                            latitudeDelta: prev?.latitudeDelta || 0.05,
                            longitudeDelta: prev?.longitudeDelta || 0.05,
                        }));

                        // Update backend
                        driverAPI.updateLocation({ latitude, longitude }).catch(err =>
                            console.log("Failed to update driver location:", err)
                        );

                        // Update Route dynamically to target (Drop-off normally, Pickup for return)
                        const targetLat = isReturnTrip ? Number(booking?.pickupLatitude) : Number(booking?.dropLatitude);
                        const targetLon = isReturnTrip ? Number(booking?.pickupLongitude) : Number(booking?.dropLongitude);

                        if (targetLat && targetLon) {
                            locationAPI.getDirections(latitude, longitude, targetLat, targetLon)
                                .then(res => {
                                    if (res.data?.data) {
                                        setDistance(`${res.data.data.distanceKm} km`);
                                        const etaMin = Math.ceil(res.data.data.duration / 60);
                                        setEta(`${etaMin} min`);

                                        if (res.data.data.geometry && Array.isArray(res.data.data.geometry.coordinates)) {
                                            const coords = res.data.data.geometry.coordinates
                                                .filter((c: any) => Array.isArray(c) && c.length >= 2 && c[1] !== null && c[0] !== null)
                                                .map((c: any) => ({
                                                    latitude: Number(c[1]),
                                                    longitude: Number(c[0])
                                                }));
                                            if (coords.length > 0) setRouteCoords(coords);
                                        }
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
            } catch (error) {
                console.error("Error fetching booking or route:", error);
            }
        };

        startTracking();
        fetchBookingAndRoute();

        return () => {
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, [bookingId]);

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
            }
        };
        setupSocket();
    }, [bookingId]);

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
                                distance: distance.replace(' km', '') || distanceKm.toString(),
                                outboundDistance: (booking?.distance || 0).toString(),
                                time: eta.replace(' min', '') || '0',
                                baseFare: (booking?.fare || 0).toString(),
                                returnFare: (booking?.returnTripFare || 0).toString(),
                                pickup: booking?.pickupLocation || '',
                                drop: booking?.dropLocation || '',
                                isReturn: isReturnTrip ? 'true' : 'false'
                            }
                        });
                    }
                }
            ]
        );
    };

    const handleEndLeg1 = () => {
        Alert.alert(
            "Start Waiting?",
            "Begin the waiting timer for return trip?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Yes, Start Wait",
                    onPress: async () => {
                        try {
                            if (bookingId) {
                                const { driverAPI } = require("../utils/api");
                                await driverAPI.startWaiting(bookingId);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                // Navigate to Waiting Screen
                                router.push({
                                    pathname: "/waiting-for-return",
                                    params: {
                                        bookingId,
                                        distance: distanceKm.toString()
                                    }
                                });
                            }
                        } catch (error) {
                            console.error("Failed to start waiting:", error);
                            Alert.alert("Error", "Could not start waiting timer.");
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

                        {booking && (
                            <>
                                {/* Start Point Marker (Only relevant to show where you came from) */}
                                {Number(isReturnTrip ? booking.dropLatitude : booking.pickupLatitude) !== 0 && (
                                    <Marker
                                        coordinate={{
                                            latitude: Number(isReturnTrip ? (booking.dropLatitude || 0) : (booking.pickupLatitude || 0)) || 0,
                                            longitude: Number(isReturnTrip ? (booking.dropLongitude || 0) : (booking.pickupLongitude || 0)) || 0
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

                                {/* Destination Marker */}
                                {Number(isReturnTrip ? booking.pickupLatitude : booking.dropLatitude) !== 0 && (
                                    <Marker
                                        coordinate={{
                                            latitude: Number(isReturnTrip ? (booking.pickupLatitude || 0) : (booking.dropLatitude || 0)) || 0,
                                            longitude: Number(isReturnTrip ? (booking.pickupLongitude || 0) : (booking.dropLongitude || 0)) || 0
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
                            </>
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
            <View className="absolute bottom-0 w-full z-20">
                <View
                    style={{ paddingBottom: insets.bottom + 20 }}
                    className="bg-[#0F172A] rounded-t-[40px] px-6 pt-8 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50"
                >
                    {/* Handle Indicator */}
                    <View className="self-center w-12 h-1.5 bg-slate-700 rounded-full mb-8 opacity-50" />

                    {/* Ride Progress */}
                    <View className="flex-row justify-between items-end mb-6">
                        <View>
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Time Remaining</Text>
                            <Text className="text-white text-4xl font-black italic">{eta.split(' ')[0]} <Text className="text-lg text-slate-500 not-italic">{eta.split(' ')[1] || 'min'}</Text></Text>
                        </View>
                        <View className="items-end">
                            <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Distance</Text>
                            <Text className="text-white text-4xl font-black italic">{distance.split(' ')[0]} <Text className="text-lg text-slate-500 not-italic">{distance.split(' ')[1] || 'km'}</Text></Text>
                        </View>
                    </View>

                    {/* Destination Address */}
                    <View className="bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-700/50 flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-red-500/20 items-center justify-center border border-red-500/30 mr-4">
                            <Ionicons name="flag" size={20} color="#EF4444" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">
                                {isReturnTrip ? 'Return To (Original Pickup)' : 'Destination'}
                            </Text>
                            <Text className="text-white text-sm font-bold leading-5" numberOfLines={2}>
                                {isReturnTrip ? (booking?.pickupLocation || '---') : (booking?.dropLocation || '---')}
                            </Text>
                        </View>
                    </View>

                    {/* Fare Breakdown (Added for Transparency) */}
                    <View className="bg-slate-800/80 p-4 rounded-2xl mb-4 border border-slate-700">
                        <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-2">Itemized Fare</Text>

                        <View className="flex-row justify-between mb-1">
                            <Text className="text-slate-400 text-xs">Outbound Trip</Text>
                            <Text className="text-white text-sm font-bold">₹{booking?.fare || 0}</Text>
                        </View>

                        {booking?.hasReturnTrip && (
                            <View className="flex-row justify-between mb-1">
                                <View className="flex-row items-center">
                                    <Text className="text-blue-400 text-xs">Return Trip </Text>
                                    <View className="bg-blue-500/20 px-1 py-0.5 rounded ml-1">
                                        <Text className="text-blue-400 text-[8px] font-black italic">60% OFF</Text>
                                    </View>
                                </View>
                                <Text className="text-blue-400 text-sm font-bold">+₹{booking?.returnTripFare || 0}</Text>
                            </View>
                        )}

                        {Number(penaltyAmount) > 0 && (
                            <View className="flex-row justify-between mb-1">
                                <Text className="text-red-400 text-xs">Waiting Penalties</Text>
                                <Text className="text-red-400 text-sm font-bold">+₹{penaltyAmount}</Text>
                            </View>
                        )}

                        <View className="mt-2 pt-2 border-t border-slate-700 flex-row justify-between items-center">
                            <View>
                                <Text className="text-white text-base font-black italic tracking-wider">Total Collection</Text>
                                <Text className="text-slate-500 text-[8px] font-bold uppercase tracking-widest italic">{booking?.paymentMethod || 'Cash'}</Text>
                            </View>
                            <Text className="text-[#FFD700] text-2xl font-black italic">₹{(Number(booking?.fare || 0) + Number(booking?.returnTripFare || 0) + Number(penaltyAmount))}</Text>
                        </View>
                    </View>

                    <View className="h-[1px] bg-slate-800 w-full mb-8" />

                    {/* Passenger & End Ride */}
                    <View className="flex-row items-center justify-between mb-2">
                        <View className="flex-row items-center flex-1">
                            <View className="w-12 h-12 bg-slate-700 rounded-full items-center justify-center border-2 border-slate-600 mr-3 overflow-hidden">
                                {booking?.user?.profileImage ? (
                                    <Image source={{ uri: booking.user.profileImage }} className="w-full h-full" />
                                ) : (
                                    <Text className="text-xl">👤</Text>
                                )}
                            </View>
                            <View>
                                <Text className="text-white font-bold text-base">{booking?.user?.name || 'Passenger'}</Text>
                                <Text className="text-green-400 text-xs font-bold">Trip in Progress</Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            onPress={() => router.push({
                                pathname: "/chat",
                                params: {
                                    bookingId: bookingId,
                                    userName: booking?.user?.name || 'Passenger'
                                }
                            })}
                            className="w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center border border-blue-500 mr-2"
                        >
                            <Ionicons name="chatbubbles" size={24} color="white" />
                        </TouchableOpacity>

                        <TouchableOpacity className="w-12 h-12 bg-slate-800 rounded-2xl items-center justify-center border border-slate-700">
                            <Ionicons name="shield-checkmark" size={24} color="#CBD5E1" />
                        </TouchableOpacity>
                    </View>

                    {/* End Rides Buttons */}
                    <View className="mt-6 gap-4">
                        {/* Only show Wait for Return if NOT already in return mode AND user accepted it */}
                        {!isReturnTrip && hasReturnTrip && (
                            <TouchableOpacity
                                activeOpacity={0.9}
                                onPress={handleEndLeg1}
                                disabled={false}  // TODO: For production restore: disabled={distanceKm > 0.5}
                                className={`w-full py-4 rounded-[24px] items-center flex-row justify-center border bg-slate-700 border-slate-600`}
                            >
                                <Ionicons name="time" size={24} color={'#FFD700'} style={{ marginRight: 8 }} />
                                <Text className="text-white font-black text-lg tracking-[3px] uppercase">
                                    Wait for Return
                                </Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            activeOpacity={0.9}
                            onPress={handleEndRide}
                            className="w-full bg-red-500 py-5 rounded-[24px] items-center flex-row justify-center shadow-lg shadow-red-500/20"
                        >
                            <Ionicons name="stop-circle" size={24} color="#FFF" style={{ marginRight: 8 }} />
                            <Text className="text-white font-black text-lg tracking-[3px] uppercase">End Ride</Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </View>

        </View>
    );
}
