import { FontAwesome } from "@expo/vector-icons";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import React, { useState } from "react";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  SlideInLeft,
  SlideInRight,
  SlideOutLeft,
  SlideOutRight,
} from "react-native-reanimated";
import type { Event } from "./types/index";

interface MonthlyViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onBackToYearly: () => void;
  events?: Event[];
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const PADDING = 16; // Total horizontal padding
const CELL_WIDTH = (SCREEN_WIDTH - PADDING) / 7; // Ensure equal width for 7 days

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  selectedDate,
  onSelectDate,
  onBackToYearly,
  events = [],
}) => {
  const [currentMonth, setCurrentMonth] = useState(selectedDate);
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "right"
  );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX < -50) {
        setSlideDirection("left");
        setCurrentMonth(addMonths(currentMonth, 1));
      } else if (event.translationX > 50) {
        setSlideDirection("right");
        setCurrentMonth(subMonths(currentMonth, 1));
      }
    })
    .runOnJS(true);

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
    <GestureHandlerRootView>
      <GestureDetector gesture={swipeGesture}>
        <View className="flex-1 m-2">
          <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
            <TouchableOpacity onPress={onBackToYearly} className="p-2">
              <FontAwesome name="chevron-left" size={24} color="black" />
            </TouchableOpacity>
            <Text className="text-xl font-semibold">
              {format(currentMonth, "MMMM yyyy")}
            </Text>
            <View className="w-12" />
          </View>

          {/* Weekday headers */}
          <View className="flex-row border-b border-gray-100 px-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <View
                key={day}
                style={{ width: CELL_WIDTH }}
                className="items-center py-2"
              >
                <Text className="text-gray-500 text-sm">{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <Animated.View
            key={currentMonth.toISOString()}
            className="flex-1 px-4"
            {...(slideDirection === "left"
              ? {
                  entering: SlideInRight.duration(300),
                  exiting: SlideOutLeft.duration(300),
                }
              : {
                  entering: SlideInLeft.duration(300),
                  exiting: SlideOutRight.duration(300),
                })}
          >
            {weeks.map((week, weekIndex) => (
              <View key={weekIndex} className="flex-row">
                {week.map((date) => (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => onSelectDate(date)}
                    style={{ width: CELL_WIDTH }}
                    className="aspect-square items-center justify-center"
                  >
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center
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
                              : ""
                          }
                          ${isSameDay(date, selectedDate) ? "text-white" : ""}
                          ${
                            isToday(date) && !isSameDay(date, selectedDate)
                              ? "text-blue-500"
                              : ""
                          }
                          ${
                            !isSameDay(date, selectedDate) &&
                            !isToday(date) &&
                            isSameMonth(date, currentMonth)
                              ? "text-gray-900"
                              : ""
                          }
                        `}
                      >
                        {isSameMonth(date, currentMonth)
                          ? format(date, "d")
                          : ""}
                      </Text>
                    </View>
                    {events.some(
                      (event) =>
                        format(new Date(event.startTime), "yyyy-MM-dd") ===
                        format(date, "yyyy-MM-dd")
                    ) && (
                      <View className="w-1 h-1 bg-blue-500 rounded-full mt-1" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </Animated.View>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
