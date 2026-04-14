import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, RefreshControl, useWindowDimensions } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { userAPI } from "../utils/api";
import Shimmer from "./Shimmer";
import { HistoryFilterBar } from "./HistoryFilterBar";

interface ActivitySectionProps {
  onBookRide: () => void;
}

const statusLabel = (status: string) => {
  if (status === "completed") return { text: "Completed", tone: "text-green-600", bg: "bg-green-50" };
  if (status === "cancelled") return { text: "Cancelled", tone: "text-red-600", bg: "bg-red-50" };
  if (status === "scheduled") return { text: "Scheduled", tone: "text-sky-600", bg: "bg-sky-50" };
  if (["accepted", "arrived", "started"].includes(status)) return { text: "Active", tone: "text-blue-600", bg: "bg-blue-50" };
  return { text: status, tone: "text-slate-600", bg: "bg-slate-50" };
};

const RenderRideItem = ({
  item,
  onRidePress,
  compact,
}: {
  item: any;
  onRidePress: (item: any) => void;
  compact: boolean;
}) => {
  const isActive = ["accepted", "arrived", "started"].includes(item.status);
  const badge = statusLabel(item.status);

  return (
    <View className="bg-white mb-3 shadow-sm border border-slate-100 rounded-2xl overflow-hidden">
      <View style={{ padding: compact ? 14 : 18 }}>
        <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-slate-50 gap-2">
          <View className="flex-row items-center bg-slate-50 px-3 py-1.5 rounded-lg flex-1">
            <Ionicons name="calendar-outline" size={compact ? 13 : 15} color="#64748B" />
            <Text className="text-slate-600 font-bold ml-1.5 flex-1" style={{ fontSize: compact ? 11 : 12 }} numberOfLines={1}>
              {new Date(item.bookingType === "schedule" ? item.scheduledDate : item.createdAt).toLocaleDateString([], {
                day: "2-digit",
                month: "short",
              })}
            </Text>
          </View>
          <View className={`px-3 py-1.5 rounded-lg ${badge.bg}`}>
            <Text className={`font-black uppercase tracking-wider ${badge.tone}`} style={{ fontSize: compact ? 10 : 11 }}>
              {badge.text}
            </Text>
          </View>
        </View>

        <View className="flex-row items-start mb-4 relative">
          <View className="absolute left-[8px] top-4 bottom-4 w-0.5 bg-slate-100 border-l border-dashed border-slate-300" />
          <View className="flex-1 gap-3">
            <View className="flex-row items-center">
              <View className={`${compact ? "w-4 h-4" : "w-5 h-5"} rounded-full bg-blue-50 border-2 border-blue-100 items-center justify-center`}>
                <View className={`${compact ? "w-1.5 h-1.5" : "w-2 h-2"} rounded-full bg-blue-500`} />
              </View>
              <Text className="text-slate-800 font-bold ml-3 flex-1" style={{ fontSize: compact ? 13 : 14 }} numberOfLines={2}>
                {item.pickupLocation}
              </Text>
            </View>
            <View className="flex-row items-center">
              <View className={`${compact ? "w-4 h-4" : "w-5 h-5"} rounded-full bg-orange-50 border-2 border-orange-100 items-center justify-center`}>
                <View className={`${compact ? "w-1.5 h-1.5" : "w-2 h-2"} rounded-full bg-orange-500`} />
              </View>
              <Text className="text-slate-800 font-bold ml-3 flex-1" style={{ fontSize: compact ? 13 : 14 }} numberOfLines={2}>
                {item.dropLocation}
              </Text>
            </View>
          </View>
        </View>

        {Number(item.tollFee || 0) > 0 && (
          <View className="flex-row justify-between items-center mb-3 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1.5">
            <Text className="text-amber-700 font-bold uppercase tracking-wide text-[10px]">Toll</Text>
            <Text className="text-amber-700 font-bold text-[11px]">+Rs {Number(item.tollFee || 0)}</Text>
          </View>
        )}

        <View className="flex-row justify-between items-center pt-2 border-t border-slate-50 gap-2">
          <View className="flex-row items-center flex-1 min-w-0">
            <View className="bg-slate-100 p-1.5 rounded-lg">
              <Ionicons name="car-sport-outline" size={compact ? 12 : 14} color="#475569" />
            </View>
            <Text className="text-slate-400 font-bold uppercase tracking-wider ml-2 flex-1" style={{ fontSize: compact ? 10 : 11 }} numberOfLines={1}>
              {item.rideType} - {item.distance}km
            </Text>
          </View>
          <TouchableOpacity onPress={() => onRidePress(item)} className={`px-3 py-1.5 rounded-lg flex-row items-center ${isActive ? "bg-blue-600" : "bg-slate-900"}`}>
            <Text className="text-white font-black uppercase tracking-wider" style={{ fontSize: compact ? 10 : 11 }}>
              {isActive ? "Track" : "Details"}
            </Text>
            <Ionicons name="chevron-forward" size={compact ? 10 : 12} color="white" style={{ marginLeft: 3 }} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const ActivitySection: React.FC<ActivitySectionProps> = ({ onBookRide }) => {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ bookingType: "now", scheduleView: undefined as string | undefined, rideType: "" });
  const router = useRouter();

  useEffect(() => {
    fetchHistory(1, false);
  }, [filters.bookingType, filters.scheduleView, filters.rideType]);

  const fetchHistory = async (nextPage = 1, append = false) => {
    try {
      if (append) setLoadingMore(true);
      else setLoading(true);

      const queryParams: any = {
        page: nextPage,
        limit: 10,
        bookingType: filters.bookingType || "now",
        ...(filters.bookingType === "schedule" && filters.scheduleView ? { scheduleView: filters.scheduleView } : {}),
        ...(filters.rideType ? { rideType: filters.rideType } : {}),
      };

      const response = await userAPI.getHistory(queryParams.page, queryParams.limit, queryParams);
      const newRides = response.data.bookings || [];
      const pages = response.data.pagination?.pages || 1;

      setRides((prev) => (append ? [...prev, ...newRides] : newRides));
      setTotalPages(pages);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPage(1);
    setRides([]);
    setLoadingMore(false);
  };

  const handleRidePress = useCallback(
    (item: any) => {
      const activeStatuses = ["accepted", "arrived", "started"];
      const bookingId = item._id || item.id;

      if (activeStatuses.includes(item.status)) {
        router.push({
          pathname: "/screens/LiveRideTrackingScreen",
          params: { bookingId },
        });
      } else {
        router.push({
          pathname: "/screens/RideDetailsScreen",
          params: {
            bookingId: String(bookingId),
            prefill: JSON.stringify(item),
          },
        });
      }
    },
    [router]
  );

  if (loading && page === 1) {
    return (
      <View className="flex-1 bg-slate-50">
        <HistoryFilterBar activeFilters={filters} onFilterChange={handleFilterChange} />
        <View style={{ paddingHorizontal: compact ? 12 : 16, paddingTop: 14 }}>
          <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"><Shimmer height={90} /></View>
          <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"><Shimmer height={90} /></View>
          <View className="bg-white rounded-2xl p-4 mb-3 border border-slate-100"><Shimmer height={90} /></View>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      <HistoryFilterBar activeFilters={filters} onFilterChange={handleFilterChange} />
      <View className="flex-1">
        {rides.length > 0 ? (
          <FlatList
            data={rides}
            renderItem={({ item }) => <RenderRideItem item={item} onRidePress={handleRidePress} compact={compact} />}
            keyExtractor={(item, index) => (item._id || item.id || index).toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: compact ? 10 : 14, paddingVertical: 10, paddingBottom: 100 }}
            refreshControl={<RefreshControl refreshing={loading} onRefresh={() => fetchHistory(1, false)} tintColor="#FFD700" />}
            onEndReached={() => !loadingMore && page < totalPages && fetchHistory(page + 1, true)}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loadingMore ? (
                <View className="py-4 items-center">
                  <Text className="text-slate-400 font-medium text-xs">Loading...</Text>
                </View>
              ) : page < totalPages ? (
                <TouchableOpacity onPress={() => fetchHistory(page + 1, true)} className="bg-slate-900 mx-4 py-3 px-6 rounded-lg mb-6 flex-row items-center justify-center">
                  <Text className="text-[#FFD700] font-black uppercase text-sm tracking-widest">Load More</Text>
                </TouchableOpacity>
              ) : (
                <View className="py-4 items-center">
                  <Text className="text-slate-400 font-medium text-xs">No more rides</Text>
                </View>
              )
            }
          />
        ) : (
          <View className="flex-1 justify-center items-center px-4">
            <View className={`${compact ? "p-4" : "p-6"} bg-white rounded-full shadow-lg shadow-slate-200 mb-6`}>
              <MaterialCommunityIcons name="clock-time-eight-outline" size={compact ? 48 : 64} color="#CBD5E1" />
            </View>
            <Text className="font-black text-slate-800 mb-2 text-center" style={{ fontSize: compact ? 20 : 24 }}>
              No Rides
            </Text>
            <Text className="text-slate-400 text-center font-medium leading-5 px-4 mb-8" style={{ fontSize: compact ? 13 : 14 }}>
              {filters.rideType && filters.rideType !== "all"
                ? `No ${filters.rideType} rides found.`
                : filters.bookingType === "schedule"
                  ? `No ${filters.scheduleView === "history" ? "scheduled history" : "upcoming scheduled"} rides yet.`
                  : "No immediate rides yet."}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onBookRide}
              className="bg-slate-900 rounded-2xl shadow-xl shadow-slate-900/20 flex-row items-center"
              style={{ paddingHorizontal: compact ? 24 : 32, paddingVertical: compact ? 12 : 14 }}
            >
              <Text className="text-[#FFD700] font-black tracking-wide" style={{ fontSize: compact ? 14 : 16 }}>
                BOOK A RIDE
              </Text>
              <Ionicons name="arrow-forward" size={compact ? 16 : 20} color="#FFD700" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default ActivitySection;
