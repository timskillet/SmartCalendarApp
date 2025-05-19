import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import {
  addHours,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import * as Haptics from "expo-haptics";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { EventModal } from "./EventModal";

export interface Event {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  position: number;
  color?: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
}

interface WeeklyViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const HOUR_HEIGHT = 60;
const SCROLL_THRESHOLD = 50;

const calculateEventPosition = (startTime: Date, endTime: Date) => {
  const startHour = startTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinutes = endTime.getMinutes();

  // Calculate position based on start time
  const startPosition = (startHour + startMinutes / 60) * HOUR_HEIGHT;

  // Calculate height based on duration
  const durationHours = endHour - startHour + (endMinutes - startMinutes) / 60;
  const height = durationHours * HOUR_HEIGHT;

  return { top: startPosition, height };
};

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onSelectDate,
}) => {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  /* EVENT CREATION*/
  const [events, setEvents] = useState<Event[]>([]);
  const [snappedPosition, setSnappedPosition] = useState(0);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [draggableBoxTime, setDraggableBoxTime] = useState(""); // Event time displayed in event box
  const [eventStartTime, setEventStartTime] = useState<Date>(new Date()); // event start time used for EventModal component

  // Measure grid position
  useEffect(() => {
    const measureLayout = () => {
      gridRef.current?.measureInWindow((x, y, width, height) => {
        setGridOffset({ x, y });
      });
    };

    const timer = setTimeout(measureLayout, 100);
    return () => clearTimeout(timer);
  }, []);

  const scrollViewRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const translateY = useSharedValue(0);

  // Add refs to measure header components
  const headerRef = useRef<View>(null);
  const weekRowRef = useRef<View>(null);

  // Add state for measuring grid position
  const gridRef = useRef<View>(null);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  /* CALENDAR DATA */
  const days = eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek),
  });

  const hours = Array.from({ length: 24 }, (_, i) =>
    addHours(startOfDay(selectedDate), i)
  );

  /* GESTURE HANDLING */
  const handleScroll = (event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

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

  const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart((event) => {
      setIsCreatingEvent(true);
      const relativeY = event.absoluteY - gridOffset.y + scrollY.value;
      const hour = Math.floor(
        (event.absoluteY - gridOffset.y + scrollY.value) / HOUR_HEIGHT
      );

      if (hour >= 0 && hour < 24) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Position box centered on touch point
        const snapIncrement = HOUR_HEIGHT / 4;
        const snappedY = Math.round(relativeY / snapIncrement) * snapIncrement;
        setSnappedPosition(snappedY);
        translateY.value = snappedY;

        // Update time while dragging
        const hour = Math.floor(snappedY / HOUR_HEIGHT);
        const minutes =
          Math.round((snappedY % HOUR_HEIGHT) / snapIncrement) * 15;
        const selectedTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          hour,
          minutes
        );
        setDraggableBoxTime(format(selectedTime, "HH:mm"));
        setEventStartTime(selectedTime);
      }
    })
    .onTouchesUp(() => {
      const hour = Math.floor(snappedPosition / HOUR_HEIGHT);
      if (hour >= 0 && hour < 24) {
        setIsEventModalVisible(true);
        setIsCreatingEvent(false);
      }
    })
    .runOnJS(true);

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      const relativeY = event.absoluteY - gridOffset.y + scrollY.value;
      const snapIncrement = HOUR_HEIGHT / 4;
      const snappedY = Math.round(relativeY / snapIncrement) * snapIncrement;
      translateY.value = snappedY;

      // Auto-scroll when near edges
      if (scrollViewRef.current) {
        const touchPosition = event.absoluteY - gridOffset.y;
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

      // Update time while dragging
      const hour = Math.floor(snappedY / HOUR_HEIGHT);
      const minutes = Math.round((snappedY % HOUR_HEIGHT) / snapIncrement) * 15;
      const selectedTime = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hour,
        minutes
      );
      setDraggableBoxTime(format(selectedTime, "HH:mm"));
      setEventStartTime(selectedTime);
      runOnJS(setIsCreatingEvent)(true);
      setSnappedPosition(snappedY);

      // Auto-scroll when near edges
      if (scrollViewRef.current) {
        const touchPosition = event.absoluteY - gridOffset.y;
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
    .onEnd((event) => {
      const hour = Math.floor(snappedPosition / HOUR_HEIGHT);
      if (hour >= 0 && hour < 24) {
        draggableBoxTime;
        setIsEventModalVisible(true);
        setIsCreatingEvent(false);
      }
    })
    .runOnJS(true);

  const composedGesture = Gesture.Simultaneous(longPressGesture, dragGesture);

  /* HANDLER FUNCTIONS */

  const handleSaveEvent = (eventDetails: {
    title: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    description?: string;
    location?: string;
    attendees?: string[];
    color?: string;
  }) => {
    const newEvent: Event = {
      position: snappedPosition,
      title: eventDetails.title,
      startTime: eventDetails.startTime,
      endTime: eventDetails.endTime,
      description: eventDetails.description,
      location: eventDetails.location,
      attendees: eventDetails.attendees,
      isAllDay: eventDetails.allDay,
      color: eventDetails.color,
    };
    setEvents((prevEvents) => [...prevEvents, newEvent]);
  };

  const handleTimeSlotPress = (hour: Date) => {
    const timeString = format(hour, "HH:mm");
    console.log("Time slot pressed:", timeString);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: HOUR_HEIGHT,
  }));

  return (
    <GestureHandlerRootView className="flex-1">
      <GestureDetector gesture={swipeGesture}>
        <View className="flex-1 m-2">
          {/* Header */}
          <View ref={headerRef} className="px-4 py-2 border-b border-gray-200">
            <View className="flex-row justify-between items-center">
              <TouchableOpacity className="p-2">
                <FontAwesome name="chevron-left" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-xl font-semibold">
                {format(selectedDate, "MMMM yyyy")}
              </Text>
              <View className="w-12"></View>
            </View>

            {/* Week Row */}
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
                                          ${
                                            isSameDay(date, selectedDate)
                                              ? "bg-blue-500"
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
                          : ""
                      }`}
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
              gridRef.current?.measureInWindow((x, y, width, height) => {
                setGridOffset({ x, y });
              });
            }}
          >
            <GestureDetector gesture={composedGesture}>
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

                <EventModal
                  visible={isEventModalVisible}
                  onClose={() => setIsEventModalVisible(false)}
                  onSave={handleSaveEvent}
                  start={eventStartTime}
                  end={addHours(eventStartTime, 1)}
                />

                {/* Render all persisted events */}
                {events.map((event, i) => {
                  const { top, height } = calculateEventPosition(
                    event.startTime,
                    event.endTime
                  );
                  return (
                    <Animated.View
                      key={i}
                      style={[
                        {
                          position: "absolute",
                          left: 64,
                          right: 0,
                          top: top,
                          height: height,
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
                      ]}
                    >
                      <View className="p-2">
                        <Text className="text-sm font-medium text-blue-800">
                          {event.title}
                        </Text>
                        <Text className="text-xs text-blue-600">
                          {format(event.startTime, "HH:mm")} -{" "}
                          {format(event.endTime, "HH:mm")}
                        </Text>
                      </View>
                    </Animated.View>
                  );
                })}

                {/* Draggable event preview */}
                {isCreatingEvent && (
                  <Animated.View
                    style={[
                      {
                        position: "absolute",
                        left: 64,
                        right: 0,
                        height: HOUR_HEIGHT / 2,
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
                        {draggableBoxTime}
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
  );
};
