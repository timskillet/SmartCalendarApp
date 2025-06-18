import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { Calendar } from "./types";

interface CalendarCardProps {
  calendar: Calendar;
  onPress: (calendar: Calendar) => void;
}

export const CalendarCard: React.FC<CalendarCardProps> = ({
  calendar,
  onPress,
}) => {
  return (
    <TouchableOpacity
      className="p-4 bg-white rounded-lg w-[200px] shadow-sm"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: calendar.color,
      }}
      onPress={() => onPress(calendar)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center mb-2">
        <View
          className="w-3 h-3 rounded-full mr-2"
          style={{ backgroundColor: calendar.color }}
        />
        <Text
          className="text-lg font-bold flex-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {calendar.name}
        </Text>
        {calendar.is_primary && (
          <MaterialIcons name="star" size={16} color="#FFD700" />
        )}
      </View>
      <Text className="text-sm text-gray-500" numberOfLines={1}>
        {calendar.createdAt
          ? `Created ${new Date(calendar.createdAt).toLocaleDateString()}`
          : "Created recently"}
      </Text>
      <View className="flex-row items-center mt-2">
        <MaterialIcons name="arrow-forward" size={16} color="#6B7280" />
        <Text className="text-xs text-gray-500 ml-1">View calendar</Text>
      </View>
    </TouchableOpacity>
  );
};
