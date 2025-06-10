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
import { CalendarList } from "./components/CalendarList";
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
}

const SCREEN_WIDTH = Dimensions.get("window").width;

export const WeeklyView: React.FC<WeeklyViewProps> = ({
  selectedDate,
  onSelectDate,
  onBackToMonthly,
}) => {
  const [currentWeek, setCurrentWeek] = useState(selectedDate);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );

  /* EVENT CREATION*/
  const [events, setEvents] = useState<Event[]>([]);
  const [snappedPosition, setSnappedPosition] = useState(0);
  const [isEventModalVisible, setIsEventModalVisible] = useState(false);
  const [draggableBoxTime, setDraggableBoxTime] = useState(""); // Event time displayed in event box
  const [eventStartTime, setEventStartTime] = useState<Date>(new Date()); // event start time used for EventModal component
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [dateSelected, setDateSelected] = useState(selectedDate);

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
        .schema("api")
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
          isVisible: true,
          userId: cal.user_id,
          createdAt: new Date(cal.created_at),
          updatedAt: cal.updated_at ? new Date(cal.updated_at) : undefined,
        }))
      );

      // Set default calendar if none selected
      if (!selectedCalendarId && userCalendars.length > 0) {
        setSelectedCalendarId(userCalendars[0].id);
      }
    };

    fetchCalendars();
  }, []);

  // Fetch events for visible calendars
  useEffect(() => {
    const fetchEvents = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const visibleCalendarIds = calendars
        .filter((cal) => cal.isVisible)
        .map((cal) => cal.id);

      if (visibleCalendarIds.length === 0) return;

      const { data: calendarEvents, error } = await supabase
        .schema("api")
        .from("events")
        .select("*")
        .in("calendar_id", visibleCalendarIds);

      if (error) {
        console.error("Error fetching events:", error);
        return;
      }

      setEvents(
        calendarEvents.map((event) => ({
          id: event.id,
          calendarId: event.calendar_id,
          title: event.title,
          description: event.description,
          startTime: new Date(event.start_time),
          endTime: new Date(event.end_time),
          position: calculateEventPosition(
            new Date(event.start_time),
            new Date(event.end_time)
          ).top,
          color:
            calendars.find((cal) => cal.id === event.calendar_id)?.color ||
            "#3B82F6",
          isAllDay: event.is_all_day,
          isTask: event.is_task,
          completed: event.completed,
          assignedTo: event.assigned_to,
          isAutoScheduled: event.is_auto_scheduled,
          createdAt: new Date(event.created_at),
          updatedAt: event.updated_at ? new Date(event.updated_at) : undefined,
          recurring: false, // Add proper handling for recurring events
          timezone: event.timezone,
          metadata: event.metadata,
        }))
      );
    };

    fetchEvents();
  }, [calendars]);

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
        dateSelected.getFullYear(),
        dateSelected.getMonth(),
        dateSelected.getDate(),
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

  const composedGesture = Gesture.Simultaneous(
    swipeGesture,
    longPressGesture,
    dragGesture
  );

  /* HANDLER FUNCTIONS */
  const handleSaveEvent = async (eventDetails: {
    title: string;
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
    } = await supabase.auth.getUser();
    if (!user || !selectedCalendarId) return;

    const { data, error } = await supabase
      .from("events")
      .insert([
        {
          calendar_id: selectedCalendarId,
          title: eventDetails.title,
          description: eventDetails.description || "",
          start_time: eventDetails.startTime.toISOString(),
          end_time: eventDetails.endTime.toISOString(),
          is_all_day: eventDetails.allDay,
          is_task: false,
          completed: false,
          is_auto_scheduled: false,
          location: eventDetails.location || "",
          timezone: eventDetails.timezone,
          metadata: eventDetails.metadata || {},
        },
      ])
      .select();

    if (error) {
      console.error("Error creating event:", error);
      return;
    }

    const newEvent: Event = {
      id: data[0].id,
      calendarId: selectedCalendarId,
      position: snappedPosition,
      title: eventDetails.title,
      startTime: eventDetails.startTime,
      endTime: eventDetails.endTime,
      description: eventDetails.description || "",
      location: eventDetails.location || "",
      attendees: eventDetails.attendees || [],
      isAllDay: eventDetails.allDay,
      color:
        calendars.find((cal) => cal.id === selectedCalendarId)?.color ||
        "#3B82F6",
      recurring: eventDetails.recurring,
      timezone: eventDetails.timezone || "",
      isTask: false,
      completed: false,
      isAutoScheduled: false,
      createdAt: new Date(),
      metadata: eventDetails.metadata,
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
        .schema("api")
        .from("events")
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: HOUR_HEIGHT,
  }));

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
      .schema("api")
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
    if (!selectedCalendarId) {
      setSelectedCalendarId(newCalendar.id);
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
    if (selectedCalendarId === calendarId) {
      const remainingCalendars = calendars.filter(
        (cal) => cal.id !== calendarId
      );
      setSelectedCalendarId(
        remainingCalendars.length > 0 ? remainingCalendars[0].id : null
      );
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
          />

          {/* Calendar List */}
          <CalendarList
            calendars={calendars}
            onToggleCalendar={handleToggleCalendar}
            onAddCalendar={handleAddCalendar}
            onDeleteCalendar={handleDeleteCalendar}
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
                    selectedCalendarId={selectedCalendarId}
                    onCalendarChange={setSelectedCalendarId}
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
