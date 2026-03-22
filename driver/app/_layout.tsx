import React from "react";
import "../global.css";
import { Stack, usePathname, useRouter } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Text, TouchableOpacity, Vibration, AppState, Animated, Easing, Dimensions, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAudioPlayer } from "expo-audio";
import { DriverAuthProvider, useDriverAuth } from "../context/DriverAuthContext";
import { driverAPI } from "../utils/api";
import { initSocket } from "../utils/socket";
import { registerForPushNotificationsAsync, sendLocalNotification } from "../utils/notifications";

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import notifee, { AndroidImportance, AndroidVisibility, AndroidCategory, EventType } from '@notifee/react-native';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND-NOTIFICATION-TASK';
const BACKGROUND_LOCATION_TASK = 'BACKGROUND_LOCATION_TASK';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Location Track Error:', error);
    return;
  }
  if (data) {
    // Just keeping the JS thread alive. The socket handles incoming rides.
    console.log("Background location heartbeat received.");
  }
});

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Background Push Task Error:", error);
    return;
  }
  if (data) {
    const { notification } = data as any;
    const bookingData = notification?.request?.content?.data;
    
    // If it's a new ride, use Notifee to wake up device (Full Screen Action)
    if (bookingData?.type === 'new_ride') {
      try {
        await notifee.createChannel({
          id: 'incoming_rides_fullscreen',
          name: 'Incoming Rides (Full Screen)',
          vibration: true,
          vibrationPattern: [0, 1000, 500, 1000, 500],
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PUBLIC,
          bypassDnd: true,
        });

        await notifee.displayNotification({
          title: '🚕 New Ride Request!',
          body: notification?.request?.content?.body || 'Tap to instantly view the request',
          data: bookingData,
          android: {
            channelId: 'incoming_rides_fullscreen',
            importance: AndroidImportance.HIGH,
            category: AndroidCategory.CALL,
            fullScreenAction: {
              id: 'default',
            },
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
          },
        });
      } catch (e) {
        console.error("Notifee Background Error:", e);
      }
    }
  }
});

Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);

notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type === EventType.PRESS) {
    console.log('User pressed a notification in the background', detail.notification);
  }
});

