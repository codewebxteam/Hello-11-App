import React, { useState, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Keyboard,
  Image,
  Alert,
  ActivityIndicator
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { driverAPI } from "../utils/api";
import { getSocket, initSocket } from "../utils/socket";
import * as Location from 'expo-location';

export default function StartRideScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { bookingId } = useLocalSearchParams();

  const [otp, setOtp] = useState(["", "", "", ""]);
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
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
            // Update backend so user sees driver at pickup
            driverAPI.updateLocation({ latitude, longitude }).catch(err =>
              console.log("Failed to update driver location:", err)
            );
          }
        );
      } catch (err) {
        console.error("Error starting location tracking in StartRide:", err);
      }
    };

    const fetchBooking = async () => {
      try {
        const response = await driverAPI.getCurrentBooking();
        if (response.data && response.data.booking) {
          setBooking(response.data.booking);
        }
      } catch (err) {
        console.error("Error fetching booking for OTP:", err);
      } finally {
        setLoading(false);
      }
    };

    startTracking();
    fetchBooking();

    const setupSocket = async () => {
      const s = await initSocket();
      if (s) {
        s.on("bookingCancelledByUser", (data: any) => {
          if (String(data.bookingId) === String(bookingId)) {
            Alert.alert("Ride Cancelled", "The user has cancelled the ride.");
            router.replace("/");
          }
        });
      }
    };
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

  const isOtpComplete = useMemo(
    () => otp.every((digit) => digit !== ""),
    [otp]
  );

  const handleOtpChange = (value: string, index: number) => {
    const numericValue = value.replace(/[^0-9]/g, "");

    const newOtp = [...otp];
    newOtp[index] = numericValue;
    setOtp(newOtp);

    if (numericValue && index < 3) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleStartRide = async () => {
    if (isOtpComplete && booking) {
      Keyboard.dismiss();
      setVerifying(true);
      try {
        const otpString = otp.join("");
        const response = await driverAPI.verifyOtp(booking.id, otpString);
        // Backend returns "OTP verified, ride started"
        if (response.data) {
          router.replace({
            pathname: "/active-ride",
            params: { bookingId: booking.id }
          });
        } else {
          Alert.alert("Invalid OTP", "The OTP entered is incorrect. Please check with the passenger.");
        }
      } catch (err: any) {
        Alert.alert("Verification Failed", err.message || "Failed to verify OTP. Please try again.");
      } finally {
        setVerifying(false);
      }
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View
      className="flex-1 bg-slate-900"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="light" />
      <View className="flex-1 px-6">
        {/* Header */}
        <View className="mt-4 mb-10">
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-10 h-10 bg-slate-800 rounded-xl items-center justify-center border border-slate-700 active:bg-slate-700"
          >
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>

          <Text className="text-white text-3xl font-black mt-6">
            Start Ride
          </Text>
          <Text className="text-slate-400 text-base mt-2">
            Ask passenger for the 4-digit OTP
          </Text>
        </View>

        {/* OTP Section */}
        <View className="flex-row justify-between mb-12">
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputs.current[index] = ref;
              }}
              className={`w-[70px] h-[70px] bg-slate-800 rounded-2xl text-center text-white text-3xl font-black border-2 ${otp[index] ? "border-[#FFD700]" : "border-slate-700"
                }`}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              selectionColor="#FFD700"
              blurOnSubmit={false}
            />
          ))}
        </View>

        {/* Info Card */}
        <View className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 mb-auto">
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 bg-slate-700 rounded-full items-center justify-center border border-slate-600 mr-4 overflow-hidden">
              {booking?.user?.profileImage ? (
                <Image source={{ uri: booking.user.profileImage }} className="w-full h-full" />
              ) : (
                <Text className="text-2xl">👤</Text>
              )}
            </View>

            <View>
              <Text className="text-white text-lg font-bold">
                {booking?.user?.name || 'Passenger'}
              </Text>

              <View className="bg-[#FFD700]/20 self-start px-2 py-0.5 rounded-md mt-1">
                <Text className="text-[#FFD700] text-[10px] font-bold uppercase">
                  {booking?.rideType === 'rental' ? 'Rental Ride' : 'Cash Ride'}
                </Text>
              </View>
            </View>
          </View>

          <View className="h-[1px] bg-slate-700 w-full mb-6" />

          <View className="flex-row justify-between mb-6">
            <View>
              <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                Estimated Fare
              </Text>
              <Text className="text-white text-2xl font-black italic">
                ₹{booking?.fare || 0}
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                Distance
              </Text>
              <Text className="text-white font-bold text-base">
                {booking?.distance || 0} KM
              </Text>
            </View>
          </View>

          <View className="space-y-4">
            <View className="flex-row">
              <View className="w-5 items-center mr-3 mt-1">
                <View className="w-2 h-2 rounded-full bg-green-500" />
                <View className="w-[1px] h-6 bg-slate-700 my-1" />
                <Ionicons name="location" size={16} color="#EF4444" />
              </View>
              <View className="flex-1">
                <View className="mb-3">
                  <Text className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Pickup</Text>
                  <Text className="text-white font-bold text-xs" numberOfLines={3}>
                    {booking?.pickupLocation || 'Unknown'}
                  </Text>
                </View>
                <View>
                  <Text className="text-slate-500 text-[9px] uppercase font-bold mb-0.5">Destination</Text>
                  <Text className="text-white font-bold text-xs" numberOfLines={3}>
                    {booking?.dropLocation || 'Unknown'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          disabled={!isOtpComplete || verifying}
          onPress={handleStartRide}
          className={`w-full py-5 rounded-[24px] items-center flex-row justify-center mb-6 ${isOtpComplete && !verifying
            ? "bg-[#FFD700]"
            : "bg-slate-800 opacity-50"
            }`}
        >
          {verifying ? (
            <ActivityIndicator color="#0F172A" />
          ) : (
            <>
              <Text
                className={`font-black text-lg tracking-[3px] uppercase mr-2 ${isOtpComplete ? "text-[#0F172A]" : "text-slate-500"
                  }`}
              >
                Verify & Start
              </Text>

              {isOtpComplete && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#0F172A"
                />
              )}
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}
