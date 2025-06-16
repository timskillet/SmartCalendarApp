import React, { useEffect, useRef, useState } from "react";
import { Dimensions, ScrollView, Text, View } from "react-native";

import { supabase } from "@/lib/supabase";
import {
  addDays,
  addHours,
  addWeeks,
  format,
  subDays,
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
import { Calendar, Event } from "../types";
import { calculateEventPosition, getHours } from "../utils/utils";
import { EditEventModal } from "./components/EditEventModal";
import { EventBox } from "./components/EventBox";
import { EventModal } from "./components/EventModal";
import { TimeSlotGrid } from "./components/TimeSlotGrid";
import { WeeklyViewHeader } from "./components/WeeklyViewHeader";
import { HOUR_HEIGHT, SCROLL_THRESHOLD } from "./constants";

interface WeeklyViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  onBackToMonthly: () => void;
  selectedCalendarId?: string;
  calendarName?: string;
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onSelectDate,
  onBackToMonthly,
  selectedCalendarId,
  calendarName,
}) => {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarIdState, setSelectedCalendarIdState] =
    useState(selectedCalendarId);

  /* EVENT CREATION*/
  const [events, setEvents] = useState<Event[]>([]);
  const [snappedPosition, setSnappedPosition] = useState(0);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [draggableBoxTime, setDraggableBoxTime] = useState(""); // Event time displayed in event box
  const [eventStartTime, setEventStartTime] = useState<Date>(new Date()); // event start time used for EventModal component
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [dateSelected, setDateSelected] = useState(selectedDate);

  // Update selectedCalendarIdState when selectedCalendarId prop changes
  useEffect(() => {
    if (selectedCalendarId) {
      setSelectedCalendarIdState(selectedCalendarId);
      console.log(
        `WeeklyView: Filtering events for calendar: ${calendarName} (${selectedCalendarId})`
      );
    }
  }, [selectedCalendarId, calendarName]);

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
  const headerRef = useRef<View>(null!);
  const weekRowRef = useRef<View>(null!);

  // Add state for measuring grid position
  const gridRef = useRef<View>(null);
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 });

  /* CALENDAR DATA */
  const hours = getHours(dateSelected);

  // Fetch user's calendars
  useEffect(() => {
    const fetchCalendars = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userCalendars, error } = await supabase
        .from("calendars")
        .select("*")
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching calendars:", error);
        return;
      }

      setCalendars(
        userCalendars.map((cal) => ({
          id: cal.id,
          name: cal.name,
          color: cal.color,
          isVisible: selectedCalendarId ? cal.id === selectedCalendarId : true,
          userId: cal.user_id,
          createdAt: new Date(cal.created_at),
          updatedAt: cal.updated_at ? new Date(cal.updated_at) : undefined,
        }))
      );

      // Set default calendar if none selected, or use the provided selectedCalendarId
      if (!selectedCalendarIdState && userCalendars.length > 0) {
        setSelectedCalendarIdState(selectedCalendarId || userCalendars[0].id);
      }
    };

    fetchCalendars();
  }, [selectedCalendarId]);

  // Fetch events for visible calendars
  useEffect(() => {
    const fetchEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // If a specific calendar is selected from home page, only show events from that calendar
      const visibleCalendarIds = selectedCalendarId
        ? [selectedCalendarId]
        : calendars.filter((cal) => cal.isVisible).map((cal) => cal.id);

      if (visibleCalendarIds.length === 0) return;

      const { data: calendarEvents, error } = await supabase
        .from("calendar_entries")
        .select("*")
        .in("calendar_id", visibleCalendarIds);

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(
        calendarEvents.map((event) => {
          // Create dates in local timezone
          const startTime = new Date(event.start_time);
          const endTime = new Date(event.end_time);

          // Adjust for timezone offset to ensure correct local time display
          const localStartTime = new Date(
            startTime.getFullYear(),
            startTime.getMonth(),
            startTime.getDate(),
            startTime.getHours(),
            startTime.getMinutes(),
            0,
            0
          );

          const localEndTime = new Date(
            endTime.getFullYear(),
            endTime.getMonth(),
            endTime.getDate(),
            endTime.getHours(),
            endTime.getMinutes(),
            0,
            0
          );

          return {
            id: event.id,
            calendarId: event.calendar_id,
            title: event.title,
            type: event.type,
            startTime: localStartTime,
            endTime: localEndTime,
            completed: event.completed,
            color:
              calendars.find((cal) => cal.id === event.calendar_id)?.color ||
              "#3B82F6",
            description: event.description,
            location: event.location,
            invitees: event.invitees,
            position: calculateEventPosition(localStartTime, localEndTime).top,
            repeat: false,
            createdAt: new Date(event.created_at),
            updatedAt: event.updated_at
              ? new Date(event.updated_at)
              : undefined,
          };
        })
      );
    };

    fetchEvents();
  }, [calendars, selectedCalendarId]);

  /* GESTURE HANDLING */
  const handleScroll = (event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onEnd((event) => {
      if (event.translationX < -50) {
        setCurrentWeek(addWeeks(currentWeek, 1));
        setDateSelected(addDays(dateSelected, 7));
      } else if (event.translationX > 50) {
        setCurrentWeek(subWeeks(currentWeek, 1));
        setDateSelected(subDays(dateSelected, 7));
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
            dateSelected.getFullYear(),
            dateSelected.getMonth(),
            dateSelected.getDate(),
            hour,
            minutes,
            0, // Set seconds to 0
            0 // Set milliseconds to 0
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
        dateSelected.getFullYear(),
        dateSelected.getMonth(),
        dateSelected.getDate(),
        hour,
        minutes,
        0, // Set seconds to 0
        0 // Set milliseconds to 0
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

  const composedGesture = Gesture.Simultaneous(
    swipeGesture,
    longPressGesture,
    dragGesture
  );

  /* HANDLER FUNCTIONS */
  const handleSaveEvent = async (eventDetails: {
    calendarId: string;
    title: string;
    type: string;
    startTime: Date;
    endTime: Date;
    completed: boolean;
    color: string;
    description?: string;
    location?: string;
    invitees?: string[];
    repeat: boolean;
  }) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !selectedCalendarIdState) return;

    // Create new Date objects with explicit timezone handling
    const startTime = new Date(
      eventDetails.startTime.getFullYear(),
      eventDetails.startTime.getMonth(),
      eventDetails.startTime.getDate(),
      eventDetails.startTime.getHours(),
      eventDetails.startTime.getMinutes(),
      0,
      0
    );

    const endTime = new Date(
      eventDetails.endTime.getFullYear(),
      eventDetails.endTime.getMonth(),
      eventDetails.endTime.getDate(),
      eventDetails.endTime.getHours(),
      eventDetails.endTime.getMinutes(),
      0,
      0
    );

    // Convert to UTC for storage
    const utcStartTime = new Date(
      startTime.getTime() - startTime.getTimezoneOffset() * 60000
    );
    const utcEndTime = new Date(
      endTime.getTime() - endTime.getTimezoneOffset() * 60000
    );

    const { data, error } = await supabase
      .from("calendar_entries")
      .insert([
        {
          calendar_id: selectedCalendarIdState,
          title: eventDetails.title,
          type: eventDetails.type,
          start_time: utcStartTime.toISOString(),
          end_time: utcEndTime.toISOString(),
          completed: false,
          color: eventDetails.color,
          description: eventDetails.description || "",
          location: eventDetails.location || "",
          invitees: eventDetails.invitees || [],
          repeat: eventDetails.repeat || false,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating event:", error);
      return;
    }

    const newEvent: Event = {
      id: data[0].id,
      calendarId: selectedCalendarIdState,
      title: eventDetails.title,
      type: eventDetails.type,
      startTime,
      endTime,
      completed: false,
      color:
        calendars.find((cal) => cal.id === selectedCalendarIdState)?.color ||
        "#3B82F6",
      description: eventDetails.description || "",
      location: eventDetails.location || "",
      invitees: eventDetails.invitees || [],
      repeat: eventDetails.repeat,
      position: snappedPosition,
      createdAt: new Date(),
    };

    setEvents([...events, newEvent]);
  };

  const handleTimeSlotPress = (hour: Date) => {
    const timeString = format(hour, "HH:mm");
    console.log("Time slot pressed:", timeString);
  };

  const handleEventPress = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalVisible(true);
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === updatedEvent.id ? updatedEvent : event
      )
    );
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;

      if (!userId) {
        console.error("No authenticated user found.");
        return;
      }

      // Delete from Supabase
      const { error } = await supabase
        .from("calendar_entries")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Error deleting event:", error);
        return;
      }

      // Update local state
      setEvents((prevEvents) =>
        prevEvents.filter((event) => event.id !== eventId)
      );
    } catch (error) {
      console.error("Error in handleDeleteEvent:", error);
    }
  };

  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      transform: [{ translateY: translateY.value }],
      height: HOUR_HEIGHT,
    };
  });

  const handleToggleCalendar = (calendarId: string) => {
    setCalendars((prevCalendars) =>
      prevCalendars.map((cal) =>
        cal.id === calendarId ? { ...cal, isVisible: !cal.isVisible } : cal
      )
    );
  };

  const handleAddCalendar = async (
    calendar: Omit<Calendar, "id" | "userId" | "createdAt" | "updatedAt">
  ) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("calendars")
      .insert([
        {
          name: calendar.name,
          color: calendar.color,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      console.error("Error creating calendar:", error);
      return;
    }

    const newCalendar: Calendar = {
      id: data[0].id,
      name: calendar.name,
      color: calendar.color,
      isVisible: true,
      userId: user.id,
      createdAt: new Date(data[0].created_at),
      updatedAt: data[0].updated_at ? new Date(data[0].updated_at) : undefined,
    };

    setCalendars((prev) => [...prev, newCalendar]);
    if (!selectedCalendarIdState) {
      setSelectedCalendarIdState(newCalendar.id);
    }
  };

  const handleDeleteCalendar = async (calendarId: string) => {
    const { error } = await supabase
      .schema("api")
      .from("calendars")
      .delete()
      .eq("id", calendarId);

    if (error) {
      console.error("Error deleting calendar:", error);
      return;
    }

    setCalendars((prev) => prev.filter((cal) => cal.id !== calendarId));
    if (selectedCalendarIdState === calendarId) {
      const remainingCalendars = calendars.filter(
        (cal) => cal.id !== calendarId
      );
      setSelectedCalendarIdState(remainingCalendars[0].id);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <GestureDetector gesture={swipeGesture}>
        <View className="flex-1 m-2">
          {/* Header */}
          <WeeklyViewHeader
            headerRef={headerRef}
            weekRowRef={weekRowRef}
            selectedDate={dateSelected}
            onSelectDate={setDateSelected}
            onBackToMonthly={onBackToMonthly}
            calendarName={calendarName}
          />

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
                  <TimeSlotGrid
                    key={hour.toISOString()}
                    hour={hour}
                    handleTimeSlotPress={handleTimeSlotPress}
                  />
                ))}

                {/* Render all persisted events */}
                {events.map((event, i) => {
                  const { top, height } = calculateEventPosition(
                    event.startTime,
                    event.endTime
                  );

                  return (
                    <EventBox
                      key={`${event.id}`}
                      event={event}
                      top={top}
                      height={height}
                      handleEventPress={handleEventPress}
                    />
                  );
                })}

                {isEventModalVisible && (
                  <EventModal
                    visible={isEventModalVisible}
                    onClose={() => setIsEventModalVisible(false)}
                    onSave={handleSaveEvent}
                    start={eventStartTime}
                    end={addHours(eventStartTime, 1)}
                    calendars={calendars}
                    selectedCalendarId={selectedCalendarIdState || ""}
                    onCalendarChange={setSelectedCalendarIdState}
                  />
                )}

                {selectedEvent && (
                  <EditEventModal
                    visible={isEditModalVisible}
                    onClose={() => {
                      setIsEditModalVisible(false);
                      setSelectedEvent(null);
                    }}
                    onUpdate={handleUpdateEvent}
                    onDelete={handleDeleteEvent}
                    event={selectedEvent}
                  />
                )}

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
