import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { supabase } from "@/lib/supabase";
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
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { EventModal } from "./EventModal";

export interface Event {
  id: string;
  title?: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  position: number;
  color: string;
  isAllDay: boolean;
  location?: string;
  attendees?: string[];
  recurring: boolean;
  timezone?: string;
  metadata?: Record<string, any>;
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
  const height = Math.max(durationHours * HOUR_HEIGHT, HOUR_HEIGHT / 2); // Minimum height of 30 minutes

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
      // Check if we're touching an existing event
      const touchY = event.absoluteY - gridOffset.y + scrollY.value;
      const touchX = event.absoluteX;

      // Only create new event if we're not touching an existing event
      const isTouchingEvent = events.some((event) => {
        const { top, height } = calculateEventPosition(
          event.startTime,
          event.endTime
        );
        const eventLeft = 64; // Left position of events
        const eventRight = SCREEN_WIDTH; // Right edge of screen

        return (
          touchY >= top &&
          touchY <= top + height &&
          touchX >= eventLeft &&
          touchX <= eventRight
        );
      });

      if (!isTouchingEvent) {
        setIsCreatingEvent(true);
        const relativeY = touchY;
        const hour = Math.floor(relativeY / HOUR_HEIGHT);

        if (hour >= 0 && hour < 24) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          // Position box centered on touch point
          const snapIncrement = HOUR_HEIGHT / 4;
          const snappedY =
            Math.round(relativeY / snapIncrement) * snapIncrement;
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
      }
    })
    .onTouchesUp(() => {
      if (isCreatingEvent) {
        const hour = Math.floor(snappedPosition / HOUR_HEIGHT);
        if (hour >= 0 && hour < 24) {
          setIsEventModalVisible(true);
          setIsCreatingEvent(false);
        }
      }
    })
    .runOnJS(true);

  const dragGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (!isCreatingEvent) return;

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
      setSnappedPosition(snappedY);
    })
    .onEnd((event) => {
      if (isCreatingEvent) {
        const hour = Math.floor(snappedPosition / HOUR_HEIGHT);
        if (hour >= 0 && hour < 24) {
          setIsEventModalVisible(true);
          setIsCreatingEvent(false);
        }
      }
    })
    .runOnJS(true);

  const composedGesture = Gesture.Simultaneous(longPressGesture, dragGesture);

  /* HANDLER FUNCTIONS */

  const handleSaveEvent = async (eventDetails: {
    title?: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    description?: string;
    location?: string;
    attendees?: string[];
    recurring: boolean;
    color: string;
    timezone?: string;
    metadata?: Record<string, any>;
  }) => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return;
    }
    const userId = user?.id;
    if (!userId) {
      console.error("No authenticated user found.");
      return;
    }

    const { data, error } = await supabase
      .schema("api")
      .from("events")
      .insert([
        {
          user_id: userId,
          title: eventDetails.title || "New Event",
          description: eventDetails.description || "",
          start_time: eventDetails.startTime.toISOString(),
          end_time: eventDetails.endTime.toISOString(),
          is_all_day: eventDetails.allDay,
          recurrence: eventDetails.recurring,
          location: eventDetails.location || "",
          color: eventDetails.color || "#3B82F6",
          timezone: eventDetails.timezone,
          metadata: eventDetails.metadata || {},
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    const newEvent: Event = {
      id: data?.[0]?.id,
      position: snappedPosition,
      title: eventDetails.title || "New Event",
      startTime: eventDetails.startTime,
      endTime: eventDetails.endTime,
      description: eventDetails.description || "",
      location: eventDetails.location || "",
      attendees: eventDetails.attendees || [],
      isAllDay: eventDetails.allDay,
      color: eventDetails.color || "#3B82F6",
      recurring: eventDetails.recurring,
      timezone: eventDetails.timezone || "",
      metadata: eventDetails.metadata,
    };
    console.log("New event created:", newEvent);
    setEvents([...events, newEvent]);
  };

  const handleTimeSlotPress = (hour: Date) => {
    const timeString = format(hour, "HH:mm");
    console.log("Time slot pressed:", timeString);
  };

  const handleDeleteEvent = async (eventToDelete: Event) => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;

      if (!userId) {
        console.error("No authenticated user found.");
        return;
      }

      // Delete from Supabase
      const { error } = await supabase
        .schema("api")
        .from("events")
        .delete()
        .match({
          user_id: userId,
          title: eventToDelete.title,
          start_time: eventToDelete.startTime.toISOString(),
          end_time: eventToDelete.endTime.toISOString(),
        });

      if (error) {
        console.error("Error deleting event:", error);
        return;
      }

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event !== eventToDelete)
      );
    } catch (error) {
      console.error("Error in handleDeleteEvent:", error);
    }
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

                {/* Render all persisted events */}
                {events.map((event, i) => {
                  const { top, height } = calculateEventPosition(
                    event.startTime,
                    event.endTime
                  );
                  console.log("Rendering event:", {
                    title: event.title,
                    top,
                    height,
                    startTime: event.startTime.toISOString(),
                    endTime: event.endTime.toISOString(),
                  });

                  return (
                    <TouchableOpacity
                      key={`${event.title}-${event.startTime.toISOString()}`}
                      onPress={() => {
                        Alert.alert(
                          "Delete Event",
                          "Are you sure you want to delete this event?",
                          [
                            {
                              text: "Cancel",
                              style: "cancel",
                            },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => handleDeleteEvent(event),
                            },
                          ]
                        );
                      }}
                      style={{
                        position: "absolute",
                        left: 64,
                        right: 0,
                        top: top,
                        height: height,
                        zIndex: 100,
                      }}
                    >
                      <View
                        style={[
                          {
                            flex: 1,
                            backgroundColor: `${event.color}20`,
                            borderRadius: 8,
                            borderLeftWidth: 3,
                            borderLeftColor: event.color,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.25,
                            shadowRadius: 4,
                            elevation: 5,
                          },
                        ]}
                      >
                        <View className="p-2">
                          <Text className="text-sm font-medium">
                            {event.title}
                          </Text>
                          <Text className="text-xs">
                            {format(event.startTime, "HH:mm")} -{" "}
                            {format(event.endTime, "HH:mm")}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <EventModal
                  visible={isEventModalVisible}
                  onClose={() => setIsEventModalVisible(false)}
                  onSave={handleSaveEvent}
                  start={eventStartTime}
                  end={addHours(eventStartTime, 1)}
                />

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
