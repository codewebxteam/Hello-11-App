import React from "react";
import "../global.css";
import { Stack, Redirect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View, ActivityIndicator, Text } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useAuth();

  // Show loader while checking auth state
  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text className="text-slate-400 font-bold mt-4">Loading...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="screens/HomeScreen" />
            <Stack.Screen name="screens/BookingScreen" />
            <Stack.Screen name="screens/ChatScreen" />
            <Stack.Screen name="screens/LiveRideTrackingScreen" />
            <Stack.Screen name="screens/NotificationsScreen" />
            <Stack.Screen name="screens/OutstationBookingScreen" />
            <Stack.Screen name="screens/ProfileScreen" />
            <Stack.Screen name="screens/RideCompletionScreen" />
            <Stack.Screen name="screens/RideDetailsScreen" />
            <Stack.Screen name="screens/ScheduledRidesScreen" />
            <Stack.Screen name="screens/HistoryScreen" />
            <Stack.Screen name="screens/ThankYouScreen" />
            <Stack.Screen name="screens/WaitingTimerScreen" />
          </>
        ) : (
          <>
            <Stack.Screen name="index" />
            <Stack.Screen name="screens/LoginScreen" />
            <Stack.Screen name="screens/registerScreen" />
            <Stack.Screen name="screens/ForgotPasswordScreen" />
          </>
        )}
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
