// app/_layout.tsx
import "../global.css";
import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="pickup" />
      <Stack.Screen name="start-ride" />
      <Stack.Screen name="active-ride" />
    </Stack>
  );
}
