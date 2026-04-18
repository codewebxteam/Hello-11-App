import React from "react";
import "../global.css";
import { Stack, usePathname, router } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, ActivityIndicator, Text, TouchableOpacity, Vibration, AppState, Animated, Easing, Alert, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useAudioPlayer } from "expo-audio";
import { DriverAuthProvider, useDriverAuth } from "../context/DriverAuthContext";
import { driverAPI } from "../utils/api";
import { Audio as ExpoAudio } from 'expo-av';
import { initSocket } from "../utils/socket";
import { registerForPushNotificationsAsync } from "../utils/notifications";
import * as Haptics from "expo-haptics";
import { useResponsive } from "../utils/responsive";
import CustomAlertModal from "../components/CustomAlertModal";
import { setupCustomAlert } from "../utils/alert-override";

import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { notifee, AndroidImportance, AndroidVisibility, AndroidCategory, EventType } from '../utils/notifee-helper';

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

// --- REMOVED REDUNDANT EXPO TASKS ---

if (notifee && typeof notifee.onBackgroundEvent === 'function') {
  notifee.onBackgroundEvent(async ({ type, detail }: any) => {
    if (type === EventType.PRESS || type === (EventType?.PRESS || 'press')) {
      console.log('User pressed a notification in the background', detail.notification);
    }
  });
}

