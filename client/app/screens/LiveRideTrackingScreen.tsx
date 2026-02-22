import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert, Image, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from "expo-router";
import ReturnTripOfferModal from '../../components/ReturnTripOfferModal';
import { bookingAPI, locationAPI } from '../../utils/api';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getSocket, initSocket } from '../../utils/socket';
import { userAPI } from '../../utils/api';
import { showToast } from '../../components/NotificationToast';

const { width, height } = Dimensions.get('window');

type RideStatus = 'accepted' | 'arrived' | 'started' | 'waiting' | 'return_ride_started' | 'completed' | 'cancelled';

const LiveRideTrackingScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const bookingId = params.bookingId as string;

    const [showReturnOffer, setShowReturnOffer] = useState(false);
    const [isAcceptingReturn, setIsAcceptingReturn] = useState(false);
    const [booking, setBooking] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [region, setRegion] = useState<any>(null);
    const [currentStatus, setCurrentStatus] = useState<RideStatus>('accepted');
    const [distance, setDistance] = useState<string>("---");
    const [eta, setEta] = useState<string>("---");

    // Waiting State
    const [waitingSecondsElapsed, setWaitingSecondsElapsed] = useState(0);

    // Refs to avoid stale closures in socket listeners
    const currentStatusRef = useRef<RideStatus>('accepted');
    const bookingRef = useRef<any>(null);

    const fetchInitialData = useCallback(async () => {
        try {
            if (bookingId) {
                const res = await bookingAPI.getBookingStatus(bookingId);
                if (res.data && res.data.success) {
                    const b = res.data.booking;
                    setBooking(b);
                    bookingRef.current = b;
                    const status = b.status as RideStatus;
                    setCurrentStatus(status);
                    currentStatusRef.current = status;

                    if (b.status === 'waiting' && b.waitingStartedAt) {
                        const start = new Date(b.waitingStartedAt).getTime();
                        const now = new Date().getTime();
                        setWaitingSecondsElapsed(Math.floor((now - start) / 1000));
                    }

                    // Initialize driver location if available
                    if (b.driver && b.driver.latitude !== undefined && b.driver.longitude !== undefined) {
                        setDriverLocation({
                            latitude: Number(b.driver.latitude),
                            longitude: Number(b.driver.longitude)
                        });
                    }

                    // Set initial region based on driver OR pickup
                    const initialLat = (b.driver && b.driver.latitude !== undefined) ? Number(b.driver.latitude) : Number(b.pickupLatitude);
                    const initialLon = (b.driver && b.driver.longitude !== undefined) ? Number(b.driver.longitude) : Number(b.pickupLongitude);

                    if (!isNaN(initialLat) && !isNaN(initialLon) && initialLat !== 0 && initialLon !== 0) {
                        setRegion({
                            latitude: initialLat,
                            longitude: initialLon,
                            latitudeDelta: 0.05,
                            longitudeDelta: 0.05
                        });
                    }

                    // --- Determine route based on status ---
                    const rideStatus = b.status;
                    const driverLat = b.driver?.latitude ? Number(b.driver.latitude) : null;
                    const driverLon = b.driver?.longitude ? Number(b.driver.longitude) : null;
                    const pickupLat = Number(b.pickupLatitude);
                    const pickupLon = Number(b.pickupLongitude);
                    const dropLat = Number(b.dropLatitude);
                    const dropLon = Number(b.dropLongitude);

                    let fromLat: number, fromLon: number, toRouteLat: number, toRouteLon: number;

                    if (rideStatus === 'return_ride_started') {
                        // Return leg: Full path Drop (Return start) → Pickup (Home)
                        fromLat = dropLat;
                        fromLon = dropLon;
                        toRouteLat = pickupLat;
                        toRouteLon = pickupLon;
                    } else if (['accepted', 'arrived'].includes(rideStatus)) {
                        if (driverLat && driverLon) {
                            // Pre-ride: route driver → pickup
                            fromLat = driverLat;
                            fromLon = driverLon;
                            toRouteLat = pickupLat;
                            toRouteLon = pickupLon;
                        } else {
                            // Fallback: show overview pickup → drop
                            fromLat = pickupLat;
                            fromLon = pickupLon;
                            toRouteLat = dropLat;
                            toRouteLon = dropLon;
                        }
                    } else {
                        // started/waiting: Full path Pickup → Drop
                        fromLat = pickupLat;
                        fromLon = pickupLon;
                        toRouteLat = dropLat;
                        toRouteLon = dropLon;
                    }

                    console.log('[TrackingScreen] Route:', rideStatus, fromLat, fromLon, '->', toRouteLat, toRouteLon);

                    if (fromLat && fromLon && toRouteLat && toRouteLon) {
                        locationAPI.getDirections(fromLat, fromLon, toRouteLat, toRouteLon).then(dirRes => {
                            if (dirRes.data?.data?.geometry && Array.isArray(dirRes.data.data.geometry.coordinates)) {
                                const coords = dirRes.data.data.geometry.coordinates
                                    .filter((c: any) => Array.isArray(c) && c.length >= 2 && c[1] !== null && c[0] !== null)
                                    .map((c: any) => ({
                                        latitude: Number(c[1]),
                                        longitude: Number(c[0])
                                    }));
                                if (coords.length > 0) setRouteCoords(coords);
                                if (dirRes.data.data.distanceKm) setDistance(`${dirRes.data.data.distanceKm} km`);
                                if (dirRes.data.data.duration) setEta(`${Math.ceil(dirRes.data.data.duration / 60)} min`);
                            }
                        }).catch(() => { });
                    }
                }
            }
        } catch (error) {
            console.error("Tracking Error:", error);
        }
    }, [bookingId]);

    const [socketReady, setSocketReady] = useState(false);
    const lastSocketRef = useRef<any>(null);

    useEffect(() => {
        let isMounted = true;
        const setup = async () => {
            await fetchInitialData();
            if (!isMounted) return;

            try {
                const s = await initSocket();
                const profile = await userAPI.getProfile();
                const userId = profile.data?.user?._id || profile.data?.user?.id;

                if (userId && s) {
                    s.emit("join", userId);
                    lastSocketRef.current = s;
                    setSocketReady(true);
                }
            } catch (err) { console.warn("Socket join failed", err); }
        };
        setup();
        return () => { isMounted = false; };
    }, [fetchInitialData]);

    const handleAcceptReturn = async () => {
        console.log("[Return] handleAcceptReturn called. Current state:", { isAcceptingReturn, bookingId });
        if (isAcceptingReturn) {
            console.log("[Return] Already accepting, ignoring click.");
            return;
        }
        try {
            if (bookingId) {
                setIsAcceptingReturn(true);
                console.log("[Return] Calling API...");
                const res = await bookingAPI.acceptReturnOffer(bookingId);
                console.log("[Return] API response:", res.data);

                setShowReturnOffer(false);
                showToast("Offer Accepted", "Return trip has been added to your ride.", "success");

                // Refresh booking data to show return fare in breakdown
                fetchInitialData();
            } else {
                console.warn("[Return] No bookingId found in handleAcceptReturn");
            }
        } catch (error) {
            console.error("Failed to accept return offer:", error);
            showToast("Error", "Could not accept offer. Please try again.", "error");
        } finally {
            setIsAcceptingReturn(false);
        }
    };

    // Active Socket Listeners
    useEffect(() => {
        const socket = lastSocketRef.current;
        if (!socket || !socketReady) return;

        console.log(`[Socket] Registering tracking listeners for booking: ${bookingId}`);

        const onWaitingStarted = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Waiting Started');
                setCurrentStatus('waiting');
                currentStatusRef.current = 'waiting';
                setWaitingSecondsElapsed(0);
                fetchInitialData();
            }
        };

        const onPenaltyApplied = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Penalty Applied:', data.penaltyApplied);
                setBooking((prev: any) => ({
                    ...prev,
                    penaltyApplied: data.penaltyApplied,
                }));
            }
        };

        const onLocationUpdate = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                const newLat = Number(data.latitude);
                const newLon = Number(data.longitude);
                setDriverLocation({ latitude: newLat, longitude: newLon });

                const _status = currentStatusRef.current;
                const _booking = bookingRef.current;

                if (['accepted', 'arrived', 'pending'].includes(_status)) {
                    const targetLat = Number(_booking?.pickupLatitude);
                    const targetLon = Number(_booking?.pickupLongitude);

                    if (newLat && newLon && targetLat && targetLon) {
                        locationAPI.getDirections(newLat, newLon, targetLat, targetLon).then(res => {
                            if (res.data?.data) {
                                if (res.data.data.distanceKm) setDistance(`${res.data.data.distanceKm} km`);
                                if (res.data.data.duration) setEta(`${Math.ceil(res.data.data.duration / 60)} min`);

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
            }
        };

        const onStatusUpdate = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Status Update:', data.status);
                const oldStatus = currentStatusRef.current;
                setCurrentStatus(data.status);
                currentStatusRef.current = data.status;
                fetchInitialData();

                if (data.status === 'arrived' && oldStatus !== 'arrived') {
                    showToast("🚗 Driver Arrived!", "Your driver has arrived at the pickup location.");
                }

                if (data.status === 'completed') {
                    router.replace({
                        pathname: "/screens/RideCompletionScreen",
                        params: {
                            bookingId: bookingId,
                            fare: data.fare,
                            totalFare: data.totalFare,
                            distance: data.distance,
                            pickup: bookingRef.current?.pickupLocation,
                            drop: bookingRef.current?.dropLocation
                        }
                    });
                }
            }
        };

        const onSuggestReturn = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Suggest Return Offer');
                setShowReturnOffer(true);
                showToast("Special Offer! 📉", "Get 60% OFF on your return trip. Accept now to save!");
            }
        };

        const onDriverArrived = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Driver Arrived (Specific Event)');
                if (currentStatusRef.current !== 'arrived') {
                    setCurrentStatus('arrived');
                    currentStatusRef.current = 'arrived';
                    showToast("🚗 Driver Arrived!", "Your driver has arrived at the pickup location.");
                    fetchInitialData();
                }
            }
        };

        socket.on("waitingStarted", onWaitingStarted);
        socket.on("penaltyApplied", onPenaltyApplied);
        socket.on("driverLocationUpdate", onLocationUpdate);
        socket.on("rideStatusUpdate", onStatusUpdate);
        socket.on("suggestReturnTrip", onSuggestReturn);
        socket.on("driverArrived", onDriverArrived);

        return () => {
            console.log(`[Socket] Cleaning up tracking listeners for booking: ${bookingId}`);
            socket.off("waitingStarted", onWaitingStarted);
            socket.off("penaltyApplied", onPenaltyApplied);
            socket.off("driverLocationUpdate", onLocationUpdate);
            socket.off("rideStatusUpdate", onStatusUpdate);
            socket.off("suggestReturnTrip", onSuggestReturn);
            socket.off("driverArrived", onDriverArrived);
        };
    }, [socketReady, bookingId, fetchInitialData]);

    // Timer for waiting
    useEffect(() => {
        if (currentStatus === 'waiting') {
            const timer = setInterval(() => {
                setWaitingSecondsElapsed(prev => {
                    const next = prev + 1;
                    // Force refresh when we cross the limit + 1 second, or every minute
                    if (next === (booking?.waitingLimit || 3600) + 1 || (next > (booking?.waitingLimit || 3600) && next % 60 === 0)) {
                        fetchInitialData();
                    }
                    return next;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [currentStatus, booking?.waitingLimit, fetchInitialData]);

    // Format Helpers
    const formatTime = (totalSeconds: number) => {
        const absSeconds = Math.abs(totalSeconds);
        const h = Math.floor(absSeconds / 3600);
        const m = Math.floor((absSeconds % 3600) / 60);
        const s = absSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const waitingLimit = booking?.waitingLimit || 3600;
    const remainingSeconds = waitingLimit - waitingSecondsElapsed;
    const isPenaltyActive = remainingSeconds < 0;

    const getStatusConfig = () => {
        switch (currentStatus) {
            case 'arrived': return { text: 'Driver has arrived', color: 'bg-green-500', icon: 'checkmark-circle' as const };
            case 'started': return { text: 'Ride in progress', color: 'bg-blue-500', icon: 'navigate-circle' as const };
            case 'waiting': return { text: 'Driver is waiting', color: 'bg-orange-500', icon: 'time' as const };
            case 'return_ride_started': return { text: 'Return trip started', color: 'bg-purple-500', icon: 'repeat' as const };
            default: return { text: 'Driver is on the way', color: 'bg-[#FFD700]', icon: 'car' as const };
        }
    };

    const statusConfig = getStatusConfig();

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <View className="flex-[3] bg-slate-200 relative">
                {region ? (
                    <MapView style={{ width, height: height * 0.6 }} region={region} provider={PROVIDER_GOOGLE}>
                        {routeCoords.length > 0 && <Polyline coordinates={routeCoords} strokeWidth={5} strokeColor="#3b82f6" />}
                        {booking && (
                            <>
                                {/* Pickup / Return-Start Marker */}
                                {Number(booking.pickupLatitude) !== 0 && Number(booking.pickupLongitude) !== 0 && (
                                    <Marker coordinate={{
                                        latitude: Number(currentStatus === 'return_ride_started' ? booking.dropLatitude : booking.pickupLatitude) || 0,
                                        longitude: Number(currentStatus === 'return_ride_started' ? booking.dropLongitude : booking.pickupLongitude) || 0
                                    }}>
                                        <View className="items-center">
                                            <View className="bg-[#FFD700] px-2 py-0.5 rounded mb-1 shadow-md">
                                                <Text className="text-black text-[9px] font-black uppercase tracking-widest">
                                                    {currentStatus === 'return_ride_started' ? 'START' : 'PICKUP'}
                                                </Text>
                                            </View>
                                            <View className="bg-blue-600 p-2.5 rounded-full border-2 border-white shadow-lg">
                                                <Ionicons name="location" size={18} color="white" />
                                            </View>
                                        </View>
                                    </Marker>
                                )}

                                {/* Drop / Return-End Marker */}
                                {Number(booking.dropLatitude) !== 0 && Number(booking.dropLongitude) !== 0 && (
                                    <Marker coordinate={{
                                        latitude: Number(currentStatus === 'return_ride_started' ? booking.pickupLatitude : booking.dropLatitude) || 0,
                                        longitude: Number(currentStatus === 'return_ride_started' ? booking.pickupLongitude : booking.dropLongitude) || 0
                                    }}>
                                        <View className="items-center">
                                            <View className="bg-red-500 px-2 py-0.5 rounded mb-1 shadow-md">
                                                <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                                    {currentStatus === 'return_ride_started' ? 'HOME' : 'DROP'}
                                                </Text>
                                            </View>
                                            <View className="bg-green-600 p-2.5 rounded-full border-2 border-white shadow-lg">
                                                <Ionicons name="flag" size={18} color="white" />
                                            </View>
                                        </View>
                                    </Marker>
                                )}
                            </>
                        )}
                        {driverLocation && (
                            <Marker coordinate={driverLocation}>
                                <View className="bg-slate-900 p-2 rounded-full border-2 border-white shadow-2xl"><Ionicons name="car-sport" size={20} color="#FFD700" /></View>
                            </Marker>
                        )}
                    </MapView>
                ) : (
                    <View className="flex-1 items-center justify-center"><Text className="text-slate-400 font-bold">Loading Map...</Text></View>
                )}

                <SafeAreaView className="absolute top-0 left-0 right-0 p-4">
                    <View className="flex-row justify-between items-start">
                        <TouchableOpacity onPress={() => router.replace("/screens/HomeScreen")} className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-lg"><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>

                        <View className="bg-white rounded-2xl shadow-xl p-1.5 flex-row items-center">
                            <View className="bg-[#FFD700] px-4 py-2 rounded-xl items-center justify-center mr-3">
                                <Text className="text-[10px] font-black text-slate-800 uppercase tracking-wider">otp</Text>
                                <Text className="text-xl font-black text-black leading-5">{booking?.otp || '----'}</Text>
                            </View>
                            {currentStatus === 'waiting' ? (
                                <View className="px-4 py-1">
                                    <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isPenaltyActive ? 'Overdue' : 'Free Wait'}</Text>
                                    <Text className={`text-lg font-black ${isPenaltyActive ? 'text-red-500' : 'text-slate-900'}`}>{formatTime(remainingSeconds)}</Text>
                                </View>
                            ) : (
                                <>
                                    <View className="px-4 py-1 border-r border-slate-100">
                                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            {currentStatus === 'return_ride_started' ? 'Heading Home' : (currentStatus === 'arrived' ? 'Reached' : 'Arriving')}
                                        </Text>
                                        <Text className="text-lg font-black text-slate-900">
                                            {currentStatus === 'return_ride_started' ? eta : (currentStatus === 'arrived' ? 'At Pickup' : eta)}
                                        </Text>
                                    </View>
                                    <View className="pr-4 py-1 ml-3">
                                        <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dist</Text>
                                        <Text className="text-lg font-black text-slate-900">{distance}</Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <View className="flex-[2] bg-white rounded-t-[35px] -mt-8 shadow-2xl px-6 py-4">
                <View className="items-center mb-3"><View className="w-12 h-1 bg-slate-200 rounded-full" /></View>

                {currentStatus === 'waiting' && (
                    <Animated.View entering={FadeIn} className={`${isPenaltyActive ? 'bg-red-500' : 'bg-orange-500'} p-3 rounded-2xl mb-4 flex-row items-center justify-between shadow-md`}>
                        <View className="flex-row items-center flex-1">
                            <Ionicons name="time" size={20} color="white" />
                            <View className="ml-2">
                                <Text className="text-white text-sm font-black">{isPenaltyActive ? 'PENALTY ACTIVE' : 'WAITING FOR YOU'}</Text>
                                <Text className="text-white/80 text-[10px] font-bold">Wait Penalty: ₹100/Hour after free limit</Text>
                            </View>
                        </View>
                        {isPenaltyActive && (
                            <Text className="text-white font-black text-base">+₹{booking?.penaltyApplied || 0}</Text>
                        )}
                    </Animated.View>
                )}

                {!isPenaltyActive && currentStatus !== 'waiting' && (
                    <View className={`${statusConfig.color} p-3 rounded-2xl mb-4 flex-row items-center`}><Ionicons name={statusConfig.icon} size={20} color="black" /><Text className="text-black text-sm font-black ml-2">{statusConfig.text}</Text></View>
                )}

                {/* RETURN TRIP BANNER */}
                {currentStatus === 'return_ride_started' && (
                    <View className="bg-purple-600 p-2.5 rounded-2xl mb-3 flex-row items-center">
                        <Ionicons name="repeat" size={16} color="white" />
                        <Text className="text-white text-xs font-black ml-2">↩ RETURN TRIP — Heading back to pickup</Text>
                    </View>
                )}

                {/* TRIP ROUTE DETAILS */}
                <View className="mb-4 bg-slate-50 rounded-2xl p-3 border border-slate-100 space-y-3">
                    {/* FROM row */}
                    <View className="flex-row items-start">
                        <View className="w-7 h-7 rounded-full bg-green-100 items-center justify-center mr-3 mt-0.5">
                            <Ionicons name="radio-button-on" size={14} color="#22c55e" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-0.5">
                                {currentStatus === 'return_ride_started' ? 'STARTING FROM (DROP POINT)' : 'PICKUP'}
                            </Text>
                            <Text className="text-slate-800 text-xs font-bold leading-4" numberOfLines={2}>
                                {currentStatus === 'return_ride_started'
                                    ? (booking?.dropLocation || 'Your Location')
                                    : (booking?.pickupLocation || 'Pickup Location')}
                            </Text>
                        </View>
                    </View>

                    <View className="w-[1px] h-4 bg-slate-200 ml-[13px]" />

                    {/* TO row */}
                    <View className="flex-row items-start">
                        <View className="w-7 h-7 rounded-full bg-red-100 items-center justify-center mr-3 mt-0.5">
                            <Ionicons name="location" size={14} color="#ef4444" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-0.5">
                                {currentStatus === 'return_ride_started' ? 'DESTINATION (HOME)' : 'DROP'}
                            </Text>
                            <Text className="text-slate-800 text-xs font-bold leading-4" numberOfLines={2}>
                                {currentStatus === 'return_ride_started'
                                    ? (booking?.pickupLocation || 'Return Destination')
                                    : (booking?.dropLocation || 'Drop Location')}
                            </Text>
                        </View>
                    </View>
                </View>

                <View className="bg-slate-50 p-3 rounded-2xl mb-4 border border-slate-100">
                    <View className="flex-row items-center">
                        <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                            {booking?.driver?.profileImage ? <Image source={{ uri: booking.driver.profileImage }} className="w-full h-full" /> : <Ionicons name="person" size={24} color="#64748B" />}
                        </View>
                        <View className="ml-3 flex-1">
                            <Text className="text-slate-900 text-base font-black">{booking?.driver?.name || 'Driver'}</Text>
                            <Text className="text-slate-500 text-xs font-bold">{booking?.driver?.vehicleModel || 'Car'} • {booking?.driver?.vehicleNumber || '----'}</Text>
                        </View>
                        <View className="flex-row items-center bg-slate-900 px-2 py-1 rounded-full"><Ionicons name="star" size={10} color="#FFD700" /><Text className="text-white text-xs font-bold ml-1">{booking?.driver?.rating?.toFixed(1) || '5.0'}</Text></View>
                    </View>
                </View>

                <View className="flex-row gap-3 mb-3">
                    <TouchableOpacity onPress={() => booking?.driver?.mobile && Linking.openURL(`tel:${booking.driver.mobile}`)} className="flex-1 bg-green-500 py-3 rounded-2xl items-center flex-row justify-center shadow-lg"><Ionicons name="call" size={18} color="white" /><Text className="text-white font-black text-sm ml-2">CALL</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => router.push({ pathname: "/screens/ChatScreen", params: { bookingId, driverName: booking?.driver?.name || 'Driver' } })} className="bg-blue-500 w-12 h-12 rounded-2xl items-center justify-center shadow-lg"><Ionicons name="chatbubble-ellipses" size={20} color="white" /></TouchableOpacity>

                    {['pending', 'accepted', 'driver_assigned', 'arrived'].includes(currentStatus) && (
                        <TouchableOpacity
                            onPress={() => Alert.alert("Cancel Ride", "Are you sure?", [{ text: "No" }, { text: "Yes", onPress: () => bookingAPI.cancelBooking(bookingId).then(() => router.replace("/screens/HomeScreen")) }])}
                            className="bg-red-500 w-12 h-12 rounded-2xl items-center justify-center shadow-lg"
                        >
                            <Ionicons name="close" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>

                <View className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex-1">
                    <Text className="text-slate-400 text-[10px] uppercase font-black tracking-widest mb-2">Fare Breakdown</Text>

                    <View className="flex-row justify-between mb-1.5">
                        <Text className="text-slate-600 text-xs font-bold">Base Trip</Text>
                        <Text className="text-slate-900 text-sm font-black">₹{Number(booking?.fare || 0)}</Text>
                    </View>

                    {booking?.hasReturnTrip && (
                        <View className="flex-row justify-between mb-1.5">
                            <View className="flex-row items-center">
                                <Text className="text-blue-600 text-xs font-bold">Return Trip </Text>
                                <View className="bg-blue-100 px-1 py-0.5 rounded-md">
                                    <Text className="text-blue-700 text-[7px] font-black italic">60% OFF</Text>
                                </View>
                            </View>
                            <Text className="text-blue-600 text-sm font-black">+₹{booking?.returnTripFare || 0}</Text>
                        </View>
                    )}

                    {isPenaltyActive && (
                        <View className="flex-row justify-between mb-1.5">
                            <Text className="text-red-500 text-xs font-bold">Waiting Charges</Text>
                            <Text className="text-red-500 text-sm font-black">+₹{booking?.penaltyApplied || 0}</Text>
                        </View>
                    )}

                    <View className="border-t border-slate-100 mt-2 pt-2 flex-row justify-between items-center">
                        <View>
                            <Text className="text-slate-900 text-sm font-black">Total Amount</Text>
                            <Text className="text-slate-400 text-[8px] font-bold italic uppercase">{booking?.paymentMethod || 'Cash'}</Text>
                        </View>
                        <Text className="text-[#000] text-xl font-black italic">₹{booking?.totalFare || (Number(booking?.fare || 0) + Number(booking?.returnTripFare || 0) + Number(booking?.penaltyApplied || 0))}</Text>
                    </View>
                </View>
            </View>

            {showReturnOffer && !['completed', 'cancelled'].includes(currentStatus) && (
                <ReturnTripOfferModal
                    isVisible={showReturnOffer}
                    isAccepting={isAcceptingReturn}
                    waitingLimitMins={Math.round((Number(booking?.distance) || 5) * 12)}
                    onClose={() => setShowReturnOffer(false)}
                    onAccept={handleAcceptReturn}
                />
            )}
        </View>
    );
};

export default LiveRideTrackingScreen;
