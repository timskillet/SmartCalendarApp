import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import {
  format,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  startOfWeek,
  endOfWeek,
  isToday,
  isSameDay,
  addHours,
  startOfDay,
  addMinutes,
} from "date-fns";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import FontAwesome from "react-native-vector-icons/FontAwesome";

interface WeeklyViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onBackToMonthly: () => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const HOUR_HEIGHT = 60;
const MINUTES_IN_HOUR = 60;
const SCROLL_THRESHOLD = 40;

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onSelectDate,
  onBackToMonthly,
}) => {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);

  const translateY = useSharedValue(0);
  const dragStartTime = useSharedValue("");

  // Add refs to measure header components
  const headerRef = useRef<View>(null);
  const weekRowRef = useRef<View>(null);

  // Add state for measuring grid position
  const gridRef = useRef<View>(null);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  const days = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek),
  });

  const hours = Array.from({ length: 24 }, (_, i) =>
    addHours(startOfDay(selectedDate), i)
  );

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX < -50) {
        setCurrentWeek(addWeeks(currentWeek, 1));
      } else if (event.translationX > 50) {
        setCurrentWeek(subWeeks(currentWeek, 1));
      }
    })
    .runOnJS(true);

  const handleScroll = (event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  // Measure grid position when component mounts
  useEffect(() => {
    const measureLayout = () => {
      gridRef.current?.measureInWindow((x, y, width, height) => {
        setGridOffset({ x, y });
      });
    };

    const timer = setTimeout(measureLayout, 100);
    return () => clearTimeout(timer);
  }, []);

  const longPressGesture = Gesture.LongPress()
    .minDuration(200)
    .onStart((e) => {
      // Calculate position relative to grid, accounting for box height
      const boxHeight = HOUR_HEIGHT / 2; // 30-minute default height
      const relativeY =
        e.absoluteY - gridOffset.y + scrollY.value - boxHeight / 2; // Subtract half box height
      const hour = Math.floor(
        (e.absoluteY - gridOffset.y + scrollY.value) / HOUR_HEIGHT
      );

      if (hour >= 0 && hour < 24) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Position box centered on touch point
        const snapIncrement = HOUR_HEIGHT / 4;
        const snappedY = Math.round(relativeY / snapIncrement) * snapIncrement;
        translateY.value = snappedY;

        dragStartTime.value = format(
          addHours(startOfDay(selectedDate), hour),
          "HH:mm"
        );
        runOnJS(setIsDragging)(true);
      }
    })
    .onTouchesUp((e) => {})
    .runOnJS(true);

  const dragGesture = Gesture.Pan()
    .onUpdate((e) => {
      // Calculate position relative to grid, accounting for box height
      const boxHeight = HOUR_HEIGHT / 2;
      const relativeY =
        e.absoluteY - gridOffset.y + scrollY.value - boxHeight / 2;
      const snapIncrement = HOUR_HEIGHT / 4;
      const snappedY = Math.round(relativeY / snapIncrement) * snapIncrement;
      translateY.value = snappedY;

      // Auto-scroll when near edges
      if (scrollViewRef.current) {
        const touchPosition = e.absoluteY - gridOffset.y;

        if (touchPosition < SCROLL_THRESHOLD) {
          scrollViewRef.current.scrollTo({
            y: Math.max(0, scrollY.value - 5),
            animated: false,
          });
        } else if (
          touchPosition >
          SCREEN_WIDTH - gridOffset.x - SCROLL_THRESHOLD
        ) {
          scrollViewRef.current.scrollTo({
            y: scrollY.value + 5,
            animated: false,
          });
        }
      }
    })
    .onEnd((e) => {
      const relativeY = e.absoluteY - gridOffset.y + scrollY.value;
      const snapIncrement = HOUR_HEIGHT / 4;
      const snappedY = Math.round(relativeY / snapIncrement) * snapIncrement;
      const hour = Math.floor(snappedY / HOUR_HEIGHT);
      const minutes = Math.round((snappedY % HOUR_HEIGHT) / snapIncrement) * 15;

      if (hour >= 0 && hour < 24) {
        const startTime = format(
          addMinutes(addHours(startOfDay(selectedDate), hour), minutes),
          "HH:mm"
        );
        runOnJS(handleDragEnd)(startTime);
      }

      runOnJS(setIsDragging)(false);
    })
    .runOnJS(true);

  const composed = Gesture.Simultaneous(longPressGesture, dragGesture);

  const handleTimeSlotPress = (hour: Date) => {
    const timeString = format(hour, "HH:mm");
    console.log("Time slot pressed:", timeString);
    setSelectedTime(timeString);
  };

  const handleDragEnd = (startTime: string) => {
    setSelectedTime(startTime);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: HOUR_HEIGHT, // Fixed height during drag
  }));

  // Update the event display to show actual duration
  const getEventHeight = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const durationInMinutes = (endHour - startHour) * 60 + (endMin - startMin);
    return (durationInMinutes / MINUTES_IN_HOUR) * HOUR_HEIGHT;
  };

  return (
    <>
      <GestureHandlerRootView className="flex-1">
        <GestureDetector gesture={swipeGesture}>
          <View className="flex-1 m-2">
            {/* Header */}
            <View
              ref={headerRef}
              className="px-4 py-2 border-b border-gray-200"
            >
              <View className="flex-row justify-between items-center">
                <TouchableOpacity onPress={onBackToMonthly} className="p-2">
                  <FontAwesome name="chevron-left" size={20} color="#000000" />
                </TouchableOpacity>
                <Text className="text-xl font-semibold">
                  {format(selectedDate, "MMMM yyyy")}
                </Text>
                <View className="w-12" />
              </View>

              {/* Week days row */}
              <View ref={weekRowRef} className="flex-row justify-between mt-4">
                {days.map((date) => (
                  <TouchableOpacity
                    key={date.toISOString()}
                    onPress={() => {
                      onSelectDate(date);
                    }}
                    className="items-center py-2"
                  >
                    <Text className="text-xs text-gray-500">
                      {format(date, "EEE")}
                    </Text>
                    <View
                      className={`w-9 h-9 rounded-full items-center justify-center
                        ${isSameDay(date, selectedDate) ? "bg-blue-500" : ""}
                      `}
                    >
                      <Text
                        className={`text-lg
                          ${
                            isSameDay(date, selectedDate)
                              ? "text-white"
                              : isToday(date)
                              ? "text-blue-500"
                              : ""
                          }
                        `}
                      >
                        {format(date, "d")}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Time slots grid */}
            <View
              ref={gridRef}
              className="flex-1"
              onLayout={() => {
                // Remeasure grid position after layout
                gridRef.current?.measureInWindow((x, y, width, height) => {
                  setGridOffset({ x, y });
                });
              }}
            >
              <GestureDetector gesture={composed}>
                <ScrollView
                  ref={scrollViewRef}
                  className="flex-1"
                  scrollEventThrottle={16}
                  onScroll={handleScroll}
                >
                  {hours.map((hour) => (
                    <View
                      key={hour.toISOString()}
                      style={{ height: HOUR_HEIGHT }}
                      className="flex-row border-b border-gray-100"
                    >
                      <View className="w-16 items-center justify-start py-2">
                        <Text className="text-xs text-gray-500">
                          {format(hour, "h a")}
                        </Text>
                      </View>
                      <TouchableOpacity
                        className="flex-1 border-l border-gray-100"
                        onPress={() => handleTimeSlotPress(hour)}
                      ></TouchableOpacity>
                    </View>
                  ))}

                  {/* Draggable event preview */}
                  {isDragging && (
                    <Animated.View
                      style={[
                        {
                          position: "absolute",
                          left: 64,
                          right: 0,
                          height: HOUR_HEIGHT / 2, // 30-minute default
                          backgroundColor: "rgba(59, 130, 246, 0.2)",
                          borderRadius: 8,
                          borderLeftWidth: 3,
                          borderLeftColor: "#3B82F6",
                          zIndex: 100,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.25,
                          shadowRadius: 4,
                          elevation: 5,
                        },
                        animatedStyle,
                      ]}
                    >
                      <View className="p-2">
                        <Text className="text-sm font-medium text-blue-800">
                          New Event
                        </Text>
                        <Text className="text-xs text-blue-600">
                          {dragStartTime.value}
                        </Text>
                      </View>
                    </Animated.View>
                  )}
                </ScrollView>
              </GestureDetector>
            </View>
          </View>
        </GestureDetector>
      </GestureHandlerRootView>
    </>
  );
};
