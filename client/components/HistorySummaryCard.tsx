import React from "react";
import { View, Text } from "react-native";
import { Feather } from "@expo/vector-icons";

interface HistoryStats {
  totalTrips: number;
  totalSpent: number;
  averageRating?: number;
}

export const HistorySummaryCard: React.FC<{ stats: HistoryStats }> = ({ stats }) => {
  return (
    <View className="mx-4 mb-4 rounded-lg overflow-hidden">
      {/* Header with gradient effect (using colored background) */}
      <View className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-t-lg">
        <Text className="text-white text-sm font-semibold">Your Travel Summary</Text>
      </View>

      {/* Stats Grid */}
      <View className="bg-white rounded-b-lg border border-slate-200 border-t-0 p-4">
        <View className="flex-row justify-between">
          {/* Total Trips */}
          <View className="flex-1 items-center py-3 border-r border-slate-200">
            <View className="bg-blue-100 p-3 rounded-full mb-2">
              <Feather name="navigation" size={20} color="#0066cc" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.totalTrips}
            </Text>
            <Text className="text-xs text-slate-500 font-medium mt-1">
              Total Trips
            </Text>
          </View>

          {/* Total Spent */}
          <View className="flex-1 items-center py-3 border-r border-slate-200">
            <View className="bg-green-100 p-3 rounded-full mb-2">
              <Feather name="credit-card" size={20} color="#22c55e" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              ₹{stats.totalSpent}
            </Text>
            <Text className="text-xs text-slate-500 font-medium mt-1">
              Total Spent
            </Text>
          </View>

          {/* Average Rating */}
          <View className="flex-1 items-center py-3">
            <View className="bg-orange-100 p-3 rounded-full mb-2">
              <Feather name="star" size={20} color="#f97316" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.averageRating?.toFixed(1) ?? "--"}
            </Text>
            <Text className="text-xs text-slate-500 font-medium mt-1">
              Avg Rating
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
