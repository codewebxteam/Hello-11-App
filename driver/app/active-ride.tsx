import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, TextInput, useWindowDimensions, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from '../utils/mapCompat';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolate, Extrapolate, runOnUI } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { driverAPI, locationAPI } from '../utils/api';
import { getSocket } from '../utils/socket';

const SHEET_MIN_HEIGHT = 140;

// --- Haversine: compute distance (in km) between two lat/lon points ---
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// --- Compute bearing between two coordinates (for car rotation) ---
function computeBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const toDeg = (r: number) => (r * 180) / Math.PI;
    const dLon = toRad(lon2 - lon1);
    const y = Math.sin(dLon) * Math.cos(toRad(lat2));
    const x =
        Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
        Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
    return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

// --- Find the closest index on a polyline to a given point ---
function findClosestRouteIndex(coords: { latitude: number; longitude: number }[], lat: number, lon: number): number {
    let minDist = Infinity;
    let idx = 0;
    for (let i = 0; i < coords.length; i++) {
        const d = haversineKm(lat, lon, coords[i].latitude, coords[i].longitude);
        if (d < minDist) {
            minDist = d;
            idx = i;
        }
    }
    return idx;
}

// --- Sum polyline distance from an index to the end ---
function remainingRouteDistanceKm(coords: { latitude: number; longitude: number }[], fromIndex: number): number {
    let total = 0;
    for (let i = fromIndex; i < coords.length - 1; i++) {
        total += haversineKm(coords[i].latitude, coords[i].longitude, coords[i + 1].latitude, coords[i + 1].longitude);
    }
    return total;
}

// Location HTTP update throttle (30 seconds)
const LOCATION_API_THROTTLE_MS = 30000;

