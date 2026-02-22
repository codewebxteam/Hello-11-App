import "../global.css"
import { Stack } from "expo-router";
import NotificationToast from "../components/NotificationToast";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* */}
      </Stack>
      <NotificationToast />
    </>
  );
}