const { height } = Dimensions.get('window');

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
  const [isAccepting, setIsAccepting] = React.useState(false);
  const requestSlide = React.useRef(new Animated.Value(height)).current;
  const timerLine = React.useRef(new Animated.Value(1)).current;

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
    try {
      // expo-audio player might be released if used during unmount or rapid state changes.
      // We check for 'playing' property as a proxy for the object being valid.
      if (player && typeof player.pause === 'function') {
        const isPlaying = player?.playing;
        if (isPlaying) {
          player.pause();
        }
      }
    } catch (e) {
      console.log("Error pausing player:", e);
    }
    Vibration.cancel();
    timerLine.stopAnimation();
    Animated.timing(requestSlide, { toValue: height, duration: 250, useNativeDriver: true }).start(() => {
      setIncomingRide(null);
      setIsAccepting(false);
    });
  }, [player, height]);

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
    async function checkInitialNotifee() {
      const initialNotification = await notifee.getInitialNotification();
      if (initialNotification?.notification?.data?.type === 'new_ride') {
        const bd = initialNotification.notification.data;
        // The data payload from the backend only gives { bookingId, type }. 
        // We'll set a mock visual that forces them to wait for the overlay, or we can fetch.
        // But if Socket reconnects (which it will on app boot), it'll fire 'newRideRequest' anyway!
        // We can just set a brief loading state or directly set a fallback until socket catches up.
        setIncomingRide({
          bookingId: bd.bookingId,
          fare: "Fetching...",
          pickup: "Fetching Location...",
          drop: "Fetching Location...",
        });
      }
    }
    checkInitialNotifee();
  }, []);

  React.useEffect(() => {
    if (!isAuthenticated || !isOnline || !driverId) {
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

        Vibration.vibrate([0, 1000, 500, 1000, 500], true);
        timerLine.setValue(1);
        Animated.spring(requestSlide, { toValue: 0, tension: 45, friction: 8, useNativeDriver: true }).start();
        Animated.timing(timerLine, { toValue: 0, duration: 30000, easing: Easing.linear, useNativeDriver: false }).start(({ finished }) => { if (finished) clearRideRequest(); });

        if (AppState.currentState === "active") {
          try {
            if (player && typeof player.play === 'function') {
              player.loop = true;
              player.volume = 0.5;
              player.play();
            }
          } catch (e) {
            console.log("Error playing audio:", e);
          }
        } else {
          try {
            notifee.createChannel({
              id: 'incoming_rides_fullscreen',
              name: 'Incoming Rides (Full Screen)',
              vibration: true,
              vibrationPattern: [0, 1000, 500, 1000, 500],
              importance: AndroidImportance.HIGH,
              visibility: AndroidVisibility.PUBLIC,
              bypassDnd: true,
            });

            notifee.displayNotification({
              title: '🚕 New Ride Request!',
              body: `New ride from ${data?.pickup || "Pickup"} to ${data?.drop || "Drop"}`,
              data: data,
              android: {
                channelId: 'incoming_rides_fullscreen',
                importance: AndroidImportance.HIGH,
                category: AndroidCategory.CALL,
                fullScreenAction: {
                  id: 'default',
                },
                pressAction: {
                  id: 'default',
                  launchActivity: 'default',
                },
              },
            });
          } catch (e) {
            console.error("Foreground Service Notifee Error:", e);
          }
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
    if (isAccepting) return;
    try {
      const bookingId = incomingRide?.bookingId || incomingRide?.id || incomingRide?._id;
      if (!bookingId) {
        Alert.alert("Error", "Booking ID not found");
        return;
      }
      setIsAccepting(true);
      await driverAPI.acceptBooking(String(bookingId));
      clearRideRequest();
      setActiveBooking({ ...incomingRide, status: "accepted", id: bookingId, _id: bookingId });
      router.push({ pathname: "/pickup", params: { bookingId: String(bookingId) } });
    } catch (error: any) {
      setIsAccepting(false);
      console.error("Accept ride error:", error);
      Alert.alert("Error", error.response?.data?.message || "Failed to accept ride.");
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
      {incomingRide && (
        <Animated.View
          style={{ transform: [{ translateY: requestSlide }], paddingBottom: 20 }}
          className="absolute bottom-0 w-full z-[100] px-4"
        >
          <View className="bg-[#0F172A] rounded-[32px] p-6 shadow-2xl border border-slate-700/50 overflow-hidden">
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <Animated.View
                style={{
                  width: timerLine.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: '#FFD700'
                }}
                className="h-full"
              />
            </View>

            <View className="flex-row justify-between items-start mb-6 mt-4">
              <View>
                <View className="flex-row items-center mb-1 flex-wrap gap-2">
                  <View className="bg-[#FFD700] px-2 py-0.5 rounded-md">
                    <Text className="text-[#0F172A] text-[10px] font-black uppercase">Premium</Text>
                  </View>
                  {incomingRide?.rideType === 'outstation' && (
                    <View className="bg-orange-500 px-2 py-0.5 rounded-md">
                      <Text className="text-white text-[10px] font-black uppercase">🛣️ Outstation</Text>
                    </View>
                  )}
                  <Text className="text-slate-400 text-xs font-bold uppercase tracking-widest">Incoming Ride</Text>
                </View>
                <Text className="text-white text-5xl font-black italic tracking-tighter">₹{incomingRide?.fare || 0}</Text>
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Estimated Fare</Text>
              </View>

              <View className="items-end">
                <View className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center border border-slate-700 mb-1">
                  <Ionicons name="person" size={24} color="#CBD5E1" />
                </View>
                <View className="flex-row items-center bg-slate-800/80 px-2 py-1 rounded-lg">
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text className="text-white text-[10px] font-bold ml-1">{incomingRide?.passenger?.rating || '5.0'}</Text>
                </View>
              </View>
            </View>

            <View className="bg-slate-800/50 p-5 rounded-[24px] mb-6 border border-slate-700/50">
              <View className="flex-row justify-between mb-6 pb-4 border-b border-slate-700/50">
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Distance</Text>
                  <Text className="text-white font-black text-base">{incomingRide?.distance || 0} KM</Text>
                </View>
                <View className="w-[1px] h-8 bg-slate-700 self-center" />
                <View className="items-center flex-1">
                  <Text className="text-slate-400 text-[9px] font-bold uppercase mb-1">Ride Type</Text>
                  <Text className="text-white font-black text-xs uppercase">
                    {incomingRide?.rideType === 'outstation' ? '🛣️ Outstation' : '🚕 Normal'}
                  </Text>
                </View>
              </View>

              <View className="space-y-6">
                <View className="flex-row">
                  <View className="items-center mr-3 pt-1">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#FFD700]" />
                    <View className="w-[1px] h-8 bg-slate-700 my-1" />
                    <Ionicons name="location" size={16} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <View className="mb-4">
                      <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Pickup</Text>
                      <Text className="text-white font-bold text-sm leading-5" numberOfLines={1}>{incomingRide?.pickup || 'Unknown'}</Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 text-[10px] font-bold uppercase mb-0.5">Dropoff</Text>
                      <Text className="text-white font-bold text-sm leading-5" numberOfLines={1}>{incomingRide?.drop || 'Unknown'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={onIgnoreRide}
                className="flex-1 bg-slate-800 py-4 rounded-[20px] items-center border border-slate-700 active:bg-slate-700"
              >
                <Text className="text-slate-300 font-bold text-xs uppercase tracking-widest">Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onAcceptRide}
                className={`flex-[2] py-4 rounded-[20px] items-center shadow-lg active:bg-[#FCD34D] ${isAccepting ? 'bg-yellow-600/50 shadow-none' : 'bg-[#FFD700] shadow-yellow-500/20'}`}
              >
                {isAccepting ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text className="text-[#0F172A] font-black text-sm uppercase tracking-[3px]">Accept</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}
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