export default function ActiveRideScreen() {
    const { width, height } = useWindowDimensions();
    const isLargePhone = width >= 412;
    const isTablet = width >= 768;
    const contentMaxWidth = isTablet ? 760 : isLargePhone ? 560 : undefined;
    const SHEET_MAX_HEIGHT = height * 0.85;
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const params = useLocalSearchParams();
    const [booking, setBooking] = React.useState<any>(null);

    // Check if this is a return trip or if coming back from waiting
    const isReturnTrip = params.mode === 'return';
    // penaltyAmount: use live state (updated by API and socket), fallback to params
    const [penaltyAmount, setPenaltyAmount] = React.useState<number>(params.penalty ? Number(params.penalty) : 0);
    const [tollAmount, setTollAmount] = React.useState<number>(params.toll ? Number(params.toll) : 0);
    const bookingId = params.bookingId as string;
    const distanceKm = params.distance ? parseFloat(params.distance as string) : 12.4;

    const [hasReturnTrip, setHasReturnTrip] = React.useState(false);
    const [routeCoords, setRouteCoords] = React.useState<any[]>([]);
    // Blueprint route fetched once — never re-fetched during ride
    const blueprintRouteRef = useRef<{ latitude: number; longitude: number }[]>([]);
    const [initialRegion] = React.useState<any>(() => {
        if (params.pLat && params.pLon) {
            return {
                latitude: Number(params.pLat),
                longitude: Number(params.pLon),
                latitudeDelta: 0.05,
                longitudeDelta: 0.05
            };
        }
        return { latitude: 28.6139, longitude: 77.2090, latitudeDelta: 0.05, longitudeDelta: 0.05 };
    });

    const [distance, setDistance] = React.useState<string>("---");
    const [eta, setEta] = React.useState<string>("---");
    const [sheetMeasuredHeight, setSheetMeasuredHeight] = React.useState<number>(SHEET_MAX_HEIGHT);
    const lastUpdateCoords = useRef<{ lat: number; lon: number } | null>(null);
    const lastApiUpdateTime = useRef<number>(0);
    const mapRef = useRef<any>(null);
    const userInteractingRef = useRef(false);
    const recenterTimerRef = useRef<any>(null);
    const [isFollowing, setIsFollowing] = React.useState(true);

    // Smooth car marker state
    const [driverCoord, setDriverCoord] = React.useState<{ latitude: number; longitude: number } | null>(null);
    const [driverBearing, setDriverBearing] = React.useState<number>(0);

    // Instant initial location fetch on mount so driver arrow marker renders immediately
    useEffect(() => {
        const fetchInitialLocation = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    if (loc && loc.coords) {
                        const { latitude, longitude } = loc.coords;
                        setDriverCoord({ latitude, longitude });
                        lastUpdateCoords.current = { lat: latitude, lon: longitude };
                    }
                }
            } catch (e) {
                console.log("Initial driver location fetch error:", e);
            }
        };
        fetchInitialLocation();
    }, []);

    // Safe coordinate calculations for map markers
    const pLatVal = Number(booking?.pickupLatitude || params.pLat);
    const pLonVal = Number(booking?.pickupLongitude || params.pLon);
    const dLatVal = Number(booking?.dropLatitude || params.dLat);
    const dLonVal = Number(booking?.dropLongitude || params.dLon);

    const startLat = isReturnTrip ? dLatVal : pLatVal;
    const startLon = isReturnTrip ? dLonVal : pLonVal;
    const targetLat = isReturnTrip ? pLatVal : dLatVal;
    const targetLon = isReturnTrip ? pLonVal : dLonVal;

    const isStartValid = !isNaN(startLat) && !isNaN(startLon) && startLat !== 0 && startLon !== 0;
    const isTargetValid = !isNaN(targetLat) && !isNaN(targetLon) && targetLat !== 0 && targetLon !== 0;

    const handleMapInteraction = () => {
        userInteractingRef.current = true;
        setIsFollowing(false);
        if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);
        recenterTimerRef.current = setTimeout(() => {
            userInteractingRef.current = false;
            setIsFollowing(true);
        }, 15000); // 15 sec baad auto-follow resume
    };

    const handleRecenter = () => {
        userInteractingRef.current = false;
        setIsFollowing(true);
        if (recenterTimerRef.current) clearTimeout(recenterTimerRef.current);
        if (mapRef.current && lastUpdateCoords.current) {
            mapRef.current.animateCamera({
                center: {
                    latitude: lastUpdateCoords.current.lat,
                    longitude: lastUpdateCoords.current.lon,
                },
                zoom: 16,
                heading: 0,
                pitch: 0,
            }, { duration: 500 });
        }
    };

    // Animation Shared Values
    const translateY = useSharedValue(0);
    const context = useSharedValue({ y: 0 });
    const sheetHeight = useSharedValue(SHEET_MAX_HEIGHT); // Initial guess
    const PEEK_HEIGHT = 120; // Peek height

    const gesture = Gesture.Pan()
        .activeOffsetY([-5, 5])
        .onStart(() => {
            'worklet';
            const maxDrag = Math.max(0, sheetHeight.value - PEEK_HEIGHT);
            const clampedY = Math.max(0, Math.min(translateY.value, maxDrag));
            translateY.value = clampedY;
            context.value = { y: clampedY };
        })
        .onUpdate((event) => {
            'worklet';
            const maxDrag = Math.max(0, sheetHeight.value - PEEK_HEIGHT);
            if (maxDrag <= 0) return;
            const nextY = context.value.y + event.translationY;
            translateY.value = Math.max(0, Math.min(nextY, maxDrag));
        })
        .onEnd((event) => {
            'worklet';
            const maxDrag = Math.max(0, sheetHeight.value - PEEK_HEIGHT);
            if (maxDrag <= 0) {
                translateY.value = withSpring(0);
                return;
            }
            const shouldCollapse = translateY.value > maxDrag / 2 || event.velocityY > 400;
            const targetY = shouldCollapse ? maxDrag : 0;

            translateY.value = withSpring(targetY, {
                damping: 22,
                stiffness: 120,
                mass: 0.8,
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
        const targetH = sheetMeasuredHeight > 0 ? sheetMeasuredHeight : SHEET_MAX_HEIGHT;
        runOnUI((nextHeight: number, peekHeight: number) => {
            'worklet';
            sheetHeight.value = nextHeight;
            const maxDrag = Math.max(0, nextHeight - peekHeight);
            if (translateY.value > maxDrag) {
                translateY.value = maxDrag;
            }
        })(targetH, PEEK_HEIGHT);
    }, [sheetMeasuredHeight, SHEET_MAX_HEIGHT, PEEK_HEIGHT, sheetHeight, translateY]);

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
                    }

                    // 2. Set initial region
                    const pLat = Number(b.pickupLatitude);
                    const pLon = Number(b.pickupLongitude);

                    if (!isNaN(pLat) && !isNaN(pLon) && pLat !== 0 && pLon !== 0) {
                        if (mapRef.current) {
                            mapRef.current.animateToRegion({
                                latitude: pLat,
                                longitude: pLon,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }, 500);
                        }
                    }

                    // 3. Get directions to target
                    const startLat = isReturnTrip ? b.dropLatitude : b.pickupLatitude;
                    const startLon = isReturnTrip ? b.dropLongitude : b.pickupLongitude;
                    const endLat = isReturnTrip ? b.pickupLatitude : b.dropLatitude;
                    const endLon = isReturnTrip ? b.pickupLongitude : b.dropLongitude;

                    if (startLat && startLon && endLat && endLon) {
                        // ONE-TIME blueprint route fetch — never refetched during ride
                        const dirRes = await locationAPI.getDirections(startLat, startLon, endLat, endLon);
                        if (dirRes.data && dirRes.data.data) {
                            setDistance(`${dirRes.data.data.distanceKm} km`);
                            const etaMin = Math.ceil(dirRes.data.data.duration / 60);
                            const h = Math.floor(etaMin / 60);
                            const m = etaMin % 60;
                            setEta(h > 0 ? `${h} Hrs ${m} mins` : `${m} mins`);

                            if (dirRes.data.data.geometry && Array.isArray(dirRes.data.data.geometry.coordinates)) {
                                const coords = dirRes.data.data.geometry.coordinates
                                    .filter((c: any) => Array.isArray(c) && c.length >= 2 && c[1] !== null && c[0] !== null)
                                    .map((c: any) => ({
                                        latitude: Number(c[1]),
                                        longitude: Number(c[0])
                                    }));
                                if (coords.length > 0) {
                                    setRouteCoords(coords);
                                    // Store as blueprint for local distance/ETA calculation
                                    blueprintRouteRef.current = coords;
                                }
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
    }, [bookingId, isReturnTrip, router]);

    useEffect(() => {
        if (!booking) return;

        let locationSubscription: any = null;
        const startTracking = async () => {
            try {
                let { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') return;

                await Location.startLocationUpdatesAsync('BACKGROUND_LOCATION_TASK', {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 50, // Only trigger when moved 50m (battery efficient)
                    timeInterval: 30000, // Every 30 seconds max for background
                    foregroundService: {
                        notificationTitle: "Ride in Progress",
                        notificationBody: "Tracking active trip...",
                        notificationColor: "#FF0000",
                    },
                });

                locationSubscription = await Location.watchPositionAsync(
                    {
                        accuracy: Location.Accuracy.High,
                        distanceInterval: 15, // Smooth car movement (every 15m)
                    },
                    (newLoc) => {
                        const { latitude, longitude } = newLoc.coords;

                        // 1. Update car marker position with bearing for smooth movement
                        if (lastUpdateCoords.current) {
                            const bearing = computeBearing(
                                lastUpdateCoords.current.lat,
                                lastUpdateCoords.current.lon,
                                latitude,
                                longitude
                            );
                            setDriverBearing(bearing);
                        }
                        setDriverCoord({ latitude, longitude });
                        lastUpdateCoords.current = { lat: latitude, lon: longitude };

                        // 2. Smoothly follow driver using animateCamera (prevents map flip/rotation)
                        if (!userInteractingRef.current && mapRef.current) {
                            mapRef.current.animateCamera({
                                center: { latitude, longitude },
                                zoom: 16,
                                heading: 0, // Keep north-up (prevents map palat/flip)
                                pitch: 0,
                            }, { duration: 1000 });
                        }

                        // 3. Throttled HTTP location update (every 30s instead of every 10s)
                        const now = Date.now();
                        if (now - lastApiUpdateTime.current >= LOCATION_API_THROTTLE_MS) {
                            lastApiUpdateTime.current = now;
                            driverAPI.updateLocation({ latitude, longitude }).catch(() => { });
                        }

                        // 4. Locally compute remaining distance & ETA from blueprint route
                        const route = blueprintRouteRef.current;
                        if (route.length > 1) {
                            const closestIdx = findClosestRouteIndex(route, latitude, longitude);
                            const remainKm = remainingRouteDistanceKm(route, closestIdx);
                            const displayKm = remainKm < 1 ? remainKm.toFixed(2) : remainKm.toFixed(1);
                            setDistance(`${displayKm} km`);

                            // Estimate ETA: assume avg 30 km/h city driving
                            const etaMin = Math.ceil((remainKm / 30) * 60);
                            const h = Math.floor(etaMin / 60);
                            const m = etaMin % 60;
                            setEta(h > 0 ? `${h} Hrs ${m} mins` : `${m} mins`);

                            // Trim route: only show remaining polyline ahead of driver
                            if (closestIdx > 0) {
                                const trimmed = route.slice(closestIdx);
                                setRouteCoords(trimmed);
                            }
                        }
                    }
                );
            } catch (err) { console.error(err); }
        };

        startTracking();
        return () => locationSubscription?.remove();
    }, [booking, booking?._id, booking?.dropLatitude, booking?.dropLongitude, booking?.pickupLatitude, booking?.pickupLongitude, isReturnTrip]);

    useEffect(() => {
        const setupSocket = async () => {
            const socket = await getSocket();
            if (socket) {
                socket.on("returnTripAccepted", (data: any) => {
                    if (String(data.bookingId) === String(bookingId)) {
                        setHasReturnTrip(true);
                        if (data.tollFee !== undefined) {
                            setTollAmount(Number(data.tollFee) || 0);
                        }
                        setBooking((prev: any) => prev ? {
                            ...prev,
                            hasReturnTrip: true,
                            returnTripFare: data.returnTripFare || prev.returnTripFare,
                            tollFee: data.tollFee !== undefined ? data.tollFee : prev.tollFee,
                            totalFare: data.totalFare !== undefined ? data.totalFare : prev.totalFare
                        } : prev);
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
                        setBooking((prev: any) => prev ? { ...prev, tollFee: data.tollFee, totalFare: data.totalFare } : prev);
                    }
                });
            }
        };
        setupSocket();
    }, [bookingId, router]);

    

    const handleEndRide = () => {
        const normalizedBaseFare = booking?.baseFare || Math.max(0, Number(booking?.fare || 0) - Number(booking?.nightSurcharge || 0));
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
                                baseFare: normalizedBaseFare.toString(),
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
        const normalizedBaseFare = booking?.baseFare || Math.max(0, Number(booking?.fare || 0) - Number(booking?.nightSurcharge || 0));
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
                                    baseFare: normalizedBaseFare.toString(),
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
                            } catch {
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
                                    baseFare: normalizedBaseFare.toString(),
                                    nightSurcharge: (booking?.nightSurcharge || 0).toString(),
                                    distance: distance.replace(' km', '') || distanceKm.toString(),
                                    pickup: booking?.pickupLocation || '',
                                    drop: booking?.dropLocation || '',
                                }
                            });
                        }
                    },
                    { text: "Cancel", style: "cancel" }
                ]
            );
        }
    };

    return (
        <View className="flex-1 bg-slate-900">
            <StatusBar style="dark" />

            {/* --- REAL MAP BACKGROUND --- */}
            <View className="absolute inset-0 bg-slate-200">
                {initialRegion ? (
                    <MapView
                        ref={mapRef}
                        style={{ width, height }}
                        initialRegion={initialRegion}
                        showsUserLocation={false}
                        provider={PROVIDER_GOOGLE}
                        rotateEnabled={true}
                        pitchEnabled={true}
                        showsCompass={true}
                        scrollEnabled={true}
                        zoomEnabled={true}
                        onPanDrag={handleMapInteraction}
                        onRegionChangeComplete={() => {}}
                    >
                        {/* Route polyline (trimmed from driver position to destination) */}
                        {routeCoords.length > 0 && (
                            <Polyline
                                coordinates={routeCoords}
                                strokeWidth={5}
                                strokeColor="#3b82f6"
                            />
                        )}

                        {/* 🧭 Navigation Arrow Marker — points in driving direction (Ola/Uber style) */}
                        {driverCoord && (
                            <Marker
                                coordinate={driverCoord}
                                anchor={{ x: 0.5, y: 0.5 }}
                                flat={true}
                                rotation={driverBearing}
                                tracksViewChanges={false}
                            >
                                <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                                    {/* Outer translucent blue aura */}
                                    <View style={{
                                        width: 44,
                                        height: 44,
                                        borderRadius: 22,
                                        backgroundColor: 'rgba(59, 130, 246, 0.25)',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'absolute'
                                    }} />
                                    {/* Main navigation circle */}
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: 18,
                                        backgroundColor: '#0F172A',
                                        borderWidth: 3,
                                        borderColor: '#FFD700',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        shadowColor: '#000',
                                        shadowOffset: { width: 0, height: 3 },
                                        shadowOpacity: 0.5,
                                        shadowRadius: 5,
                                        elevation: 8,
                                    }}>
                                        <Ionicons name="navigate" size={20} color="#FFD700" />
                                    </View>
                                </View>
                            </Marker>
                        )}

                        {/* Pickup / Start Marker */}
                        {isStartValid && (
                            <Marker
                                tracksViewChanges={false}
                                coordinate={{
                                    latitude: startLat,
                                    longitude: startLon
                                }}
                            >
                                <View className="items-center">
                                    <View className="bg-slate-800 px-2 py-0.5 rounded mb-1 shadow-md border border-slate-700">
                                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                            {isReturnTrip ? 'START' : 'PICKUP'}
                                        </Text>
                                    </View>
                                    <View className="bg-slate-900 p-2 rounded-full border-2 border-slate-600 shadow-lg">
                                        <Ionicons name="location" size={14} color="#94A3B8" />
                                    </View>
                                </View>
                            </Marker>
                        )}

                        {/* 🔵 Destination Marker — Big Blue Target Dot (Ola/Uber style) */}
                        {isTargetValid && (
                            <Marker
                                tracksViewChanges={false}
                                coordinate={{
                                    latitude: targetLat,
                                    longitude: targetLon
                                }}
                            >
                                <View className="items-center">
                                    {/* Destination Badge */}
                                    <View className="bg-blue-600 px-2.5 py-1 rounded-md mb-1.5 shadow-lg border border-blue-400">
                                        <Text className="text-white text-[9px] font-black uppercase tracking-widest">
                                            {isReturnTrip ? 'HOME' : 'DESTINATION'}
                                        </Text>
                                    </View>
                                    
                                    {/* Big Blue Dot Destination Pin */}
                                    <View style={{ width: 34, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                                        {/* Outer translucent blue ring */}
                                        <View style={{
                                            position: 'absolute',
                                            width: 34,
                                            height: 34,
                                            borderRadius: 17,
                                            backgroundColor: 'rgba(37, 99, 235, 0.3)',
                                            borderWidth: 1.5,
                                            borderColor: 'rgba(37, 99, 235, 0.6)'
                                        }} />
                                        {/* Inner Solid Big Blue Dot */}
                                        <View style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: 11,
                                            backgroundColor: '#2563EB',
                                            borderWidth: 4,
                                            borderColor: '#FFFFFF',
                                            shadowColor: '#000',
                                            shadowOffset: { width: 0, height: 2 },
                                            shadowOpacity: 0.4,
                                            shadowRadius: 4,
                                            elevation: 6
                                        }} />
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

            {/* Re-center button — shows when driver manually moved map */}
            {!isFollowing && (
                <TouchableOpacity
                    onPress={handleRecenter}
                    className="absolute right-4 bg-white rounded-full p-3 shadow-xl border border-slate-200 z-10"
                    style={{ top: insets.top + 120 }}
                >
                    <Ionicons name="navigate" size={22} color="#0F172A" />
                </TouchableOpacity>
            )}

            {/* --- TOP BAR (NAVIGATION) --- */}
            <View className="absolute top-0 w-full z-10 px-4" style={{ paddingTop: insets.top + 8 }}>
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
                            if (h > 0 && Math.abs(sheetMeasuredHeight - h) > 1) {
                                setSheetMeasuredHeight(h);
                            }
                        }}
                        style={{ paddingBottom: insets.bottom + 20, minHeight: SHEET_MIN_HEIGHT, maxWidth: contentMaxWidth }}
                        className="bg-[#0F172A] rounded-t-[40px] px-6 pt-4 shadow-[0_-10px_60px_rgba(0,0,0,0.5)] border-t border-slate-700/50 w-full self-center"
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
                                        <Ionicons name="person" size={20} color="#CBD5E1" />
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
                                    <Text className="text-white text-2xl font-black italic">{eta}</Text>
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
                                        <Text className={`text-sm font-bold ${booking?.firstLegPaid ? 'text-green-500' : 'text-indigo-400'}`}>+₹{booking?.nightSurcharge || 0} Night Charge</Text>
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
                                            <View className={`w-6 h-6 rounded-full items-center justify-center mr-2 ${booking?.firstLegPaid ? 'bg-green-500' : 'bg-amber-500/20'}`}>
                                                <Ionicons name={booking?.firstLegPaid ? 'checkmark' : 'cash-outline'} size={12} color={booking?.firstLegPaid ? 'white' : '#f59e0b'} />
                                            </View>
                                            <View>
                                                <Text className="text-amber-400 text-sm font-bold">Toll Charges</Text>
                                                {booking?.firstLegPaid && (
                                                    <Text className="text-green-500 text-[9px] font-black uppercase tracking-wider">✓ Paid in Leg 1</Text>
                                                )}
                                            </View>
                                        </View>
                                        <Text className={`text-sm font-bold ${booking?.firstLegPaid ? 'text-green-500' : 'text-amber-400'}`}>+₹{tollAmount || 0}</Text>
                                    </View>
                                )}
                                
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
