import React from "react";
import "../global.css";
import { Stack, usePathname, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Text, TouchableOpacity, Vibration, AppState } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useAudioPlayer } from "expo-audio";
import { DriverAuthProvider, useDriverAuth } from "../context/DriverAuthContext";
import { driverAPI } from "../utils/api";
import { initSocket } from "../utils/socket";
import { registerForPushNotificationsAsync, sendLocalNotification } from "../utils/notifications";

function DriverRealtimeOverlay() {
  const { isAuthenticated } = useDriverAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [isOnline, setIsOnline] = React.useState(false);
  const [driverId, setDriverId] = React.useState<string | null>(null);
  const [activeBooking, setActiveBooking] = React.useState<any>(null);
  const [incomingRide, setIncomingRide] = React.useState<any>(null);
  const activeBookingRef = React.useRef<any>(null);
  const incomingRideRef = React.useRef<any>(null);

  const player = useAudioPlayer("https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3");
  const requestTimerRef = React.useRef<any>(null);

  React.useEffect(() => {
    activeBookingRef.current = activeBooking;
  }, [activeBooking]);

  React.useEffect(() => {
    incomingRideRef.current = incomingRide;
  }, [incomingRide]);

  const clearRideRequest = React.useCallback(() => {
    if (requestTimerRef.current) {
      clearTimeout(requestTimerRef.current);
      requestTimerRef.current = null;
    }
    if (player.playing) {
      player.pause();
    }
    Vibration.cancel();
    setIncomingRide(null);
  }, [player]);

  const refreshDashboardState = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await driverAPI.getDashboard();
      const dashboard = response.data?.dashboard;
      if (!dashboard) return;

      const driver = dashboard.driver || {};
      setDriverId(driver.id || driver._id || null);
      setIsOnline(Boolean(driver.online));

      const booking = dashboard.currentBooking;
      if (booking && !["completed", "cancelled"].includes(String(booking.status))) {
        setActiveBooking(booking);
      } else {
        setActiveBooking(null);
      }
    } catch (error) {
      console.log("Realtime dashboard refresh failed:", error);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    refreshDashboardState();
    const interval = setInterval(refreshDashboardState, 20000);
    return () => clearInterval(interval);
  }, [refreshDashboardState]);

  React.useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        refreshDashboardState();
      }
    });

    return () => subscription.remove();
  }, [refreshDashboardState]);

  React.useEffect(() => {
    if (!isAuthenticated || !isOnline) return;

    let cancelled = false;
    const syncPushToken = async () => {
      try {
        const token = await registerForPushNotificationsAsync();
        if (!cancelled && token) {
          await driverAPI.updateVehicle({ pushToken: token });
        }
      } catch (error) {
        console.log("Push token sync failed:", error);
      }
    };

    syncPushToken();
    return () => { cancelled = true; };
  }, [isAuthenticated, isOnline]);

  React.useEffect(() => {
    if (!isAuthenticated || !isOnline || !driverId || pathname === "/") {
      return;
    }

    let mounted = true;

    const attachListeners = async () => {
      const socket = await initSocket();
      if (!mounted) return;

      const onConnect = () => {
        socket.emit("join", driverId);
      };

      const onNewRideRequest = (data: any) => {
        setIncomingRide(data);

        if (requestTimerRef.current) {
          clearTimeout(requestTimerRef.current);
        }

        requestTimerRef.current = setTimeout(() => {
          clearRideRequest();
        }, 30000);

        Vibration.vibrate([0, 500, 500, 500], true);

        if (AppState.currentState === "active") {
          player.loop = true;
          player.volume = 0.5;
          player.play();
        } else {
          sendLocalNotification(
            "New Ride Request",
            `New ride from ${data?.pickup || "Pickup"} to ${data?.drop || "Drop"}`,
            data
          );
        }
      };

      const onRideRequestCancelled = (data: any) => {
        const currentIncoming = incomingRideRef.current;
        if (!currentIncoming) return;
        const incomingId = currentIncoming.bookingId || currentIncoming._id || currentIncoming.id;
        if (String(incomingId) === String(data.bookingId)) {
          clearRideRequest();
        }
      };

      const onBookingCancelledByUser = (data: any) => {
        const currentActive = activeBookingRef.current;
        const activeId = currentActive?._id || currentActive?.id || currentActive?.bookingId;
        if (activeId && String(activeId) === String(data.bookingId)) {
          setActiveBooking(null);
        }
      };

      socket.on("connect", onConnect);
      if (socket.connected) onConnect();
      socket.on("newRideRequest", onNewRideRequest);
      socket.on("rideRequestCancelled", onRideRequestCancelled);
      socket.on("bookingCancelledByUser", onBookingCancelledByUser);

      return () => {
        socket.off("connect", onConnect);
        socket.off("newRideRequest", onNewRideRequest);
        socket.off("rideRequestCancelled", onRideRequestCancelled);
        socket.off("bookingCancelledByUser", onBookingCancelledByUser);
      };
    };

    let cleanup: undefined | (() => void);

    attachListeners().then((off) => {
      cleanup = off;
    });

    return () => {
      mounted = false;
      if (cleanup) cleanup();
      clearRideRequest();
    };
  }, [isAuthenticated, isOnline, driverId, pathname, player, clearRideRequest]);

  const onAcceptRide = async () => {
    try {
      const bookingId = incomingRide?.bookingId || incomingRide?.id || incomingRide?._id;
      if (!bookingId) return;

      await driverAPI.acceptBooking(String(bookingId));
      clearRideRequest();
      setActiveBooking({ ...incomingRide, status: "accepted", id: bookingId, _id: bookingId });
      router.push({ pathname: "/pickup", params: { bookingId: String(bookingId) } });
    } catch (error: any) {
      clearRideRequest();
      console.log("Accept ride error:", error);
    }
  };

  const onIgnoreRide = () => {
    clearRideRequest();
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {incomingRide ? (
        <View className="absolute top-[32%] self-center z-[60] bg-[#0F172A] rounded-3xl p-5 border border-slate-700 min-w-[300px] max-w-[92%]">
          <Text className="text-[#FFD700] font-black uppercase tracking-widest text-[10px]">Incoming Ride Request</Text>
          <Text className="text-white text-3xl font-black mt-2">Rs {incomingRide?.fare || 0}</Text>
          <Text className="text-slate-300 font-bold mt-2" numberOfLines={1}>Pickup: {incomingRide?.pickup || "Unknown"}</Text>
          <Text className="text-slate-300 font-bold mt-1" numberOfLines={1}>Drop: {incomingRide?.drop || "Unknown"}</Text>

          <View className="flex-row mt-4">
            <TouchableOpacity onPress={onIgnoreRide} className="flex-1 bg-slate-700 py-3 rounded-xl items-center mr-2">
              <Text className="text-slate-100 font-bold text-xs uppercase tracking-widest">Ignore</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onAcceptRide} className="flex-1 bg-[#FFD700] py-3 rounded-xl items-center ml-2">
              <Text className="text-[#0F172A] font-black text-xs uppercase tracking-widest">Accept</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </>
  );
}

function RootLayoutNav() {
  const { isLoading, isAuthenticated } = useDriverAuth();

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFC] justify-center items-center">
        <ActivityIndicator size="large" color="#FFD700" />
        <Text className="text-slate-400 font-bold mt-4">Loading...</Text>
        <StatusBar style="dark" />
      </View>
    );
  }

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
        <DriverRealtimeOverlay />
        <StatusBar style="dark" />
      </>
    );
  }

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
