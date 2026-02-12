// app/_layout.tsx
import "../global.css";
import { Stack } from "expo-router";
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="pickup" />
        <Stack.Screen name="start-ride" />
        <Stack.Screen name="active-ride" />
      </Stack>
    </SafeAreaProvider>
  );
}