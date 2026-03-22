import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface FilterBarProps {
  activeFilters: {
    bookingType: string;
    rideType: string;
  };
  onFilterChange: (filters: {
    bookingType?: string;
    rideType?: string;
  }) => void;
}

const { width } = Dimensions.get("window");
const TAB_WIDTH = (width - 32) / 2; // Responsive tab width

const BOOKING_TYPE_OPTIONS = [
  { label: "Ride Now", value: "now", icon: "flash" as const },
  { label: "Scheduled", value: "schedule", icon: "calendar" as const },
];

const RIDE_TYPE_OPTIONS = [
  { label: "All Rides", value: "all", icon: "layers" as const },
  { label: "Normal", value: "normal", icon: "car" as const },
  { label: "Outstation", value: "outstation", icon: "locate" as const },
];

export const HistoryFilterBar: React.FC<FilterBarProps> = ({
  activeFilters,
  onFilterChange,
}) => {

  const handleBookingTypeChange = (bookingType: string) => {
    console.log('📌 Booking type changed to:', bookingType);
    onFilterChange({
      bookingType,
      rideType: "",
    });
  };

  const handleRideTypeChange = (rideType: string) => {
    console.log('📌 Ride type changed to:', rideType);
    onFilterChange({
      ...activeFilters,
      rideType: rideType === "all" ? "" : rideType,
    });
  };

  return (
    <View className="bg-white border-b border-slate-100">
      {/* Main Tab Switcher - Now vs Scheduled */}
      <View className={`px-4 py-4 ${width > 380 ? "py-5" : "py-4"}`}>
        <View className="flex-row bg-slate-100 rounded-xl p-1 gap-1">
          {BOOKING_TYPE_OPTIONS.map((option) => {
            const isSelected = activeFilters.bookingType === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleBookingTypeChange(option.value)}
                style={{ flex: 1 }}
                className={`py-3 px-3 rounded-lg items-center justify-center flex-row transition-colors ${
                  isSelected
                    ? "bg-slate-900"
                    : "bg-transparent"
                }`}
              >
                <Ionicons
                  name={option.icon}
                  size={width > 380 ? 16 : 14}
                  color={isSelected ? "#FFD700" : "#64748B"}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-center font-bold ${
                    isSelected
                      ? "text-[#FFD700]"
                      : "text-slate-600"
                  }`}
                  style={{ fontSize: width > 380 ? 13 : 12 }}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Divider */}
      <View className="h-px bg-slate-100 mx-4" />

      {/* Ride Type Filter - Centered with spacing */}
      <View className="px-4 py-3 bg-slate-50">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          contentContainerStyle={{ 
            flexGrow: 1, 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: width > 380 ? 16 : 12 
          }}
        >
          {RIDE_TYPE_OPTIONS.map((option) => {
            const isSelected =
              (option.value === "all" && !activeFilters.rideType) ||
              activeFilters.rideType === option.value;

            return (
              <Pressable
                key={option.value}
                onPress={() => handleRideTypeChange(option.value)}
                className={`px-4 py-2 rounded-lg whitespace-nowrap flex-row items-center border ${
                  isSelected
                    ? "bg-slate-900 border-slate-900"
                    : "bg-white border-slate-200"
                }`}
              >
                <Ionicons
                  name={option.icon}
                  size={width > 380 ? 12 : 11}
                  color={isSelected ? "#FFD700" : "#64748B"}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`font-semibold ${
                    isSelected
                      ? "text-[#FFD700]"
                      : "text-slate-600"
                  }`}
                  style={{ fontSize: width > 380 ? 12 : 11 }}
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