function DriverRealtimeOverlay() {
  const { width: windowWidth, height: windowHeight, isSmallPhone, isTablet } = useResponsive();
  const { isAuthenticated } = useDriverAuth();
  const pathname = usePathname();

  const [isOnline, setIsOnline] = React.useState(false);
  const [driverId, setDriverId] = React.useState<string | null>(null);
  const [activeBooking, setActiveBooking] = React.useState<any>(null);
  const [incomingRide, setIncomingRide] = React.useState<any>(null);
  const activeBookingRef = React.useRef<any>(null);
  const incomingRideRef = React.useRef<any>(null);

  const player = useAudioPlayer("https://freetestdata.com/wp-content/uploads/2021/09/Free_Test_Data_1MB_MP3.mp3");
  const requestTimerRef = React.useRef<any>(null);
  const [isAccepting, setIsAccepting] = React.useState(false);
  const [paymentBlockPopup, setPaymentBlockPopup] = React.useState<{
    visible: boolean;
    message: string;
    pendingCommission: number;
  }>({
    visible: false,
    message: "",
    pendingCommission: 0,
  });
  const requestSlide = React.useRef(new Animated.Value(windowHeight)).current;
  const timerLine = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    const configureAudio = async () => {
      try {
        await ExpoAudio.setAudioModeAsync({
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (e) {
        console.log("Audio configuration error in layout:", e);
      }
    };
    configureAudio();
  }, []);

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
    Animated.timing(requestSlide, { toValue: windowHeight, duration: 250, useNativeDriver: true }).start(() => {
      setIncomingRide(null);
      setIsAccepting(false);
    });
  }, [player, requestSlide, timerLine, windowHeight]);

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
      try {
        if (notifee && typeof notifee.getInitialNotification === 'function') {
          const initialNotification = await notifee.getInitialNotification();
          if (initialNotification?.notification?.data?.type === 'new_ride') {
            const bd = initialNotification.notification.data;
            setIncomingRide({
              bookingId: bd.bookingId,
              fare: "Fetching...",
              pickup: "Fetching Location...",
              drop: "Fetching Location...",
            });
          }
        }
      } catch (e) {
        console.log("Notifee initial notification error:", e);
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

      const onNewRideRequest = async (data: any) => {
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

        // Play audio regardless of AppState to ensure driver hears the 'Call' sound
        try {
          if (player && typeof player.play === 'function') {
            player.loop = true;
            player.volume = 0.5;
            player.play();
          }
        } catch (e) {
          console.log("Error playing audio:", e);
        }

        if (AppState.currentState !== "active") {
          // Standalone APK: Use Notifee for premium 'Full Screen' & 'Call Style' features
          try {
            if (notifee && typeof notifee.createChannel === 'function') {
              await notifee.createChannel({
                id: 'incoming_rides_fullscreen',
                name: 'Incoming Rides (Full Screen)',
                vibration: true,
                vibrationPattern: [0, 1000, 500, 1000, 500],
                importance: AndroidImportance.HIGH || 4,
                visibility: AndroidVisibility.PUBLIC || 1,
                bypassDnd: true,
                sound: 'default',
              });

              await notifee.displayNotification({
                title: 'New Ride Request!',
                body: `New ride from ${data?.pickup || "Pickup"} to ${data?.drop || "Drop"}`,
                data: data,
                android: {
                  channelId: 'incoming_rides_fullscreen',
                  importance: AndroidImportance.HIGH || 4,
                  category: AndroidCategory.CALL || 'call',
                  fullScreenAction: {
                    id: 'default',
                  },
                  pressAction: {
                    id: 'default',
                    launchActivity: 'default',
                  },
                },
              });
            }
          } catch (e) {
            console.error("Foreground Service Notifee Error:", e);
          }
        }
      };

      const onRideRequestCancelled = (data: any) => {
        const currentIncoming = incomingRideRef.current;
        const currentActive = activeBookingRef.current;
        const incomingId = currentIncoming?.bookingId || currentIncoming?._id || currentIncoming?.id;
        const activeId = currentActive?.bookingId || currentActive?._id || currentActive?.id;
        const isIncomingMatch = incomingId && String(incomingId) === String(data.bookingId);
        const isActiveMatch = activeId && String(activeId) === String(data.bookingId);

        if (!isIncomingMatch && !isActiveMatch) return;

        if (isIncomingMatch) {
          clearRideRequest();
        }
        if (isActiveMatch) {
          setActiveBooking(null);
          if (pathname === "/pickup" || pathname === "/active-ride" || pathname === "/start-ride") {
            router.replace("/");
          }
        }

        if (data?.reason) {
          Alert.alert("Ride Reassigned", data.reason);
        }
      };

      const onBookingCancelledByUser = (data: any) => {
        const currentActive = activeBookingRef.current;
        const activeId = currentActive?._id || currentActive?.id || currentActive?.bookingId;
        if (activeId && String(activeId) === String(data.bookingId)) {
          setActiveBooking(null);
        }
      };

      const onScheduledRideReminder = async (data: any) => {
        const pickup = data?.pickup || "Pickup";
        const drop = data?.drop || "Drop";
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

        if (AppState.currentState === "active") {
          Alert.alert(
            "Scheduled Ride Reminder",
            `Ride time ho gaya hai.\n${pickup} -> ${drop}`
          );
          if (data?.bookingId) {
            router.push({ pathname: "/pickup", params: { bookingId: String(data.bookingId) } });
          }
          return;
        }

        try {
          if (notifee && typeof notifee.createChannel === "function") {
            await notifee.createChannel({
              id: "scheduled_ride_reminders",
              name: "Scheduled Ride Reminders",
              vibration: true,
              importance: AndroidImportance.HIGH || 4,
              sound: "default",
            });

            await notifee.displayNotification({
              title: "Scheduled Ride Reminder",
              body: `Ride time started: ${pickup} -> ${drop}`,
              data,
              android: {
                channelId: "scheduled_ride_reminders",
                importance: AndroidImportance.HIGH || 4,
                pressAction: {
                  id: "default",
                  launchActivity: "default",
                },
              },
            });
          } else {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: "Scheduled Ride Reminder",
                body: `Ride time started: ${pickup} -> ${drop}`,
                data,
              },
              trigger: null,
            });
          }
        } catch (e) {
          console.log("Scheduled ride reminder notification error:", e);
        }

        if (data?.bookingId) {
          router.push({ pathname: "/pickup", params: { bookingId: String(data.bookingId) } });
        }
      };

      socket.on("connect", onConnect);
      if (socket.connected) onConnect();
      socket.on("newRideRequest", onNewRideRequest);
      socket.on("rideRequestCancelled", onRideRequestCancelled);
      socket.on("bookingCancelledByUser", onBookingCancelledByUser);
      socket.on("scheduledRideReminder", onScheduledRideReminder);

      return () => {
        socket.off("connect", onConnect);
        socket.off("newRideRequest", onNewRideRequest);
        socket.off("rideRequestCancelled", onRideRequestCancelled);
        socket.off("bookingCancelledByUser", onBookingCancelledByUser);
        socket.off("scheduledRideReminder", onScheduledRideReminder);
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
  }, [isAuthenticated, isOnline, driverId, player, clearRideRequest, pathname, requestSlide, timerLine]);

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

      const isScheduled = incomingRide?.bookingType === "schedule";
      const scheduledAt = incomingRide?.scheduledDate ? new Date(incomingRide.scheduledDate).getTime() : null;
      const isFutureScheduled = isScheduled && !!scheduledAt && scheduledAt > Date.now();

      if (isFutureScheduled) {
        clearRideRequest();
        Alert.alert(
          "Scheduled Ride Accepted",
          `Ye ride scheduled hai (${new Date(incomingRide.scheduledDate).toLocaleString("en-IN")}). Ride time par pickup screen auto-open ho jayegi.`
        );
        return;
      }

      clearRideRequest();
      setActiveBooking({ ...incomingRide, status: "accepted", id: bookingId, _id: bookingId });
      router.push({ pathname: "/pickup", params: { bookingId: String(bookingId) } });
    } catch (error: any) {
      setIsAccepting(false);
      console.error("Accept ride error:", error);
      let parsedFromString: any = null;
      if (typeof error === "string") {
        try {
          parsedFromString = JSON.parse(error);
        } catch {
          parsedFromString = null;
        }
      }
      const apiError =
        error?.response?.data ||
        error?.data ||
        parsedFromString ||
        (typeof error === "object" ? error : {});
      if (apiError?.requiresPayment) {
        clearRideRequest();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setPaymentBlockPopup({
          visible: true,
          message: apiError?.message || "Commission payment pending hai. Wallet me settlement karein.",
          pendingCommission: Number(apiError?.pendingCommission || 0),
        });
        return;
      }
      Alert.alert("Error", apiError?.message || error?.message || "Failed to accept ride.");
    }
  };

  const onIgnoreRide = () => {
    clearRideRequest();
  };

  const isScheduledIncomingRide =
    incomingRide?.bookingType === "schedule" || Boolean(incomingRide?.scheduledDate);

  const scheduledDateLabel = incomingRide?.scheduledDate
    ? new Date(incomingRide.scheduledDate).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : null;
  const requestCardOuterPadding = isSmallPhone ? 10 : isTablet ? 24 : 16;
  const requestCardInnerPadding = isSmallPhone ? 16 : isTablet ? 26 : 24;
  const requestCardRadius = isSmallPhone ? 24 : 32;
  const requestCardMaxWidth = isTablet ? 620 : Math.min(windowWidth - requestCardOuterPadding * 2, 520);
  const fareTextSize = isSmallPhone ? 36 : isTablet ? 52 : 48;
  const metaTextSize = isSmallPhone ? 9 : 10;
  const chipTextSize = isSmallPhone ? 9 : 10;
  const actionButtonHeight = isSmallPhone ? 50 : 56;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Modal
        visible={paymentBlockPopup.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setPaymentBlockPopup((prev) => ({ ...prev, visible: false }))}
      >
        <View className="flex-1 bg-black/55 justify-center" style={{ paddingHorizontal: isSmallPhone ? 12 : 20 }}>
          <TouchableOpacity
            activeOpacity={0.95}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setPaymentBlockPopup((prev) => ({ ...prev, visible: false }));
              router.push("/wallet");
            }}
            className="bg-white rounded-[30px] p-6 border border-amber-200 shadow-2xl"
            style={{ maxWidth: isTablet ? 560 : 460, alignSelf: "center", width: "100%" }}
          >
            <View className="flex-row items-center mb-4">
              <View className="w-14 h-14 rounded-2xl bg-amber-100 items-center justify-center">
                <Ionicons name="wallet-outline" size={28} color="#B45309" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-slate-900 font-black text-base uppercase tracking-wide">Payment Required</Text>
                <Text className="text-slate-500 text-[11px] font-semibold">Tap card to open wallet</Text>
              </View>
              <Ionicons name="chevron-forward" size={22} color="#B45309" />
            </View>

            <Text className="text-slate-700 text-sm leading-5 mb-4">
              {paymentBlockPopup.message}
            </Text>

            <View className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex-row justify-between items-center">
              <Text className="text-amber-700 text-xs font-black uppercase tracking-widest">Pending Commission</Text>
              <Text className="text-amber-700 text-xl font-black">₹{paymentBlockPopup.pendingCommission}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>

      {incomingRide && (
        <Animated.View
          style={{ 
            transform: [{ translateY: requestSlide }], 
            paddingBottom: isSmallPhone ? 10 : 20,
            position: 'absolute',
            bottom: 0,
            width: '100%',
            zIndex: 100,
            paddingHorizontal: requestCardOuterPadding
          }}
        >
          <View style={{
            backgroundColor: '#0F172A',
            borderRadius: requestCardRadius,
            padding: requestCardInnerPadding,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.5,
            shadowRadius: 20,
            elevation: 10,
            borderWidth: 1,
            borderColor: 'rgba(51, 65, 85, 0.5)',
            overflow: 'hidden',
            maxWidth: requestCardMaxWidth,
            width: '100%',
            alignSelf: 'center'
          }}>
            <View className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800">
              <Animated.View
                style={{
                  width: timerLine.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                  backgroundColor: '#FFD700'
                }}
                className="h-full"
              />
            </View>

            <View className="flex-row justify-between items-start mb-5 mt-4">
              <View className="flex-1 pr-2">
                <View className="flex-row items-center mb-1 flex-wrap gap-2">
                  <View className="bg-[#FFD700] px-2 py-0.5 rounded-md">
                    <Text className="text-[#0F172A] font-black uppercase" style={{ fontSize: chipTextSize }}>Premium</Text>
                  </View>
                  {isScheduledIncomingRide && (
                    <View className="bg-sky-500 px-2 py-0.5 rounded-md">
                      <Text className="text-white font-black uppercase" style={{ fontSize: chipTextSize }}>Scheduled Ride</Text>
                    </View>
                  )}
                  {incomingRide?.rideType === 'outstation' && (
                    <View className="bg-orange-500 px-2 py-0.5 rounded-md">
                      <Text className="text-white font-black uppercase" style={{ fontSize: chipTextSize }}>Outstation</Text>
                    </View>
                  )}
                  <Text className="text-slate-400 font-bold uppercase tracking-widest" style={{ fontSize: isSmallPhone ? 10 : 11 }}>Incoming Ride</Text>
                </View>
                <Text className="text-white font-black italic tracking-tighter" style={{ fontSize: fareTextSize }}>₹{incomingRide?.fare || 0}</Text>
                <Text className="text-slate-400 font-bold uppercase tracking-widest mt-1" style={{ fontSize: metaTextSize }}>Estimated Fare</Text>
                {scheduledDateLabel && (
                  <Text className="text-sky-300 font-black uppercase tracking-wider mt-1" style={{ fontSize: metaTextSize }}>
                    {scheduledDateLabel}
                  </Text>
                )}
              </View>

              <View className="items-end ml-2">
                <View className={`${isSmallPhone ? "w-10 h-10" : "w-12 h-12"} bg-slate-800 rounded-full items-center justify-center border border-slate-700 mb-1`}>
                  <Ionicons name="person" size={isSmallPhone ? 20 : 24} color="#CBD5E1" />
                </View>
                <View className="flex-row items-center bg-slate-800/80 px-2 py-1 rounded-lg">
                  <Ionicons name="star" size={10} color="#FFD700" />
                  <Text className="text-white font-bold ml-1" style={{ fontSize: metaTextSize }}>{incomingRide?.passenger?.rating || '5.0'}</Text>
                </View>
              </View>
            </View>

            <View className={`bg-slate-800/50 border border-slate-700/50 mb-5 ${isSmallPhone ? "p-4 rounded-[18px]" : "p-5 rounded-[24px]"}`}>
              <View className="flex-row justify-between mb-5 pb-4 border-b border-slate-700/50">
                <View className="items-center flex-1">
                  <Text className="text-slate-400 font-bold uppercase mb-1" style={{ fontSize: isSmallPhone ? 8 : 9 }}>Distance</Text>
                  <Text className="text-white font-black" style={{ fontSize: isSmallPhone ? 14 : 16 }}>{incomingRide?.distance || 0} KM</Text>
                </View>
                <View className="w-[1px] h-8 bg-slate-700 self-center" />
                <View className="items-center flex-1">
                  <Text className="text-slate-400 font-bold uppercase mb-1" style={{ fontSize: isSmallPhone ? 8 : 9 }}>Ride Type</Text>
                  <Text className="text-white font-black text-xs uppercase" style={{ fontSize: isSmallPhone ? 11 : 12 }}>
                    {incomingRide?.rideType === 'outstation' ? 'Outstation' : 'Normal'}
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
                      <Text className="text-slate-400 font-bold uppercase mb-0.5" style={{ fontSize: metaTextSize }}>Pickup</Text>
                      <Text className="text-white font-bold leading-5" style={{ fontSize: isSmallPhone ? 12 : 14 }} numberOfLines={2}>{incomingRide?.pickup || 'Unknown'}</Text>
                    </View>
                    <View>
                      <Text className="text-slate-400 font-bold uppercase mb-0.5" style={{ fontSize: metaTextSize }}>Dropoff</Text>
                      <Text className="text-white font-bold leading-5" style={{ fontSize: isSmallPhone ? 12 : 14 }} numberOfLines={2}>{incomingRide?.drop || 'Unknown'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <View className="flex-row items-center gap-4">
              <TouchableOpacity
                onPress={onIgnoreRide}
                className="flex-1 bg-slate-800 py-4 rounded-[20px] items-center border border-slate-700 active:bg-slate-700"
                style={{ minHeight: actionButtonHeight, justifyContent: "center" }}
              >
                <Text className="text-slate-300 font-bold uppercase tracking-widest" style={{ fontSize: isSmallPhone ? 11 : 12 }}>Ignore</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onAcceptRide}
                className={`flex-[2] py-4 rounded-[20px] items-center shadow-lg active:bg-[#FCD34D] ${isAccepting ? 'bg-yellow-600/50 shadow-none' : 'bg-[#FFD700] shadow-yellow-500/20'}`}
                style={{ minHeight: actionButtonHeight, justifyContent: "center" }}
              >
                {isAccepting ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text className="text-[#0F172A] font-black uppercase tracking-[2px]" style={{ fontSize: isSmallPhone ? 12 : 14 }}>Accept</Text>
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
          <Stack.Screen name="wallet" />
          <Stack.Screen name="terms" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="refund" />
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
  React.useEffect(() => { setupCustomAlert(); }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DriverAuthProvider>
          <CustomAlertModal />
          <RootLayoutNav />
        </DriverAuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
