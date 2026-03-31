import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions, Alert, Image, Linking, Platform, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useRouter, useLocalSearchParams } from "expo-router";
import ReturnTripOfferModal from '../../components/ReturnTripOfferModal';
import PaymentPromptModal from '../../components/PaymentPromptModal';
import { bookingAPI, locationAPI } from '../../utils/api';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { getSocket, initSocket } from '../../utils/socket';
import { userAPI } from '../../utils/api';
import { showToast } from '../../components/NotificationToast';
import { sendLocalNotification } from '../../utils/notifications';
import { getImageUrl } from '../../utils/imagekit';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

type RideStatus = 'accepted' | 'arrived' | 'started' | 'waiting' | 'return_ride_started' | 'completed' | 'cancelled';

const LiveRideTrackingScreen = () => {
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const bookingId = params.bookingId as string;

    const [showReturnOffer, setShowReturnOffer] = useState(false);
    const [showPaymentPrompt, setShowPaymentPrompt] = useState(false);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const [isAcceptingReturn, setIsAcceptingReturn] = useState(false);
    const isAcceptingReturnRef = useRef(false);
    const [optimisticReturnBooked, setOptimisticReturnBooked] = useState(false);
    const [booking, setBooking] = useState<any>(null);
    const [driverLocation, setDriverLocation] = useState<any>(null);
    const [routeCoords, setRouteCoords] = useState<any[]>([]);
    const [region, setRegion] = useState<any>(() => {
        const { pLat, pLon, dLat, dLon } = params;
        if (pLat && pLon) {
            return {
                latitude: Number(pLat),
                longitude: Number(pLon),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            };
        }
        return null;
    });
    const [currentStatus, setCurrentStatus] = useState<RideStatus>('accepted');
    const [distance, setDistance] = useState<string>("---");
    const [eta, setEta] = useState<string>("---");
    const lastUpdateCoords = useRef<{ lat: number; lon: number } | null>(null);

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
                    // Join specific rooms for reliability
                    if (userId) s.emit("join", userId);
                    if (bookingId) s.emit("joinChat", bookingId); // Also joins the booking-specific room

                    // Re-join on reconnection
                    s.on("connect", () => {
                        console.log("[Socket] Reconnected, re-joining rooms...");
                        if (userId) s.emit("join", userId);
                        if (bookingId) s.emit("joinChat", bookingId);
                    });
                    lastSocketRef.current = s;
                    setSocketReady(true);
                }
            } catch (err) { console.warn("Socket join failed", err); }
        };
        setup();
        return () => { isMounted = false; };
    }, [fetchInitialData]);

    // --- BACK BUTTON HANDLING ---
    useEffect(() => {
        const backAction = () => {
            router.replace("/screens/HomeScreen");
            return true;
        };
        const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
        return () => backHandler.remove();
    }, []);

    const handleAcceptReturn = async () => {
        if (isAcceptingReturnRef.current || isAcceptingReturn) {
            console.log("[Return] Already accepting (Lock active), ignoring click.");
            return;
        }

        try {
            // Optimistic UI: mark return as booked immediately
            setOptimisticReturnBooked(true);
            setBooking((prev: any) => prev ? { ...prev, hasReturnTrip: true } : prev);

            if (bookingId) {
                isAcceptingReturnRef.current = true;
                setIsAcceptingReturn(true);
                console.log("[Return] Calling API...");

                const res = await bookingAPI.acceptReturnOffer(bookingId);
                console.log("[Return] API response:", res.data);

                setShowReturnOffer(false);
                showToast("Offer Accepted", "Return trip has been added to your ride.", "success");

                // Refresh booking data to show return fare in breakdown
                await fetchInitialData();
            } else {
                console.warn("[Return] No bookingId found in handleAcceptReturn");
            }
        } catch (error) {
            console.error("Failed to accept return offer:", error);
            showToast("Error", "Could not accept offer. Please try again.", "error");
            // Revert optimistic update
            setOptimisticReturnBooked(false);
            await fetchInitialData();
            setIsAcceptingReturn(false);
            isAcceptingReturnRef.current = false;
        } finally {
            // Clear accepting lock — UI visibility is controlled by booking.hasReturnTrip or optimistic flag
            setIsAcceptingReturn(false);
            isAcceptingReturnRef.current = false;
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
                setShowPaymentPrompt(false);
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

        const onTollUpdated = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                setBooking((prev: any) => ({
                    ...prev,
                    tollFee: data.tollFee,
                    totalFare: data.totalFare
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

                // Determine target based on status
                let targetLat: number | null = null;
                let targetLon: number | null = null;

                if (['accepted', 'arrived', 'pending', 'waiting'].includes(_status)) {
                    targetLat = Number(_booking?.pickupLatitude);
                    targetLon = Number(_booking?.pickupLongitude);
                } else if (_status === 'started') {
                    targetLat = Number(_booking?.dropLatitude);
                    targetLon = Number(_booking?.dropLongitude);
                } else if (_status === 'return_ride_started') {
                    // In return ride, we go FROM drop (where it started) BACK to pickup
                    targetLat = Number(_booking?.pickupLatitude);
                    targetLon = Number(_booking?.pickupLongitude);
                }

                if (newLat && newLon && targetLat && targetLon) {
                    // Only fetch directions if driver has moved significantly (>50m) or first time
                    const shouldUpdateDirections = !lastUpdateCoords.current || 
                        Math.abs(lastUpdateCoords.current.lat - newLat) > 0.0005 || 
                        Math.abs(lastUpdateCoords.current.lon - newLon) > 0.0005;

                    if (shouldUpdateDirections) {
                        lastUpdateCoords.current = { lat: newLat, lon: newLon };
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
                    showToast("Driver Arrived", "Your driver has arrived at the pickup location.", "success");
                    sendLocalNotification("Driver Arrived", "Your driver is at the pickup location.");
                }

                if (data.status === 'started' && oldStatus !== 'started') {
                    sendLocalNotification("Ride Started", "Have a safe journey!");
                }

                // Reliability Check: If ride started but we haven't accepted return trip yet, 
                // and it's not already shown, double check if we should show offer
                // Use a ref or local state to ensure we don't reopen if actively accepting
                if (data.status === 'started' && !bookingRef.current?.hasReturnTrip && !showReturnOffer && !isAcceptingReturnRef.current) {
                    console.log("[Client] Ride started, checking for return trip offer...");
                    setShowReturnOffer(true);
                }

                if (data.status === 'completed') {
                    setShowPaymentPrompt(false);
                    router.replace({
                        pathname: "/screens/RideCompletionScreen",
                        params: {
                            bookingId: bookingId,
                            fare: data.fare,
                            totalFare: data.totalFare,
                            distance: data.distance,
                            pickup: bookingRef.current?.pickupLocation,
                            drop: bookingRef.current?.dropLocation,
                            firstLegPaid: String(bookingRef.current?.firstLegPaid || false)
                        }
                    });
                }
            }
        };

        const onSuggestReturn = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Suggest Return Offer', data.waitingLimit);
                if (data.waitingLimit) {
                    setBooking((prev: any) => ({ ...prev, waitingLimit: data.waitingLimit }));
                }
                setShowReturnOffer(true);
                showToast("Special Offer", "Get 50% OFF on your return trip. Accept now to save!", "info");
                sendLocalNotification("Special Offer", "Get 50% OFF on your return trip. Tap to accept!");
            }
        };

        const onDriverArrived = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Driver Arrived (Specific Event)');
                if (currentStatusRef.current !== 'arrived') {
                    setCurrentStatus('arrived');
                    currentStatusRef.current = 'arrived';
                    showToast("Driver Arrived", "Your driver has arrived at the pickup location.", "success");
                    fetchInitialData();
                }
            }
        };

        const onPaymentRequested = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Payment Requested:', data.amount);
                const baseFare = Number(data?.breakdown?.baseFare || 0);
                const returnFare = Number(data?.breakdown?.returnFare || 0);
                const penalty = Number(data?.breakdown?.penalty || 0);
                const toll = Number(data?.breakdown?.toll || 0);
                const nightSurcharge = Number(data?.breakdown?.nightSurcharge || 0);
                const parsedAmount = Number(data?.amount);
                const safeAmount = Number.isFinite(parsedAmount)
                    ? parsedAmount
                    : (data?.isPartial
                        ? baseFare + nightSurcharge
                        : (data?.breakdown?.firstLegPaid ? (returnFare + penalty + toll) : (baseFare + nightSurcharge + returnFare + penalty + toll)));

                setPaymentDetails({
                    ...data,
                    amount: safeAmount,
                    breakdown: {
                        baseFare,
                        returnFare,
                        penalty,
                        toll,
                        nightSurcharge,
                        firstLegPaid: !!data?.breakdown?.firstLegPaid
                    }
                });
                setShowPaymentPrompt(true);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        };

        const onPaymentResolved = (data: any) => {
            if (String(data.bookingId) === String(bookingId)) {
                console.log('[Socket] Payment Resolved');
                setShowPaymentPrompt(false);
            }
        };

        socket.on("waitingStarted", onWaitingStarted);
        socket.on("penaltyApplied", onPenaltyApplied);
        socket.on("tollFeeUpdated", onTollUpdated);
        socket.on("driverLocationUpdate", onLocationUpdate);
        socket.on("rideStatusUpdate", onStatusUpdate);
        socket.on("suggestReturnTrip", onSuggestReturn);
        socket.on("driverArrived", onDriverArrived);
        socket.on("paymentRequested", onPaymentRequested);
        socket.on("paymentResolved", onPaymentResolved);

        return () => {
            console.log(`[Socket] Cleaning up tracking listeners for booking: ${bookingId}`);
            socket.off("waitingStarted", onWaitingStarted);
            socket.off("penaltyApplied", onPenaltyApplied);
            socket.off("tollFeeUpdated", onTollUpdated);
            socket.off("driverLocationUpdate", onLocationUpdate);
            socket.off("rideStatusUpdate", onStatusUpdate);
            socket.off("suggestReturnTrip", onSuggestReturn);
            socket.off("driverArrived", onDriverArrived);
            socket.off("paymentRequested", onPaymentRequested);
            socket.off("paymentResolved", onPaymentResolved);
        };
    }, [socketReady, bookingId, fetchInitialData]);

    // Timer for waiting - Use absolute time difference for accuracy
    useEffect(() => {
        if (currentStatus === 'waiting' && booking?.waitingStartedAt) {
            const startTime = new Date(booking.waitingStartedAt).getTime();
            
            const updateTimer = () => {
                const now = new Date().getTime();
                const elapsed = Math.floor((now - startTime) / 1000);
                setWaitingSecondsElapsed(elapsed);

                // Periodically refresh stats when over the limit to get latest penalty from backend
                const limit = booking?.waitingLimit || 3600;
                if (elapsed === limit + 1 || (elapsed > limit && elapsed % 60 === 0)) {
                    fetchInitialData();
                }
            };

            updateTimer(); // Initial call
            const timer = setInterval(updateTimer, 1000);
            return () => clearInterval(timer);
        }
    }, [currentStatus, booking?.waitingStartedAt]);

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
            case 'return_ride_started': return { text: 'Return trip started', color: 'bg-[#FFD700]', icon: 'repeat' as const };
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
                                    <Marker 
                                        tracksViewChanges={false}
                                        coordinate={{
                                            latitude: Number(currentStatus === 'return_ride_started' ? booking.dropLatitude : booking.pickupLatitude) || 0,
                                            longitude: Number(currentStatus === 'return_ride_started' ? booking.dropLongitude : booking.pickupLongitude) || 0
                                        }}
                                        zIndex={1}
                                    >
                                        <View className="items-center">
                                            <View className="bg-blue-500 px-2 py-0.5 rounded mb-1 shadow-md">
                                                <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                                    {currentStatus === 'return_ride_started' ? 'START' : 'PICKUP'}
                                                </Text>
                                            </View>
                                            <View className="bg-blue-600 p-2 rounded-full border-2 border-white shadow-lg">
                                                <Ionicons name="location" size={16} color="white" />
                                            </View>
                                        </View>
                                    </Marker>
                                )}

                                {/* Drop / Return-End Marker */}
                                {Number(booking.dropLatitude) !== 0 && Number(booking.dropLongitude) !== 0 && (
                                    <Marker 
                                        tracksViewChanges={false}
                                        coordinate={{
                                            latitude: Number(currentStatus === 'return_ride_started' ? booking.pickupLatitude : booking.dropLatitude) || 0,
                                            longitude: Number(currentStatus === 'return_ride_started' ? booking.pickupLongitude : booking.dropLongitude) || 0
                                        }}
                                        zIndex={1}
                                    >
                                        <View className="items-center">
                                            <View className="bg-red-500 px-2 py-0.5 rounded mb-1 shadow-md">
                                                <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                                    {currentStatus === 'return_ride_started' ? 'HOME' : 'DROP'}
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
                        {driverLocation && (
                            <Marker coordinate={driverLocation} zIndex={10}>
                                <View className="bg-slate-900 w-10 h-10 rounded-full border-2 border-white shadow-2xl items-center justify-center">
                                    <Ionicons name="car-sport" size={22} color="#FFD700" />
                                </View>
                            </Marker>
                        )}
                    </MapView>
                ) : (
                    <View className="flex-1 items-center justify-center"><Text className="text-slate-400 font-bold">Loading Map...</Text></View>
                )}

                <SafeAreaView className="absolute top-0 left-0 right-0 p-4">
                    <View className="flex-row justify-between items-start">
                        <TouchableOpacity onPress={() => router.replace("/screens/HomeScreen")} className="bg-white w-12 h-12 rounded-full items-center justify-center shadow-lg"><Ionicons name="arrow-back" size={24} color="#000" /></TouchableOpacity>

                        <View className="flex-1 ml-3 bg-white/95 rounded-3xl shadow-2xl p-2 flex-row items-center border border-white/20">
                            {!['started', 'return_ride_started'].includes(currentStatus) && (
                                <View className="bg-[#FFD700] px-3.5 py-2 rounded-2xl items-center justify-center mr-2 shadow-sm">
                                    <Text className="text-[8px] font-black text-slate-900 uppercase tracking-[2px] mb-0.5">otp</Text>
                                    <Text className="text-xl font-black text-black leading-5">{booking?.otp || '----'}</Text>
                                </View>
                            )}

                            {currentStatus === 'waiting' ? (
                                <View className="flex-1 items-center justify-center py-1">
                                    <View className="flex-row items-center mb-0.5">
                                        <Ionicons name="time" size={12} color="#94a3b8" />
                                        <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">{isPenaltyActive ? 'Overdue' : 'Free Waiting'}</Text>
                                    </View>
                                    <Text className={`text-lg font-black ${isPenaltyActive ? 'text-red-500' : 'text-slate-900'}`}>{formatTime(remainingSeconds)}</Text>
                                </View>
                            ) : (
                                <View className="flex-row flex-1 divide-x divide-slate-100">
                                    <View className="flex-1 items-center justify-center px-2">
                                        <View className="flex-row items-center mb-0.5">
                                            <Ionicons name="time" size={12} color="#3b82f6" />
                                            <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                {currentStatus === 'return_ride_started' ? 'Home In' : (currentStatus === 'arrived' ? 'Reached' : 'Arriving')}
                                            </Text>
                                        </View>
                                        <Text className="text-lg font-black text-slate-900" numberOfLines={1}>
                                            {currentStatus === 'return_ride_started' ? eta : (currentStatus === 'arrived' ? 'At Pickup' : eta)}
                                        </Text>
                                    </View>
                                    <View className="flex-1 items-center justify-center px-2">
                                        <View className="flex-row items-center mb-0.5">
                                            <Ionicons name="navigate" size={12} color="#10b981" />
                                            <Text className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-1">Dist</Text>
                                        </View>
                                        <Text className="text-lg font-black text-slate-900" numberOfLines={1}>{distance}</Text>
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </SafeAreaView>
            </View>

            <View className="flex-[2] bg-white rounded-t-[40px] shadow-2xl overflow-hidden -mt-10">
                <ScrollView
                    contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 20, paddingHorizontal: 24 }}
                    showsVerticalScrollIndicator={false}
                    bounces={true}
                >
                    <View className="items-center mb-6"><View className="w-10 h-1.5 bg-slate-200 rounded-full" /></View>

                    {currentStatus === 'waiting' && (
                        <Animated.View entering={FadeIn} className={`${isPenaltyActive ? 'bg-red-500' : 'bg-orange-500'} p-3 rounded-2xl mb-4 flex-row items-center justify-between shadow-md`}>
                            <View className="flex-row items-center flex-1">
                                <Ionicons name="time" size={20} color="white" />
                                <View className="ml-2">
                                    <Text className="text-white text-sm font-black">{isPenaltyActive ? '⚠️ OVERDUE' : 'FREE WAITING'}</Text>
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
                        <View className="bg-[#FFD700] p-2.5 rounded-2xl mb-3 flex-row items-center border border-yellow-600/30">
                            <Ionicons name="repeat" size={16} color="black" />
                            <Text className="text-black text-xs font-black ml-2">↩ RETURN TRIP — Heading back to pickup</Text>
                        </View>
                    )}

                    {/* TRIP ROUTE DETAILS */}
                    <View className="mb-4 bg-white rounded-3xl p-4 space-y-4">
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

                    <View className="p-3 rounded-2xl mb-4">
                        <View className="flex-row items-center">
                            <View className="w-12 h-12 bg-slate-200 rounded-full items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                                {booking?.driver?.profileImage ? (
                                    <Image 
                                        source={{ uri: getImageUrl(booking.driver.profileImage, { width: 100, height: 100, quality: 80 }) }} 
                                        className="w-full h-full" 
                                    />
                                ) : (
                                    <Ionicons name="person" size={24} color="#64748B" />
                                )}
                            </View>
                            <View className="ml-3 flex-1">
                                <Text className="text-slate-900 text-base font-black">{booking?.driver?.name || 'Driver'}</Text>
                                <Text className="text-slate-500 text-xs font-bold">{booking?.driver?.vehicleModel || 'Car'} • {booking?.driver?.vehicleNumber || '----'}</Text>
                            </View>
                            <View className="flex-row items-center bg-slate-900 px-2 py-1 rounded-full"><Ionicons name="star" size={10} color="#FFD700" /><Text className="text-white text-xs font-bold ml-1">{booking?.driver?.rating?.toFixed(1) || '5.0'}</Text></View>
                        </View>
                    </View>

                    {!['started', 'return_ride_started'].includes(currentStatus) && (
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
                    )}

                    {/* ── LIVE BILLING CARD ── */}
                    <View className="bg-white p-5 rounded-3xl mb-6 border border-slate-200 shadow-sm">

                        {/* Header row: title + current-leg badge */}
                        <View className="flex-row items-center justify-between mb-4">
                            <Text className="text-slate-500 text-[9px] uppercase font-black tracking-[2px]">Current Billing</Text>
                            <View className={`px-2.5 py-1 rounded-full ${currentStatus === 'return_ride_started' ? 'bg-yellow-400' : 'bg-blue-500'}`}>
                                <Text className={`text-[8px] font-black uppercase tracking-widest ${currentStatus === 'return_ride_started' ? 'text-slate-900' : 'text-white'}`}>
                                    {currentStatus === 'return_ride_started' ? '↩ Leg 2 – Return' : booking?.hasReturnTrip ? 'Leg 1 – Outbound' : 'Single Trip'}
                                </Text>
                            </View>
                        </View>

                        {/* Leg 1 – Base Fare row */}
                        <View className="flex-row justify-between items-center mb-3">
                            <View className="flex-row items-center flex-1">
                                <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${booking?.firstLegPaid ? 'bg-green-500' : 'bg-blue-500/20'}`}>
                                    <Ionicons
                                        name={booking?.firstLegPaid ? 'checkmark' : 'navigate'}
                                        size={12}
                                        color={booking?.firstLegPaid ? 'white' : '#60a5fa'}
                                    />
                                </View>
                                <View>
                                    <Text className="text-slate-900 text-sm font-bold">
                                        {booking?.hasReturnTrip || Number(booking?.returnTripFare) > 0 ? 'Base Fare (Leg 1)' : 'Ride Fare'}
                                    </Text>
                                    {booking?.firstLegPaid && (
                                        <Text className="text-green-600 text-[9px] font-bold uppercase tracking-wider">✓ Paid</Text>
                                    )}
                                </View>
                            </View>
                            <Text className={`text-sm font-bold ${booking?.firstLegPaid ? 'text-green-600' : 'text-slate-900'}`}>
                                ₹{booking?.baseFare || Math.max(0, Number(booking?.fare || 0) - Number(booking?.nightSurcharge || 0))}
                            </Text>
                        </View>

                        {(Number(booking?.nightSurcharge) > 0) && (
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-6 h-6 rounded-full bg-indigo-500/20 items-center justify-center mr-2">
                                        <Ionicons name="moon" size={12} color="#6366f1" />
                                    </View>
                                    <View>
                                        <Text className="text-indigo-500 text-sm font-bold">Night Surcharge</Text>
                                        {booking?.firstLegPaid && (
                                            <Text className="text-green-600 text-[9px] font-bold uppercase tracking-wider">✓ Paid</Text>
                                        )}
                                    </View>
                                </View>
                                <Text className={`text-sm font-bold ${booking?.firstLegPaid ? 'text-green-600' : 'text-indigo-500'}`}>+₹{booking?.nightSurcharge || 0}</Text>
                            </View>
                        )}

                        {/* Leg 2 – Return Fare row (only if return trip booked) */}
                        {booking?.hasReturnTrip && (
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center flex-1">
                                    <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${currentStatus === 'return_ride_started' ? 'bg-yellow-400' : 'bg-slate-700'}`}>
                                        <Ionicons
                                            name="repeat"
                                            size={12}
                                            color={currentStatus === 'return_ride_started' ? '#0f172a' : '#64748b'}
                                        />
                                    </View>
                                    <View>
                                        <Text className={`text-sm font-bold ${currentStatus === 'return_ride_started' ? 'text-yellow-700' : 'text-slate-700'}`}>
                                            Leg 2 Fare
                                        </Text>
                                        <View className="flex-row items-center">
                                            <View className="bg-yellow-400/20 px-1 py-0.5 rounded mr-1">
                                                <Text className="text-yellow-700 text-[7px] font-black uppercase">50% OFF</Text>
                                            </View>
                                            {currentStatus === 'return_ride_started' && (
                                                <Text className="text-yellow-700 text-[9px] font-bold uppercase tracking-wider">Active</Text>
                                            )}
                                        </View>
                                    </View>
                                </View>
                                <Text className={`text-sm font-bold ${currentStatus === 'return_ride_started' ? 'text-yellow-700' : 'text-slate-700'}`}>
                                    +₹{booking?.returnTripFare || 0}
                                </Text>
                            </View>
                        )}

                        {Number(booking?.penaltyApplied) > 0 && (
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-6 h-6 rounded-full bg-red-500/20 items-center justify-center mr-2">
                                        <Ionicons name="time" size={12} color="#ef4444" />
                                    </View>
                                    <Text className="text-red-400 text-sm font-bold">Waiting Charges</Text>
                                </View>
                                <Text className="text-red-400 text-sm font-bold">+₹{booking?.penaltyApplied || 0}</Text>
                            </View>
                        )}

                        {(Number(booking?.tollFee) > 0) && (
                            <View className="flex-row justify-between items-center mb-3">
                                <View className="flex-row items-center flex-1">
                                    <View className="w-6 h-6 rounded-full bg-amber-500/20 items-center justify-center mr-2">
                                        <Ionicons name="cash-outline" size={12} color="#f59e0b" />
                                    </View>
                                    <Text className="text-amber-500 text-sm font-bold">Toll Charges</Text>
                                </View>
                                <Text className="text-amber-500 text-sm font-bold">+₹{booking?.tollFee || 0}</Text>
                            </View>
                        )}

                        {/* Divider + Total */}
                        <View className="border-t border-slate-200 mt-3 pt-4 flex-row justify-between items-center">
                            <View>
                                <Text className="text-slate-900 text-sm font-bold">
                                    Estimated Total
                                </Text>
                                <Text className="text-slate-500 text-[9px] uppercase tracking-wider">
                                    {booking?.paymentMethod || 'Cash'} • {booking?.paymentChoice === 'total_at_end' ? 'Pay at End' : booking?.firstLegPaid ? 'Leg 1 settled' : 'Leg-by-leg'}
                                </Text>
                            </View>
                            <View className="items-end">
                                <Text className="text-slate-900 text-2xl font-black italic">
                                    ₹{Math.round(Number(booking?.fare || 0) + Number(booking?.returnTripFare || 0) + Number(booking?.penaltyApplied || 0) + Number(booking?.tollFee || 0))}
                                </Text>
                                {booking?.firstLegPaid && (
                                    <Text className="text-green-600 text-xs font-bold mt-1">
                                        Balance: ₹{(Number(booking?.returnTripFare || 0) + Number(booking?.penaltyApplied || 0) + Number(booking?.tollFee || 0))}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <Text className="text-slate-400 text-[9px] text-center mt-3 font-bold uppercase tracking-widest">
                            Prices are final — no surge
                        </Text>
                    </View>
                </ScrollView>
            </View>

            {showReturnOffer && !['completed', 'cancelled'].includes(currentStatus) && (
                <ReturnTripOfferModal
                    isVisible={showReturnOffer}
                    isAccepting={isAcceptingReturn}
                    waitingLimitSeconds={waitingLimit}
                    onClose={() => setShowReturnOffer(false)}
                    onAccept={handleAcceptReturn}
                />
            )}

            <PaymentPromptModal
                isVisible={showPaymentPrompt}
                onClose={() => setShowPaymentPrompt(false)}
                details={paymentDetails}
            />

            {/* Persistent Book Return Trip Button - visible until ride completes or return already booked */}
            {booking && !booking.hasReturnTrip && !optimisticReturnBooked && currentStatus === 'started' && (
                <TouchableOpacity
                    onPress={() => setShowReturnOffer(true)}
                    disabled={isAcceptingReturn || optimisticReturnBooked}
                    className="absolute right-6 bottom-24 bg-slate-900 px-4 py-3 rounded-3xl items-center justify-center flex-row shadow-lg"
                >
                    <Ionicons name="repeat" size={18} color="#FFD700" />
                    <Text className="text-[#FFD700] font-black ml-2">Book Return</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

export default LiveRideTrackingScreen;

