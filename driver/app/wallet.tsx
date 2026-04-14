import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  StatusBar as RNStatusBar,
  Animated,
  Easing,
  FlatList,
  Modal,
  NativeModules,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Calendar, LocaleConfig } from 'react-native-calendars';
import * as Haptics from "expo-haptics";
import RazorpayCheckout from "react-native-razorpay";
import { driverAPI } from "../utils/api";
import Header from "../components/Header";


const STATUSBAR_HEIGHT = Platform.OS === 'android' ? RNStatusBar.currentHeight : 0;

// Shimmer Component
const ShimmerPlaceHolder = ({ className }: { className?: string }) => {
  const { width } = useWindowDimensions();
  const shimmerAnim = useRef(new Animated.Value(-1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const translateX = shimmerAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: [-width, width],
  });

  return (
    <View className={`${className || ""} bg-slate-200 overflow-hidden relative`}>
      <Animated.View
        style={{
          transform: [{ translateX }],
          width: '100%',
          height: '100%',
          position: 'absolute',
        }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
};

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "commissions">("history");
  const [walletData, setWalletData] = useState<any>(null);

  // Pagination & Filtering
  const [txs, setTxs] = useState<any[]>([]);
  const [comms, setComms] = useState<any[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [commPage, setCommPage] = useState(1);
  const [hasMoreTx, setHasMoreTx] = useState(true);
  const [hasMoreComm, setHasMoreComm] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isPaying, setIsPaying] = useState(false);

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week");
  const [range, setRange] = useState<{ start: string | null; end: string | null }>({ start: null, end: null });

  const loadData = async (isRefresh = false, pageNum = 1, period = selectedPeriod, start?: string, end?: string) => {
    try {
      if (!isRefresh && pageNum === 1) setLoading(true);
      if (pageNum > 1) setLoadingMore(true);

      const params: any = {
        period,
        dateFrom: start,
        dateTo: end,
        txPage: activeTab === "history" ? pageNum : txPage,
        commPage: activeTab === "commissions" ? pageNum : commPage,
        txLimit: 20,
        commLimit: 20
      };

      const response = await driverAPI.getEarnings(params.period, params.dateFrom, params.dateTo, params);
      const data = response.data.earnings;

      setWalletData(data);

      if (pageNum === 1) {
        setTxs(data.transactions || []);
        setComms(data.rideCommissions || []);
        setTxPage(1);
        setCommPage(1);
        setHasMoreTx(data.txPagination.page < data.txPagination.pages);
        setHasMoreComm(data.commPagination.page < data.commPagination.pages);
      } else {
        if (activeTab === "history") {
          setTxs(prev => [...prev, ...(data.transactions || [])]);
          setTxPage(pageNum);
          setHasMoreTx(data.txPagination.page < data.txPagination.pages);
        } else {
          setComms(prev => [...prev, ...(data.rideCommissions || [])]);
          setCommPage(pageNum);
          setHasMoreComm(data.commPagination.page < data.commPagination.pages);
        }
      }
    } catch (error) {
      console.error("Failed to load wallet data:", error);
      Alert.alert("Error", "Failed to load wallet information");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const onRefresh = () => {
    setRefreshing(true);
    setTxPage(1);
    setCommPage(1);
    loadData(true, 1);
  };

  const handleLoadMore = () => {
    if (loadingMore) return;
    if (activeTab === "history" && hasMoreTx) {
      loadData(false, txPage + 1);
    } else if (activeTab === "commissions" && hasMoreComm) {
      loadData(false, commPage + 1);
    }
  };

  const handlePayAdmin = async () => {
    if (isPaying) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (!walletData?.pendingCommission || walletData.pendingCommission <= 0) {
      Alert.alert("No Balance", "You don't have any pending commission to pay.");
      return;
    }

    try {
      setIsPaying(true);
      const razorpayNative =
        (NativeModules as any)?.RNRazorpayCheckout ||
        (NativeModules as any)?.RazorpayCheckout;
      if (
        !razorpayNative ||
        !RazorpayCheckout ||
        typeof (RazorpayCheckout as any).open !== "function"
      ) {
        Alert.alert(
          "Razorpay Unavailable",
          "Payment SDK is not loaded in this build. Use a Dev Build / APK (not Expo Go) and rebuild the app."
        );
        return;
      }

      const orderRes = await driverAPI.createPaymentOrder();
      const order = orderRes?.data?.order;
      const keyId = orderRes?.data?.key_id;

      if (!order?.id || !order?.amount || !keyId) {
        Alert.alert("Payment Setup Error", "Payment gateway configuration is incomplete. Please contact support.");
        return;
      }

      const options = {
        description: "Commission Payment to Admin",
        image: "https://i.imgur.com/3986X31.png",
        currency: "INR",
        key: keyId,
        amount: order.amount,
        name: "Hello-11 Admin",
        order_id: order.id,
        prefill: {
          email: "driver@hello11.com",
          contact: "",
          name: "Driver",
        },
        theme: { color: "#FFD700" },
      };

      const data: any = await RazorpayCheckout.open(options);
      await driverAPI.verifyPaymentVerify({
        razorpay_order_id: data.razorpay_order_id,
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Payment successful! Your balance has been updated.");
      onRefresh();
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Order creation failed:", error);
      Alert.alert(
        "Payment Failed",
        error?.reason ||
        error?.description ||
        error?.message ||
        error?.response?.data?.reason ||
        error?.response?.data?.message ||
        "Checkout cancelled"
      );
    } finally {
      setIsPaying(false);
    }
  };

  const renderHeader = () => (
    <View className="px-5 pb-4">
      {/* Premium Hero Banner */}
      <View className="mt-6 rounded-[40px] overflow-hidden shadow-2xl shadow-slate-900/20">
        <LinearGradient
          colors={["#0F172A", "#1E293B", "#334155"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ padding: 32 }}
        >
          {/* Top Row: Title & Badge */}
          <View className="flex-row justify-between items-center mb-8">
            <View className="bg-amber-400/20 px-3 py-1 rounded-full border border-amber-400/30">
              <Text className="text-amber-400 text-[8px] font-black uppercase tracking-widest">Premium Driver Wallet</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-sm shadow-emerald-400/50" />
              <Text className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Active & Verified</Text>
            </View>
          </View>

          {/* Main Stat: Balance */}
          <View className="mb-10">
            <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">
              Payable Commission
            </Text>
            <View className="flex-row items-baseline">
              <Text className="text-white text-5xl font-black italic tracking-tighter">
                ₹{Number(walletData?.pendingCommission || 0).toFixed(2)}
              </Text>
              <View className="ml-3 bg-white/10 px-2 py-0.5 rounded-lg border border-white/5">
                <Text className="text-slate-300 text-[9px] font-bold uppercase">Due</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View className="flex-row justify-between pt-6 border-t border-white/10">
            <View>
              <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Total Lifetime Earned</Text>
              <Text className="text-white text-xl font-black italic">₹{Number(walletData?.lifetimeBalance || 0).toFixed(0)}</Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-500 text-[8px] font-black uppercase mb-1">Rides Pending Pay</Text>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="car-clock" size={14} color="#FFD700" />
                <Text className="text-amber-400 text-xl font-black italic ml-1">{walletData?.unpaidRideCount || 0}</Text>
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Action Area */}
      <View className="flex-row gap-4 mt-8">
        <TouchableOpacity
          onPress={handlePayAdmin}
          disabled={isPaying}
          activeOpacity={0.9}
          className={`flex-[2] rounded-2xl h-14 flex-row items-center justify-center shadow-lg ${
            isPaying ? "bg-amber-300 shadow-amber-300/20" : "bg-amber-400 shadow-amber-400/20"
          }`}
        >
          {isPaying ? (
            <ActivityIndicator size="small" color="#0F172A" />
          ) : (
            <MaterialCommunityIcons name="send-circle" size={24} color="#0F172A" />
          )}
          <Text className="text-[#0F172A] font-black text-sm uppercase tracking-widest ml-2">
            {isPaying ? "Processing..." : "Settlement Now"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setShowCalendar(true)}
          activeOpacity={0.8}
          className="flex-1 bg-white rounded-2xl h-14 items-center justify-center border border-slate-100 shadow-sm"
        >
          <Ionicons name="filter" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Professional Horizontal Tabs */}
      <View className="mt-10 flex-row bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200/50">
        <TouchableOpacity
          onPress={() => setActiveTab("history")}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === "history" ? "bg-white shadow-md border border-slate-100" : ""}`}
        >
          <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === "history" ? "text-slate-900" : "text-slate-400"}`}>
            Payment History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("commissions")}
          className={`flex-1 py-3 rounded-xl items-center ${activeTab === "commissions" ? "bg-white shadow-md border border-slate-100" : ""}`}
        >
          <Text className={`text-[10px] font-black uppercase tracking-widest ${activeTab === "commissions" ? "text-slate-900" : "text-slate-400"}`}>
            Audited Fees
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mt-8 mb-4">
        <Text className="text-slate-900 font-black text-xs uppercase tracking-[3px] opacity-30">
          {activeTab === "history" ? "Transactions" : "Ride Wise Logic"}
        </Text>
      </View>
    </View>
  );

  const renderTransaction = ({ item }: { item: any }) => (
    <View className="bg-white mx-5 mb-4 p-5 rounded-[28px] border border-slate-100 shadow-sm flex-row items-center">
      <View className="w-14 h-14 bg-emerald-50 rounded-[20px] items-center justify-center mr-4 border border-emerald-100">
        <Ionicons name="card" size={24} color="#10B981" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-slate-900 font-black text-sm uppercase tracking-tight">Settlement</Text>
          <View className="ml-2 bg-emerald-100 px-2 py-0.5 rounded-md">
            <Text className="text-emerald-600 text-[8px] font-black">SUCCESS</Text>
          </View>
        </View>
        <Text className="text-slate-400 text-[10px] font-bold mt-1">
          {new Date(item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} • {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
      <View className="items-end">
        <Text className="text-slate-900 font-black text-base italic">₹{Number(item.amount).toFixed(0)}</Text>
        <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Razorpay</Text>
      </View>
    </View>
  );

    const renderCommission = ({ item }: { item: any }) => {
    const fare = Number(item.fare || 0);
    const baseFare = Number(item.baseFare || Math.max(0, fare - Number(item.nightSurcharge || 0)));
    const nightSurcharge = Number(item.nightSurcharge || 0);
    const returnTripFare = Number(item.returnTripFare || 0);
    const penaltyApplied = Number(item.penaltyApplied || 0);
    const tollFee = Number(item.tollFee || 0);
    const totalFare = Number(item.totalFare || (fare + returnTripFare + penaltyApplied + tollFee));

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() =>
          router.push({
            pathname: "/ride-details",
            params: { bookingId: item._id }
          })
        }
        className="bg-white mx-5 mb-4 rounded-[28px] border border-slate-100 shadow-sm overflow-hidden"
      >
        <View className="p-5">
          <View className="flex-row justify-between items-start mb-4">
            <View className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              <Text className="text-slate-500 text-[9px] font-black uppercase tracking-widest">
                Ride Logic Audit
              </Text>
            </View>
            <View className="items-end">
              <Text className="text-slate-900 font-black text-base italic">Rs {Number(item.adminCommission).toFixed(2)}</Text>
              <Text className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Fee Deduction</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-4">
            <View className="bg-blue-50/50 px-2 py-1 rounded-lg">
              <Text className="text-blue-600 text-[9px] font-black">Total Fare: Rs {totalFare.toFixed(0)}</Text>
            </View>
            <Text className="text-slate-300 mx-2 text-xs">|</Text>
            <Text className="text-slate-400 text-[9px] font-bold uppercase">{new Date(item.createdAt).toLocaleDateString()}</Text>
          </View>

          <View className="bg-slate-50 rounded-2xl p-3 border border-slate-100 mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-slate-500 text-[10px] font-bold">Base Fare</Text>
              <Text className="text-slate-800 text-[10px] font-black">Rs {baseFare.toFixed(0)}</Text>
            </View>
            {nightSurcharge > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-indigo-500 text-[10px] font-bold">Night Surcharge</Text>
                <Text className="text-indigo-600 text-[10px] font-black">+Rs {nightSurcharge.toFixed(0)}</Text>
              </View>
            )}
            {returnTripFare > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-blue-500 text-[10px] font-bold">Return Fare</Text>
                <Text className="text-blue-600 text-[10px] font-black">+Rs {returnTripFare.toFixed(0)}</Text>
              </View>
            )}
            {penaltyApplied > 0 && (
              <View className="flex-row justify-between mb-1">
                <Text className="text-red-500 text-[10px] font-bold">Waiting Penalty</Text>
                <Text className="text-red-600 text-[10px] font-black">+Rs {penaltyApplied.toFixed(0)}</Text>
              </View>
            )}
            {tollFee > 0 && (
              <View className="flex-row justify-between">
                <Text className="text-amber-500 text-[10px] font-bold">Toll Fee</Text>
                <Text className="text-amber-600 text-[10px] font-black">+Rs {tollFee.toFixed(0)}</Text>
              </View>
            )}
          </View>

          <View className="flex-row items-center">
            <View className="w-8 h-8 bg-slate-50 rounded-lg items-center justify-center mr-3 border border-slate-100">
              <Ionicons name="location" size={16} color="#64748B" />
            </View>
            <View className="flex-1">
              <Text className="text-slate-400 text-[9px] font-bold uppercase tracking-tight" numberOfLines={1}>
                {item.pickupLocation}
              </Text>
              <Text className="text-slate-900 font-black text-xs mt-0.5" numberOfLines={1}>
                {item.dropLocation}
              </Text>
            </View>
            <View className="ml-2">
              <Ionicons name="chevron-forward" size={14} color="#CBD5E1" />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const ShimmerList = () => (
    <View className="px-5">
      {[1, 2, 3, 4].map((i) => (
        <View key={i} className="bg-white p-5 rounded-[28px] mb-4 border border-slate-100 flex-row items-center shadow-sm">
          <ShimmerPlaceHolder className="w-14 h-14 rounded-[20px] mr-4" />
          <View className="flex-1">
            <ShimmerPlaceHolder className="w-32 h-4 rounded-md mb-2 bg-slate-100" />
            <ShimmerPlaceHolder className="w-20 h-3 rounded-md bg-slate-50" />
          </View>
          <ShimmerPlaceHolder className="w-16 h-8 rounded-xl bg-slate-100" />
        </View>
      ))}
    </View>
  );

  const FooterShimmer = () => (
    <View className="px-5 pt-2">
      {[1, 2].map((i) => (
        <View key={`footer-${i}`} className="bg-white p-5 rounded-[28px] mb-4 border border-slate-100 flex-row items-center shadow-sm">
          <ShimmerPlaceHolder className="w-14 h-14 rounded-[20px] mr-4" />
          <View className="flex-1">
            <ShimmerPlaceHolder className="w-36 h-4 rounded-md mb-2 bg-slate-100" />
            <ShimmerPlaceHolder className="w-24 h-3 rounded-md bg-slate-50" />
          </View>
          <ShimmerPlaceHolder className="w-14 h-8 rounded-xl bg-slate-100" />
        </View>
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-[#F8FAFC]">
      <Header 
        title="Driver Wallet" 
        rightIcon="refresh"
        onRightPress={onRefresh}
      />

      <FlatList
        data={activeTab === "history" ? txs : comms}
        keyExtractor={(item) => item._id}
        renderItem={activeTab === "history" ? renderTransaction : renderCommission}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={loading ? <ShimmerList /> : (
          <View className="bg-white p-12 mx-5 rounded-[40px] items-center border border-slate-100 shadow-sm">
            <View className="w-20 h-20 bg-slate-50 rounded-full items-center justify-center mb-6 border border-slate-100">
              <Ionicons name={activeTab === 'history' ? "receipt" : "car"} size={40} color="#CBD5E1" />
            </View>
            <Text className="text-slate-900 font-black text-sm uppercase tracking-widest text-center">No Records Found</Text>
            <Text className="text-slate-400 font-bold mt-2 text-[10px] text-center uppercase tracking-tighter italic">We couldn't find anything for this period</Text>
          </View>
        )}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={{ paddingBottom: Math.max(20, insets.bottom + 10) }}
        ListFooterComponent={loadingMore ? <FooterShimmer /> : <View className="h-10" />}
      />

      {/* Calendar Filter Modal */}
      <Modal
        visible={showCalendar}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-[#F8FAFC] rounded-[40px] p-6 pb-8 shadow-2xl relative">
            <View className="items-center mb-6">
              <View className="w-12 h-1.5 bg-slate-200 rounded-full mb-6" />
              <Text className="text-slate-900 font-black tracking-widest uppercase text-[12px]">Financial Filter</Text>
              {range.start && (
                <View className="bg-amber-100 px-3 py-1 rounded-lg mt-2 border border-amber-200">
                  <Text className="text-amber-700 font-black text-[9px] uppercase tracking-widest">
                    {range.start} {range.end ? ` to ${range.end}` : ''}
                  </Text>
                </View>
              )}
            </View>

            <Calendar
              onDayPress={(day) => {
                if (!range.start || (range.start && range.end)) {
                  setRange({ start: day.dateString, end: null });
                } else {
                  const start = new Date(range.start);
                  const end = new Date(day.dateString);
                  if (end < start) {
                    setRange({ start: day.dateString, end: null });
                  } else {
                    setRange({ ...range, end: day.dateString });
                  }
                }
              }}
              markedDates={{
                ...(walletData?.dailyStats ? Object.keys(walletData.dailyStats).reduce((acc: any, date) => {
                  acc[date] = { marked: true, dotColor: '#FFD700' };
                  return acc;
                }, {}) : {}),
                ...(range.start ? { [range.start]: { selected: true, selectedColor: '#0F172A', textColor: '#FFD700' } } : {}),
                ...(range.end ? { [range.end]: { selected: true, selectedColor: '#0F172A', textColor: '#FFD700' } } : {}),
              }}
              theme={{
                calendarBackground: '#F8FAFC',
                textSectionTitleColor: '#b6c1cd',
                selectedDayBackgroundColor: '#0F172A',
                selectedDayTextColor: '#FFD700',
                todayTextColor: '#FFD700',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#FFD700',
                monthTextColor: '#0F172A',
                textDayFontWeight: '800',
                textMonthFontWeight: '900',
                textDayHeaderFontWeight: '900',
              }}
            />

            <View className="flex-row gap-4 mt-8">
              <TouchableOpacity 
                onPress={() => setShowCalendar(false)}
                className="flex-1 py-4 bg-white rounded-2xl items-center border border-slate-100"
              >
                <Text className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={!range.start || !range.end}
                onPress={() => {
                  if (range.start && range.end) {
                    setSelectedPeriod('custom');
                    loadData(false, 1, 'custom', range.start, range.end);
                    setShowCalendar(false);
                  }
                }}
                style={{ opacity: (!range.start || !range.end) ? 0.5 : 1 }}
                className="flex-[2.5] py-4 bg-slate-900 rounded-2xl items-center shadow-lg shadow-slate-900/40"
              >
                <Text className="text-amber-400 font-black uppercase tracking-widest text-[11px]">Apply Intelligence</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

