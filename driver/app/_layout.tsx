import React from "react";
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Text } from "react-native";
import { StatusBar } from "expo-status-bar";
import { DriverAuthProvider, useDriverAuth } from "../context/DriverAuthContext";

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useDriverAuth();

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

  // If user is logged in, show all driver app screens
  if (isAuthenticated) {
    return (
      <>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="active-ride" />
          <Stack.Screen name="chat" />
          <Stack.Screen name="documents" />
          <Stack.Screen name="earnings" />
          <Stack.Screen name="edit-profile" />
          <Stack.Screen name="edit-vehicle" />
          <Stack.Screen name="history" />
          <Stack.Screen name="payment" />
          <Stack.Screen name="pickup" />
          <Stack.Screen name="profile" />
          <Stack.Screen name="ride-details" />
          <Stack.Screen name="ride-summary" />
          <Stack.Screen name="start-ride" />
          <Stack.Screen name="waiting-for-return" />
        </Stack>
        <StatusBar style="dark" />
      </>
    );
  }

  // If not logged in, show auth screens
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(auth)/forgot-password" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DriverAuthProvider>
          <RootLayoutNav />
        </DriverAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
