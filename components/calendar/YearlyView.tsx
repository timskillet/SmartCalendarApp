import {
  addYears,
  eachDayOfInterval,
  eachMonthOfInterval,
  endOfMonth,
  endOfYear,
  format,
  isToday,
  startOfMonth,
  startOfYear,
  subYears,
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

interface YearlyViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const MONTH_PADDING = 16;
const MONTH_WIDTH = (SCREEN_WIDTH - MONTH_PADDING * 3) / 2;

export const YearlyView: React.FC<YearlyViewProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [currentYear, setCurrentYear] = useState(startOfYear(selectedDate));
  const [slideDirection, setSlideDirection] = useState<"left" | "right">(
    "left"
  );

  /* CALENDAR DATA */
  const months = eachMonthOfInterval({
    start: startOfYear(currentYear),
    end: endOfYear(currentYear),
  });

  /* GESTURE HANDLING */
  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX < -50) {
        setSlideDirection("left");
        setCurrentYear(addYears(currentYear, 1));
      } else if (event.translationX > 50) {
        setSlideDirection("right");
        setCurrentYear(subYears(currentYear, 1));
      }
    })
    .runOnJS(true);

  const renderMonth = (month: Date) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    const firstDayOfMonth = monthStart.getDay();

    // Days in month
    const days = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    // Empty cells for days before the first day of the month
    const emptyCells = Array.from({ length: firstDayOfMonth });

    const weekDayLabels = [
      { key: "Sun", label: "S" },
      { key: "Mon", label: "M" },
      { key: "Tue", label: "T" },
      { key: "Wed", label: "W" },
      { key: "Thu", label: "T" },
      { key: "Fri", label: "F" },
      { key: "Sat", label: "S" },
    ];

    return (
      <TouchableOpacity
        key={month.toISOString()}
        onPress={() => onSelectDate(month)}
        className="p-2"
        style={{ width: MONTH_WIDTH }}
      >
        <Text className="font-bold text-xl mb-2">{format(month, "MMMM")}</Text>
        <View className="flex-row flex-wrap">
          {weekDayLabels.map(({ key, label }) => (
            <Text
              key={key}
              className="text-xs text-gray-500 text-center"
              style={{ width: (MONTH_WIDTH - 16) / 7 }}
            >
              {label}
            </Text>
          ))}

          {/* Empty cells for start of month */}
          {emptyCells.map((_, index) => (
            <View
              key={`empty-start-${index}`}
              style={{ width: (MONTH_WIDTH - 16) / 7 }}
              className="items-center py-1"
            />
          ))}

          {/* Days in month */}
          {days.map((date) => (
            <View
              key={date.toISOString()}
              style={{ width: (MONTH_WIDTH - 16) / 7 }}
              className="items-center py-1"
            >
              <Text
                className={`text-xs ${
                  isToday(date)
                    ? "text-white font-bold rounded-full bg-blue-500"
                    : "text-gray-900"
                }`}
              >
                {format(date, "d")}
              </Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <GestureDetector gesture={swipeGesture}>
        <View className="flex-1">
          <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
            <Text className="text-xl font-semibold">
              {format(currentYear, "yyyy")}
            </Text>
          </View>
          <Animated.ScrollView
            key={currentYear.getFullYear()}
            className="flex-1 p-4"
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
            <View className="flex-row flex-wrap justify-between">
              {months.map(renderMonth)}
            </View>
          </Animated.ScrollView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};
