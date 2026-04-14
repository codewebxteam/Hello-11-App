import React from "react";
import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FilterBarProps {
  activeFilters: {
    bookingType: string;
    scheduleView?: string;
    rideType: string;
  };
  onFilterChange: (filters: {
    bookingType?: string;
    scheduleView?: string;
    rideType?: string;
  }) => void;
}

const BOOKING_TYPE_OPTIONS = [
  { label: "Ride Now", value: "now", icon: "flash" as const },
  { label: "Scheduled", value: "schedule", icon: "calendar" as const },
];

const RIDE_TYPE_OPTIONS = [
  { label: "All Rides", value: "all", icon: "layers" as const },
  { label: "Normal", value: "normal", icon: "car" as const },
  { label: "Outstation", value: "outstation", icon: "locate" as const },
];

const SCHEDULE_VIEW_OPTIONS = [
  { label: "Upcoming", value: "upcoming", icon: "time" as const },
  { label: "History", value: "history", icon: "archive" as const },
];

export const HistoryFilterBar: React.FC<FilterBarProps> = ({ activeFilters, onFilterChange }) => {
  const { width } = useWindowDimensions();
  const isCompact = width < 380;

  const handleBookingTypeChange = (bookingType: string) => {
    onFilterChange({
      bookingType,
      scheduleView: bookingType === "schedule" ? activeFilters.scheduleView || "upcoming" : undefined,
      rideType: "",
    });
  };

  const handleRideTypeChange = (rideType: string) => {
    onFilterChange({
      ...activeFilters,
      rideType: rideType === "all" ? "" : rideType,
    });
  };

  const handleScheduleViewChange = (scheduleView: string) => {
    onFilterChange({
      ...activeFilters,
      scheduleView,
    });
  };

  return (
    <View className="bg-white border-b border-slate-100">
      <View className={`px-4 ${isCompact ? "py-3" : "py-5"}`}>
        <View className="flex-row bg-slate-100 rounded-xl p-1 gap-1">
          {BOOKING_TYPE_OPTIONS.map((option) => {
            const isSelected = activeFilters.bookingType === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleBookingTypeChange(option.value)}
                style={{ flex: 1 }}
                className={`py-3 px-3 rounded-lg items-center justify-center flex-row ${
                  isSelected ? "bg-slate-900" : "bg-transparent"
                }`}
              >
                <Ionicons
                  name={option.icon}
                  size={isCompact ? 14 : 16}
                  color={isSelected ? "#FFD700" : "#64748B"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-center font-bold ${isSelected ? "text-[#FFD700]" : "text-slate-600"}`}
                  style={{ fontSize: isCompact ? 12 : 13 }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="h-px bg-slate-100 mx-4" />

      {activeFilters.bookingType === "schedule" && (
        <>
          <View className="px-4 py-3 bg-white">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "center",
                alignItems: "center",
                gap: isCompact ? 10 : 14,
              }}
            >
              {SCHEDULE_VIEW_OPTIONS.map((option) => {
                const isSelected = (activeFilters.scheduleView || "upcoming") === option.value;
                return (
                  <Pressable
                    key={option.value}
                    onPress={() => handleScheduleViewChange(option.value)}
                    className={`px-4 py-2 rounded-lg flex-row items-center border ${
                      isSelected ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"
                    }`}
                  >
                    <Ionicons
                      name={option.icon}
                      size={isCompact ? 11 : 12}
                      color={isSelected ? "#FFD700" : "#64748B"}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      className={`font-semibold ${isSelected ? "text-[#FFD700]" : "text-slate-600"}`}
                      style={{ fontSize: isCompact ? 11 : 12 }}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          <View className="h-px bg-slate-100 mx-4" />
        </>
      )}

      <View className="px-4 py-3 bg-slate-50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: isCompact ? 10 : 14,
          }}
        >
          {RIDE_TYPE_OPTIONS.map((option) => {
            const isSelected = (option.value === "all" && !activeFilters.rideType) || activeFilters.rideType === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => handleRideTypeChange(option.value)}
                className={`px-4 py-2 rounded-lg flex-row items-center border ${
                  isSelected ? "bg-slate-900 border-slate-900" : "bg-white border-slate-200"
                }`}
              >
                <Ionicons
                  name={option.icon}
                  size={isCompact ? 11 : 12}
                  color={isSelected ? "#FFD700" : "#64748B"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`font-semibold ${isSelected ? "text-[#FFD700]" : "text-slate-600"}`}
                  style={{ fontSize: isCompact ? 11 : 12 }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};
