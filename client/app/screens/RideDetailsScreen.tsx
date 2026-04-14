import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    StatusBar as RNStatusBar,
    Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import { userAPI, bookingAPI } from '../../utils/api';
import { TextInput, Alert } from 'react-native';

const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;
const { width } = Dimensions.get('window');

// Responsive sizing constants
const GRID_GAP = width > 380 ? 12 : 10;
const PADDING_H = width > 380 ? 24 : 16;
const CARD_WIDTH = (width - (PADDING_H * 2) - GRID_GAP) / 2;

const RESPONSIVE_CONFIG = {
    paddingHorizontal: PADDING_H,
    paddingVertical: width > 380 ? 12 : 8,
    headerFontSize: width > 380 ? 18 : 16,
    titleFontSize: width > 380 ? 32 : 28,
    cardPadding: width > 380 ? 20 : 16,
    cardRadius: width > 380 ? 30 : 24,
    iconSize: width > 380 ? 20 : 16,
    badgeSize: width > 380 ? 14 : 12,
    textSize: width > 380 ? 14 : 13,
    labelSize: width > 380 ? 10 : 9,
    gridWidth: CARD_WIDTH,
    gridGap: GRID_GAP,
}

export default function RideDetailsScreen() {
    const router = useRouter();
    const { bookingId, prefill } = useLocalSearchParams();
    const initialPrefill = useMemo(() => {
        if (!prefill || typeof prefill !== 'string') return null;
        try {
            return JSON.parse(prefill);
        } catch {
            return null;
        }
    }, [prefill]);

    const [booking, setBooking] = useState<any>(initialPrefill);
    const [loading, setLoading] = useState(!initialPrefill);
    
    // Feedback State
    const [userRating, setUserRating] = useState(0);
    const [feedbackComment, setFeedbackComment] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (bookingId) fetchBookingDetails();
    }, [bookingId]);

    const fetchBookingDetails = async () => {
        try {
            const response = await bookingAPI.getBookingById(bookingId as string);
            if (response.data?.booking) {
                setBooking(response.data.booking);
                // Pre-fill rating if it exists (though UI uses booking.rating directly too)
                if (response.data.booking.rating) {
                    setUserRating(response.data.booking.rating);
                }
                if (response.data.booking.feedback) {
                    setFeedbackComment(response.data.booking.feedback);
                }
            }
        } catch (error) {
            console.error("Error fetching booking details:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReview = async () => {
        if (userRating === 0) {
            Alert.alert("Rating Required", "Please select a star rating.");
            return;
        }

        setIsSubmitting(true);
        try {
            await userAPI.rateDriver({
                bookingId: bookingId as string,
                rating: userRating,
                feedback: feedbackComment
            });
            
            // Refresh booking details to show the new rating
            await fetchBookingDetails();
            Alert.alert("Success", "Thank you for your feedback!");
        } catch (error) {
            console.error("Error submitting review:", error);
            Alert.alert("Error", "Failed to submit review. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center">
                <ActivityIndicator size="large" color="#FFD700" />
            </View>
        );
    }

    if (!booking) {
        return (
            <View className="flex-1 bg-slate-50 justify-center items-center p-6">
                <Text className="text-slate-400 text-center mb-4">Could not load ride details.</Text>
                <TouchableOpacity onPress={() => router.back()} className="bg-slate-900 px-6 py-3 rounded-xl">
                    <Text className="text-white font-bold">Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const isScheduled = booking.bookingType === 'schedule';
    const isOutstation = booking.rideType === 'outstation';
    const hasReturn = !!booking.hasReturnTrip;
    const hasPenalty = (booking.penaltyApplied || 0) > 0;
    const hasToll = (booking.tollFee || 0) > 0;
    const hasNightFare = !!booking.isNightFare || (booking.nightSurcharge && Number(booking.nightSurcharge) > 0);
    const nightFareAmount = Number(booking.nightSurcharge || booking.nightFareAmount || 0);

    const statusBg = booking.status === 'completed' ? 'bg-green-50' : booking.status === 'cancelled' ? 'bg-red-50' : 'bg-blue-50';
    const statusText = booking.status === 'completed' ? 'text-green-600' : booking.status === 'cancelled' ? 'text-red-500' : 'text-blue-600';

    return (
        <View className="flex-1 bg-slate-50">
            <StatusBar style="dark" />
            <View style={{ paddingTop: STATUSBAR_HEIGHT }} className="bg-white shadow-sm z-10">
                <View className="px-6 py-4 flex-row items-center" style={{ paddingHorizontal: RESPONSIVE_CONFIG.paddingHorizontal }}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="w-10 h-10 bg-slate-50 rounded-full items-center justify-center border border-slate-100 mr-4"
                    >
                        <Ionicons name="arrow-back" size={RESPONSIVE_CONFIG.iconSize + 4} color="#1E293B" />
                    </TouchableOpacity>
                    <Text 
                        className="text-slate-900 font-black tracking-wider uppercase"
                        style={{ fontSize: RESPONSIVE_CONFIG.headerFontSize }}
                    >
                        Trip Details
                    </Text>
                </View>
            </View>

            <ScrollView 
                contentContainerStyle={{ 
                    paddingHorizontal: RESPONSIVE_CONFIG.paddingHorizontal, 
                    paddingVertical: RESPONSIVE_CONFIG.paddingVertical,
                    paddingBottom: 48 
                }} 
                showsVerticalScrollIndicator={false}
            >

                {/* ─── Status + Fare Card ─── */}
                <View 
                    className="bg-white shadow-sm border border-slate-100 mb-5 items-center"
                    style={{ 
                        borderRadius: RESPONSIVE_CONFIG.cardRadius, 
                        padding: RESPONSIVE_CONFIG.cardPadding,
                        marginBottom: width > 380 ? 20 : 16
                    }}
                >
                    <View className={`rounded-full mb-3 ${statusBg}`} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
                        <Text 
                            className={`font-black uppercase tracking-widest ${statusText}`}
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            {booking.status}
                        </Text>
                    </View>

                    <Text 
                        className="text-slate-900 font-black mb-1"
                        style={{ fontSize: RESPONSIVE_CONFIG.titleFontSize }}
                    >
                        ₹{booking.totalFare || booking.fare}
                    </Text>
                    <Text 
                        className="text-slate-400 font-bold uppercase tracking-widest mb-4"
                        style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                    >
                        Total Fare
                    </Text>

                    {/* Badges */}
                    <View className="flex-row flex-wrap justify-center">
                        {isOutstation && (
                            <View 
                                className="bg-purple-100 rounded-full flex-row items-center mr-2 mb-2"
                                style={{ paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}
                            >
                                <Ionicons name="car" size={RESPONSIVE_CONFIG.badgeSize - 2} color="#7c3aed" />
                                <Text 
                                    className="text-purple-700 font-black ml-1 uppercase"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize - 1 }}
                                >
                                    Outstation
                                </Text>
                            </View>
                        )}
                        {isScheduled && (
                            <View 
                                className="bg-sky-100 rounded-full flex-row items-center mr-2 mb-2"
                                style={{ paddingHorizontal: 10, paddingVertical: 6, marginRight: 8, marginBottom: 8 }}
                            >
                                <Ionicons name="calendar" size={RESPONSIVE_CONFIG.badgeSize - 2} color="#0284c7" />
                                <Text 
                                    className="text-sky-700 font-black ml-1 uppercase"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize - 1 }}
                                >
                                    Scheduled
                                </Text>
                            </View>
                        )}
                        {hasReturn && (
                            <View 
                                className="bg-amber-100 rounded-full flex-row items-center mr-2 mb-2"
                                style={{ paddingHorizontal: 10, paddingVertical: 6 }}
                            >
                                <Ionicons name="return-down-back" size={RESPONSIVE_CONFIG.badgeSize - 2} color="#b45309" />
                                <Text 
                                    className="text-amber-700 font-black ml-1 uppercase"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize - 1 }}
                                >
                                    Return Trip
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* ─── Scheduled Date Banner ─── */}
                {isScheduled && booking.scheduledDate && (
                    <View 
                        className="bg-sky-900 flex-row items-center mb-5"
                        style={{ 
                            borderRadius: RESPONSIVE_CONFIG.cardRadius, 
                            padding: RESPONSIVE_CONFIG.cardPadding,
                            marginBottom: width > 380 ? 20 : 16
                        }}
                    >
                        <View 
                            className="bg-[#FFD700] rounded-lg mr-3"
                            style={{ padding: 8 }}
                        >
                            <Ionicons name="calendar" size={RESPONSIVE_CONFIG.iconSize} color="black" />
                        </View>
                        <View>
                            <Text 
                                className="text-sky-300 font-black uppercase"
                                style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                            >
                                Scheduled For
                            </Text>
                            <Text 
                                className="text-white font-black"
                                style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                            >
                                {new Date(booking.scheduledDate).toLocaleString('en-IN', {
                                    weekday: 'short', day: '2-digit', month: 'short',
                                    hour: '2-digit', minute: '2-digit', hour12: true
                                })}
                            </Text>
                        </View>
                    </View>
                )}

                {/* ─── Return Trip Banner ─── */}
                {hasReturn && (
                    <View 
                        className="bg-amber-900 flex-row items-center justify-between mb-5"
                        style={{ 
                            borderRadius: RESPONSIVE_CONFIG.cardRadius, 
                            padding: RESPONSIVE_CONFIG.cardPadding,
                            marginBottom: width > 380 ? 20 : 16
                        }}
                    >
                        <View className="flex-row items-center flex-1" style={{ marginRight: RESPONSIVE_CONFIG.gridGap }}>
                            <View 
                                className="bg-[#FFD700] rounded-lg mr-3"
                                style={{ padding: 8 }}
                            >
                                <Ionicons name="return-down-back" size={RESPONSIVE_CONFIG.iconSize} color="black" />
                            </View>
                            <View className="flex-1">
                                <Text 
                                    className="text-amber-300 font-black uppercase"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                                >
                                    Return Trip Route
                                </Text>
                                <Text 
                                    className="text-white font-black"
                                    numberOfLines={2}
                                    style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                                >
                                    {booking.dropLocation} → {booking.pickupLocation}
                                </Text>
                            </View>
                        </View>
                        <View className="items-end">
                            <Text 
                                className="text-amber-300 font-black uppercase"
                                style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                            >
                                Fare
                            </Text>
                            <Text 
                                className="text-[#FFD700] font-black"
                                style={{ fontSize: RESPONSIVE_CONFIG.titleFontSize - 10 }}
                            >
                                ₹{booking.returnTripFare || 0}
                            </Text>
                            {(booking.discount || 0) > 0 && (
                                <Text 
                                    className="text-green-400 font-black"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                                >
                                    -{booking.discount}% OFF
                                </Text>
                            )}
                        </View>
                    </View>
                )}

                {/* ─── Route Section ─── */}
                <View 
                    className="bg-white shadow-sm border border-slate-100 mb-5"
                    style={{ 
                        borderRadius: RESPONSIVE_CONFIG.cardRadius, 
                        padding: RESPONSIVE_CONFIG.cardPadding,
                        marginBottom: width > 380 ? 20 : 16
                    }}
                >
                    <Text 
                        className="text-slate-400 font-black uppercase tracking-widest mb-6"
                        style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                    >
                        Route Details
                    </Text>
                    <View className="pl-1 relative">
                        <View 
                            className="absolute top-4 bottom-4 bg-slate-100 border-l border-dashed border-slate-300"
                            style={{ left: width > 380 ? 10 : 8, width: 1 }}
                        />
                        <View className="flex-row items-start" style={{ marginBottom: width > 380 ? 32 : 24 }}>
                            <View 
                                className="rounded-full bg-blue-50 border-blue-100 items-center justify-center z-10"
                                style={{ 
                                    width: width > 380 ? 20 : 18, 
                                    height: width > 380 ? 20 : 18, 
                                    borderWidth: 3 
                                }}
                            >
                                <View 
                                    className="rounded-full bg-blue-500"
                                    style={{ 
                                        width: width > 380 ? 8 : 6, 
                                        height: width > 380 ? 8 : 6 
                                    }}
                                />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text 
                                    className="text-slate-400 font-bold uppercase mb-1"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                                >
                                    Pickup
                                </Text>
                                <Text 
                                    className="text-slate-800 font-bold leading-5"
                                    style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                                >
                                    {booking.pickupLocation}
                                </Text>
                            </View>
                        </View>
                        <View className="flex-row items-start">
                            <View 
                                className="rounded-full bg-slate-900 border-slate-800 items-center justify-center z-10"
                                style={{ 
                                    width: width > 380 ? 20 : 18, 
                                    height: width > 380 ? 20 : 18, 
                                    borderWidth: 3 
                                }}
                            >
                                <View 
                                    className="bg-white rounded-full"
                                    style={{ 
                                        width: width > 380 ? 6 : 5, 
                                        height: width > 380 ? 6 : 5 
                                    }}
                                />
                            </View>
                            <View className="ml-4 flex-1">
                                <Text 
                                    className="text-slate-400 font-bold uppercase mb-1"
                                    style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                                >
                                    Drop-off
                                </Text>
                                <Text 
                                    className="text-slate-800 font-bold leading-5"
                                    style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                                >
                                    {booking.dropLocation}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* ─── Stats Grid ─── */}
                <View className="flex-row flex-wrap" style={{ gap: RESPONSIVE_CONFIG.gridGap, marginBottom: width > 380 ? 20 : 16 }}>

                    <View 
                        className="bg-white shadow-sm border border-slate-100"
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="calendar-outline" size={RESPONSIVE_CONFIG.iconSize} color="#94A3B8" />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Date
                        </Text>
                        <Text className="text-slate-800 font-bold text-xs">
                            {new Date(booking.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                    </View>

                    <View 
                        className="bg-white shadow-sm border border-slate-100"
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="time-outline" size={RESPONSIVE_CONFIG.iconSize} color="#94A3B8" />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Time
                        </Text>
                        <Text 
                            className="text-slate-800 font-bold"
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            {new Date(booking.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </Text>
                    </View>

                    <View 
                        className="bg-white shadow-sm border border-slate-100"
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="navigate-outline" size={RESPONSIVE_CONFIG.iconSize} color="#94A3B8" />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Distance
                        </Text>
                        <Text 
                            className="text-slate-800 font-bold"
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            {booking.distance} KM
                        </Text>
                    </View>

                    <View 
                        className="bg-white shadow-sm border border-slate-100"
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="car-outline" size={RESPONSIVE_CONFIG.iconSize} color="#94A3B8" />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Ride Type
                        </Text>
                        <Text 
                            className="text-slate-800 font-bold uppercase"
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            {booking.rideType}
                        </Text>
                    </View>

                    {/* Base Fare */}
                    <View 
                        className="bg-white shadow-sm border border-slate-100"
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="cash-outline" size={RESPONSIVE_CONFIG.iconSize} color="#10b981" />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Base Fare (Leg 1)
                        </Text>
                        <Text 
                            className="text-green-600 font-bold"
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            ₹{Math.max(0, Number(booking.fare || 0) - Number(nightFareAmount || 0))}
                        </Text>
                    </View>

                    {/* Night Fare */}
                    <View 
                        className={`shadow-sm border ${hasNightFare ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-slate-100'}`}
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="moon" size={RESPONSIVE_CONFIG.iconSize} color={hasNightFare ? "#4338ca" : "#94A3B8"} />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Night Fare
                        </Text>
                        <Text 
                            className={`font-bold ${hasNightFare ? 'text-indigo-700' : 'text-slate-500'}`}
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            {hasNightFare ? `Yes${nightFareAmount > 0 ? ` • ₹${nightFareAmount}` : ''}` : 'No'}
                        </Text>
                    </View>

                    {/* Booking Type */}
                    <View 
                        className={`shadow-sm border ${isScheduled ? 'bg-sky-50 border-sky-100' : 'bg-white border-slate-100'}`}
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name={isScheduled ? 'calendar' : 'flash'} size={RESPONSIVE_CONFIG.iconSize} color={isScheduled ? '#0284c7' : '#f59e0b'} />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Booking
                        </Text>
                        <View className="flex-row items-center">
                            <Ionicons 
                                name={isScheduled ? 'calendar-outline' : 'flash-outline'} 
                                size={14} 
                                color={isScheduled ? '#0369a1' : '#f59e0b'} 
                                style={{ marginRight: 4 }}
                            />
                            <Text 
                                className={`font-bold ${isScheduled ? 'text-sky-700' : 'text-slate-800'}`}
                                style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                            >
                                {isScheduled ? 'Scheduled' : 'Ride Now'}
                            </Text>
                        </View>
                    </View>

                    {/* Return Trip */}
                    <View 
                        className={`shadow-sm border ${hasReturn ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="return-down-back" size={RESPONSIVE_CONFIG.iconSize} color={hasReturn ? '#b45309' : '#94A3B8'} />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Return Trip
                        </Text>
                        <View className="flex-row items-center">
                            <Ionicons 
                                name={hasReturn ? 'checkmark-circle' : 'close-circle'} 
                                size={14} 
                                color={hasReturn ? '#047857' : '#ef4444'} 
                                style={{ marginRight: 4 }}
                            />
                            <Text 
                                className={`font-bold ${hasReturn ? 'text-amber-700' : 'text-slate-400'}`}
                                style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                            >
                                {hasReturn ? `Yes  ₹${booking.returnTripFare || 0}` : 'No'}
                            </Text>
                        </View>
                    </View>

                    {/* Penalty */}
                    {hasPenalty && (
                        <View 
                            className="bg-red-50 shadow-sm border border-red-100"
                            style={{ 
                                width: RESPONSIVE_CONFIG.gridWidth,
                                borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                                padding: RESPONSIVE_CONFIG.cardPadding - 4,
                            }}
                        >
                            <Ionicons name="warning-outline" size={RESPONSIVE_CONFIG.iconSize} color="#ef4444" />
                            <Text 
                                className="text-slate-400 font-bold uppercase mb-1 mt-2"
                                style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                            >
                                Penalty
                            </Text>
                            <Text 
                                className="text-red-600 font-bold"
                                style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                            >
                                ₹{booking.penaltyApplied}
                            </Text>
                        </View>
                    )}

                    {hasToll && (
                        <View 
                            className="bg-amber-50 shadow-sm border border-amber-100"
                            style={{ 
                                width: RESPONSIVE_CONFIG.gridWidth,
                                borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                                padding: RESPONSIVE_CONFIG.cardPadding - 4,
                            }}
                        >
                            <Ionicons name="git-network-outline" size={RESPONSIVE_CONFIG.iconSize} color="#d97706" />
                            <Text 
                                className="text-slate-400 font-bold uppercase mb-1 mt-2"
                                style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                            >
                                Toll
                            </Text>
                            <Text 
                                className="text-amber-700 font-bold"
                                style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                            >
                                ₹{booking.tollFee}
                            </Text>
                        </View>
                    )}

                    {/* Payment */}
                    <View 
                        className="bg-white shadow-sm border border-slate-100"
                        style={{ 
                            width: RESPONSIVE_CONFIG.gridWidth,
                            borderRadius: RESPONSIVE_CONFIG.cardRadius - 6, 
                            padding: RESPONSIVE_CONFIG.cardPadding - 4,
                        }}
                    >
                        <Ionicons name="wallet-outline" size={RESPONSIVE_CONFIG.iconSize} color="#94A3B8" />
                        <Text 
                            className="text-slate-400 font-bold uppercase mb-1 mt-2"
                            style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                        >
                            Payment
                        </Text>
                        <Text 
                            className="text-slate-800 font-bold uppercase"
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            {booking.paymentStatus} · {booking.paymentMethod || 'Cash'}
                        </Text>
                    </View>
                </View>

                {/* ─── Rating ─── */}
                {booking.status === 'completed' && (
                    <View 
                        className="bg-white shadow-sm border border-slate-100 mb-6"
                        style={{ 
                            borderRadius: RESPONSIVE_CONFIG.cardRadius, 
                            padding: RESPONSIVE_CONFIG.cardPadding,
                            marginBottom: width > 380 ? 24 : 16
                        }}
                    >
                        <View 
                            className="flex-row justify-between items-center mb-4"
                            style={{ marginBottom: width > 380 ? 16 : 12 }}
                        >
                            <Text 
                                className="text-slate-400 font-black uppercase tracking-widest"
                                style={{ fontSize: RESPONSIVE_CONFIG.labelSize }}
                            >
                                {booking.rating > 0 ? "Your Rating" : "Rate this Ride"}
                            </Text>
                            {booking.rating > 0 && (
                                <View 
                                    className="flex-row items-center bg-[#FFFBEB] rounded-full border border-[#FEF3C7]"
                                    style={{ paddingHorizontal: 12, paddingVertical: 6 }}
                                >
                                    <Ionicons name="star" size={RESPONSIVE_CONFIG.badgeSize} color="#F59E0B" />
                                    <Text 
                                        className="text-[#B45309] font-black ml-1"
                                        style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                                    >
                                        {booking.rating}.0
                                    </Text>
                                </View>
                            )}
                        </View>

                        {booking.rating > 0 ? (
                            <Text 
                                className="text-slate-600 italic leading-6"
                                style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                            >
                                {booking.feedback ? `"${booking.feedback}"` : 'No feedback provided.'}
                            </Text>
                        ) : (
                            <View className="items-center">
                                <View className="flex-row gap-3 mb-6">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <TouchableOpacity
                                            key={star}
                                            onPress={() => setUserRating(star)}
                                            activeOpacity={0.7}
                                        >
                                            <Ionicons
                                                name={star <= userRating ? "star" : "star-outline"}
                                                size={RESPONSIVE_CONFIG.iconSize * 1.8}
                                                color={star <= userRating ? "#FFD700" : "#CBD5E1"}
                                            />
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                <TextInput
                                    placeholder="Tell us about your experience..."
                                    placeholderTextColor="#94A3B8"
                                    multiline
                                    numberOfLines={3}
                                    style={{ 
                                        width: '100%',
                                        backgroundColor: '#f8fafc',
                                        borderRadius: 16,
                                        padding: 16,
                                        fontSize: RESPONSIVE_CONFIG.textSize,
                                        color: '#1e293b',
                                        textAlignVertical: 'top',
                                        borderWidth: 1,
                                        borderColor: '#e2e8f0',
                                        minHeight: 100
                                    }}
                                    value={feedbackComment}
                                    onChangeText={setFeedbackComment}
                                />

                                <TouchableOpacity
                                    onPress={handleSubmitReview}
                                    disabled={userRating === 0 || isSubmitting}
                                    className={`w-full mt-6 py-4 rounded-2xl items-center shadow-lg active:scale-95 ${userRating > 0 ? 'bg-slate-900' : 'bg-slate-200'}`}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color="#FFD700" size="small" />
                                    ) : (
                                        <Text className={`font-black uppercase tracking-widest ${userRating > 0 ? 'text-[#FFD700]' : 'text-slate-400'}`}>
                                            SUBMIT FEEDBACK
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* ─── Active Ride Shortcut ─── */}
                {!['completed', 'cancelled'].includes(booking.status) && (
                    <TouchableOpacity
                        onPress={() => router.replace({
                            pathname: "/screens/LiveRideTrackingScreen",
                            params: { bookingId: booking._id }
                        })}
                        className="bg-[#FFD700] rounded-xl items-center justify-center shadow-lg shadow-orange-100 flex-row"
                        style={{ 
                            paddingVertical: width > 380 ? 16 : 14,
                            marginBottom: width > 380 ? 24 : 16
                        }}
                    >
                        <Ionicons name="map" size={RESPONSIVE_CONFIG.iconSize + 2} color="black" />
                        <Text 
                            className="font-black text-black ml-2 uppercase tracking-widest"
                            style={{ fontSize: RESPONSIVE_CONFIG.textSize }}
                        >
                            Track Live Ride
                        </Text>
                    </TouchableOpacity>
                )}

            </ScrollView>
        </View>
    );
}
