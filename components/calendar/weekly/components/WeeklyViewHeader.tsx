import { FontAwesome } from "@expo/vector-icons";
import { format, isSameDay, isToday } from "date-fns";
import { Text, TouchableOpacity, View } from "react-native";
import { getDays } from "../../utils/utils";

interface WeeklyViewHeaderProps {
  headerRef: React.RefObject<View>;
  weekRowRef: React.RefObject<View>;
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onBackToMonthly: () => void;
}

export const WeeklyViewHeader: React.FC<WeeklyViewHeaderProps> = ({
  headerRef,
  weekRowRef,
  selectedDate,
  onSelectDate,
  onBackToMonthly,
}) => {
  const days = getDays(selectedDate);

  return (
    <View ref={headerRef} className="px-4 py-2 border-b border-gray-200">
      <View className="flex-row justify-between items-center">
        <TouchableOpacity className="p-2" onPress={onBackToMonthly}>
          <FontAwesome name="chevron-left" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold">
          {format(selectedDate, "MMMM yyyy")}
        </Text>
        <View className="w-12"></View>
      </View>

      <View ref={weekRowRef} className="flex-row justify-between mt-4">
        {days.map((date) => (
          <TouchableOpacity
            key={date.toISOString()}
            onPress={() => {
              onSelectDate(date);
            }}
            className="items-center py-2"
          >
            <Text className="text-xs text-gray-500">{format(date, "EEE")}</Text>
            <View
              className={`w-9 h-9 rounded-lg items-center justify-center
                ${
                  isSameDay(date, selectedDate)
                    ? isToday(date)
                      ? "bg-blue-500"
                      : "bg-black"
                    : ""
                }
              `}
            >
              <Text
                className={`text-lg ${
                  isSameDay(date, selectedDate)
                    ? "text-white"
                    : isToday(date)
                    ? "text-blue-500"
                    : "text-black"
                }`}
              >
                {format(date, "d")}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};
