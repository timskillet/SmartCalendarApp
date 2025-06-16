import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

interface CalendarPreviewProps {
  onOpenWeeklyView?: () => void;
}

const CalendarPreview: React.FC<CalendarPreviewProps> = ({
  onOpenWeeklyView,
}) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date>(today);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, i) =>
    days.slice(i * 7, (i + 1) * 7)
  );

  return (
    <View className="flex-1 border border-gray-100 rounded-2xl p-4">
      <View className="pb-4">
        <Text className="text-gray-500 text-xl">
          {format(today, "MMMM yyyy")}
        </Text>
      </View>

      {/* Weekday headers */}
      <View className="flex-row justify-between">
        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
          <View key={idx} className="flex-1 items-center">
            <Text className="text-gray-500 text-sm">{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View className="flex-1">
        {weeks.map((week, weekIndex) => (
          <View key={weekIndex} className="flex-row justify-between">
            {week.map((date, idx) => (
              <TouchableOpacity
                key={idx}
                className="flex-1 aspect-square items-center justify-center"
                onPress={() => setSelectedDate(date)}
              >
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center
                        ${isSameDay(date, selectedDate) ? "bg-blue-500" : ""}
                        ${
                          isToday(date) && !isSameDay(date, selectedDate)
                            ? "border border-blue-500"
                            : ""
                        }
                      `}
                >
                  <Text
                    className={`text-sm
                          ${
                            !isSameMonth(date, currentMonth)
                              ? "text-gray-300"
                              : isSameDay(date, selectedDate)
                              ? "text-white"
                              : isToday(date)
                              ? "text-blue-500"
                              : "text-gray-900"
                          }
                        `}
                  >
                    {format(date, "d")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

export default CalendarPreview;
