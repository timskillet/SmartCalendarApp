import { format } from "date-fns";
import { Text, TouchableOpacity, View } from "react-native";
import { HOUR_HEIGHT } from "../constants";

interface TimeSlotGridProps {
  hour: Date;
  handleTimeSlotPress: (hour: Date) => void;
}

export const TimeSlotGrid = ({
  hour,
  handleTimeSlotPress,
}: TimeSlotGridProps) => {
  return (
    <View
      key={hour.toISOString()}
      style={{ height: HOUR_HEIGHT }}
      className="flex-row border-b border-gray-100"
    >
      <View className="w-16 items-center justify-start py-2">
        <Text className="text-xs font-bold text-gray-500">
          {format(hour, "h a")}
        </Text>
      </View>
      <TouchableOpacity
        className="flex-1 border-l border-gray-100"
        onPress={() => handleTimeSlotPress(hour)}
      ></TouchableOpacity>
    </View>
  );
};
