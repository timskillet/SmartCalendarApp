import GoalCard from "@/components/GoalCard";
import { ShareCalendarModal } from "@/components/calendar/ShareCalendarModal";
import { Calendar } from "@/components/calendar/types";
import { useCalendarEntries } from "@/context/CalendarEntryProvider";
import { useCalendar } from "@/context/CalendarProvider";
import { MaterialIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

type EventIcon = "check-circle" | "edit" | "directions-run";

interface ChecklistItem {
  text: string;
  done: boolean;
}

interface CalendarEntry {
  id: string;
  calendar_id: string;
  title: string;
  type: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  color: string;
  icon: string;
  iconColor: string;
}

interface BaseGoal {
  id: string;
  type: "habit" | "numeric" | "checklist" | "time";
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

interface HabitGoal extends BaseGoal {
  type: "habit";
  frequency: string;
  completed: boolean;
}

interface NumericGoal extends BaseGoal {
  type: "numeric";
  current: number;
  target: number;
}

interface ChecklistGoal extends BaseGoal {
  type: "checklist";
  checklist: ChecklistItem[];
}

interface TimeGoal extends BaseGoal {
  type: "time";
  hours: number;
  targetHours: number;
}

type Goal = HabitGoal | NumericGoal | ChecklistGoal | TimeGoal;

const fakeGoals: Goal[] = [
  {
    id: "1",
    type: "habit",
    icon: "check-circle",
    iconColor: "#2563eb",
    title: "Read more books",
    subtitle: "Recurring Habit",
    frequency: "3 times per week",
    completed: true,
  },
  {
    id: "2",
    type: "numeric",
    icon: "home",
    iconColor: "#0ea5e9",
    title: "Save for a house",
    subtitle: "Numeric Target",
    current: 25000,
    target: 50000,
  },
  {
    id: "3",
    type: "checklist",
    icon: "check-square",
    iconColor: "#f59e42",
    title: "Launch podcast",
    subtitle: "Checklist / Milestone",
    checklist: [
      { text: "Buy microphone", done: true },
      { text: "Record first episode", done: true },
      { text: "Submit to directories", done: false },
    ],
  },
  {
    id: "4",
    type: "time",
    icon: "bar-chart",
    iconColor: "#8b5cf6",
    title: "Exercise",
    subtitle: "Time-Based Commitment",
    hours: 4,
    targetHours: 7,
  },
];

const fakeEvents: Array<{
  id: string;
  title: string;
  time: string;
  color: string;
  icon: EventIcon;
  checked: boolean;
}> = [
  {
    id: "1",
    title: "Design review",
    time: "10:00 – 11:00",
    color: "#c7dafe",
    icon: "check-circle",
    checked: true,
  },
  {
    id: "2",
    title: "Write documentation",
    time: "12:00 – 13:00",
    color: "#fee2e2",
    icon: "edit",
    checked: false,
  },
  {
    id: "3",
    title: "Daily workout",
    time: "15:00",
    color: "#d1fae5",
    icon: "directions-run",
    checked: false,
  },
];

interface DraggedTask {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  color: string;
  originalSection: "today" | "unscheduled";
}

const SCREEN_HEIGHT = Dimensions.get("window").height;

const dashboard = () => {
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const { calendars, selectedCalendar, setSelectedCalendar } = useCalendar();
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropZones, setDropZones] = useState({
    today: { y: 0, height: 0 },
    unscheduled: { y: 0, height: 0 },
  });

  const todaySectionRef = useRef<View>(null);
  const unscheduledSectionRef = useRef<View>(null);

  const {
    entries: tasks,
    isLoading: isLoadingTasks,
    selectedTimeRange,
    setSelectedTimeRange,
    refreshEntries,
    getEntriesForCalendar,
    setVisibleCalendarIds,
    visibleCalendarIds,
  } = useCalendarEntries();

  const calendarTasks = getEntriesForCalendar(selectedCalendar?.id || "");

  // Separate tasks into today's agenda and unscheduled
  const todaysTasks = calendarTasks.filter((task) => {
    const taskDate = new Date(task.startTime);
    const today = new Date();
    return taskDate.toDateString() === today.toDateString();
  });

  const unscheduledTasks = calendarTasks.filter((task) => {
    const taskDate = new Date(task.startTime);
    const today = new Date();
    return taskDate.toDateString() !== today.toDateString();
  });

  useEffect(() => {
    // If no calendar is selected, select the primary calendar
    if (!selectedCalendar && calendars.length > 0) {
      const primaryCalendar = calendars.find((cal) => cal.is_primary);
      if (primaryCalendar) {
        setSelectedCalendar(primaryCalendar.id);
      } else {
        // If no primary calendar, select the first one
        setSelectedCalendar(calendars[0].id);
      }
    }
    console.log("Available calendars:", calendars);
  }, [calendars, selectedCalendar]);

  // Set visible calendar IDs when selected calendar changes
  useEffect(() => {
    if (selectedCalendar?.id) {
      console.log("Setting visible calendar IDs:", [selectedCalendar.id]);
      setVisibleCalendarIds([selectedCalendar.id]);
    } else {
      console.log("No selected calendar, clearing visible calendar IDs");
      setVisibleCalendarIds([]);
    }
  }, [selectedCalendar?.id, setVisibleCalendarIds]);

  // Debug effect to log state changes
  useEffect(() => {
    console.log("=== Dashboard State Debug ===");
    console.log("Selected calendar:", selectedCalendar);
    console.log("Visible calendar IDs:", visibleCalendarIds);
    console.log("All entries from provider:", tasks);
    console.log("Calendar tasks for selected calendar:", calendarTasks);
    console.log("Is loading tasks:", isLoadingTasks);
  }, [
    selectedCalendar,
    visibleCalendarIds,
    tasks,
    calendarTasks,
    isLoadingTasks,
  ]);

  const renderCalendarItem = ({ item }: { item: Calendar }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCalendar(item.id);
        setIsCalendarModalVisible(false);
      }}
      className="p-4 border-b border-gray-200"
    >
      <View className="flex-row items-center">
        <View
          className="w-4 h-4 rounded-full mr-3"
          style={{ backgroundColor: item.color }}
        />
        <Text className="text-lg">{item.name}</Text>
        {item.is_primary && (
          <Text className="text-sm text-gray-500 ml-2">(Primary)</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      console.log("Refreshing tasks");
      console.log("Selected calendar:", selectedCalendar);
      console.log("Calendar tasks:", calendarTasks);
      await refreshEntries();
    } catch (error) {
      console.error("Error refreshing tasks:", error);
    } finally {
      setRefreshing(false);
    }
  }, [selectedCalendar?.id, refreshEntries, calendarTasks]);

  const moveTaskToToday = (taskId: string) => {
    // Update the task's start time to today
    const today = new Date();
    const task = calendarTasks.find((t) => t.id === taskId);
    if (task) {
      const newStartTime = new Date(today);
      newStartTime.setHours(9, 0, 0, 0); // Set to 9 AM

      // Update the task in the database
      // This would require an API call to update the task
      console.log(`Moving task ${taskId} to today at ${newStartTime}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const moveTaskToUnscheduled = (taskId: string) => {
    // Update the task's start time to a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7); // Move to next week
    const task = calendarTasks.find((t) => t.id === taskId);
    if (task) {
      const newStartTime = new Date(futureDate);
      newStartTime.setHours(9, 0, 0, 0); // Set to 9 AM

      // Update the task in the database
      // This would require an API call to update the task
      console.log(`Moving task ${taskId} to unscheduled at ${newStartTime}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const TaskItem = ({
    task,
    section,
  }: {
    task: any;
    section: "today" | "unscheduled";
  }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        zIndex: zIndex.value,
      };
    });

    const dragGesture = Gesture.Pan()
      .onStart((event) => {
        runOnJS(setIsDragging)(true);
        runOnJS(setDraggedTask)({
          ...task,
          originalSection: section,
        });
        scale.value = withSpring(1.05);
        zIndex.value = 1000;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      })
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        runOnJS(setIsDragging)(false);
        scale.value = withSpring(1);
        zIndex.value = 0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        // Get drop zones
        todaySectionRef.current?.measureInWindow((x, y, width, height) => {
          unscheduledSectionRef.current?.measureInWindow((ux, uy, uw, uh) => {
            const dropY = event.absoluteY;

            if (draggedTask) {
              if (
                dropY >= y &&
                dropY <= y + height &&
                draggedTask.originalSection === "unscheduled"
              ) {
                // Drop in today section
                runOnJS(moveTaskToToday)(draggedTask.id);
              } else if (
                dropY >= uy &&
                dropY <= uy + uh &&
                draggedTask.originalSection === "today"
              ) {
                // Drop in unscheduled section
                runOnJS(moveTaskToUnscheduled)(draggedTask.id);
              }
              runOnJS(setDraggedTask)(null);
            }
          });
        });
      })
      .runOnJS(true);

    return (
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            className="flex-row items-center mb-2 px-2 py-3 rounded-2xl"
            style={{ backgroundColor: `${task.color}20` }}
          >
            <View className="mr-3">
              <MaterialIcons
                name={
                  task.completed
                    ? "check-box"
                    : task.type === "event"
                    ? "event"
                    : task.type === "task"
                    ? "check-circle"
                    : task.type === "habit"
                    ? "repeat"
                    : "emoji-events"
                }
                size={24}
                color={task.completed ? "#6366f1" : task.color}
              />
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-gray-900">
                {task.title}
              </Text>
              <Text className="text-sm text-gray-500">
                {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
              </Text>
            </View>
            <Text className="text-gray-700 text-base font-medium">
              {new Date(task.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              {task.endTime && " - "}
              {task.endTime &&
                new Date(task.endTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 px-4">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsCalendarModalVisible(true);
              }}
              className="flex-row items-center"
            >
              <Text className="text-2xl font-bold mr-1">
                {selectedCalendar?.name || "Select Calendar"}
              </Text>
              <MaterialIcons name="arrow-drop-down" size={24} color="black" />
            </TouchableOpacity>
            <View className="flex-row gap-5">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsShareModalVisible(true);
                }}
              >
                <MaterialIcons name="send" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MaterialIcons name="notifications" size={24} color="black" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MaterialIcons name="settings" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>

          <Modal
            visible={isCalendarModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setIsCalendarModalVisible(false)}
          >
            <View className="flex-1 bg-black/50">
              <View className="bg-white mt-20 mx-4 rounded-xl">
                <View className="p-4 border-b border-gray-200">
                  <Text className="text-xl font-bold">Select Calendar</Text>
                </View>
                {calendars.length === 0 ? (
                  <View className="p-4">
                    <Text className="text-gray-500 text-center">
                      No calendars available
                    </Text>
                  </View>
                ) : (
                  <FlatList
                    data={calendars as Array<Calendar>}
                    renderItem={renderCalendarItem}
                    keyExtractor={(item) => item.id}
                  />
                )}
                <TouchableOpacity
                  onPress={() => setIsCalendarModalVisible(false)}
                  className="p-4 border-t border-gray-200"
                >
                  <Text className="text-center text-blue-500 font-semibold">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <ScrollView
            showsVerticalScrollIndicator={false}
            className="flex-1"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3B82F6"]}
                tintColor="#3B82F6"
                title="Refreshing tasks..."
                titleColor="#6B7280"
              />
            }
          >
            {/* Today's Agenda */}
            <View ref={todaySectionRef} className="flex-1 mt-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold">Today's Agenda</Text>
                {isDragging &&
                  draggedTask?.originalSection === "unscheduled" && (
                    <Text className="text-sm text-blue-500">
                      Drop here to schedule
                    </Text>
                  )}
              </View>
              <View className="mb-4">
                {isLoadingTasks ? (
                  <View className="flex-row justify-center items-center py-4">
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text className="ml-2 text-gray-600">Loading tasks...</Text>
                  </View>
                ) : todaysTasks.length > 0 ? (
                  todaysTasks.map((task) => (
                    <TaskItem key={task.id} task={task} section="today" />
                  ))
                ) : (
                  <View className="flex-row justify-center items-center py-4">
                    <MaterialIcons
                      name="event-busy"
                      size={24}
                      color="#9CA3AF"
                    />
                    <Text className="ml-2 text-gray-500">
                      No tasks for today
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  className="bg-gray-100 flex-row items-center mb-2 px-2 py-3 rounded-2xl"
                  onPress={() => router.push("/scheduler")}
                >
                  <View className="mr-3">
                    <MaterialIcons name="add" size={24} color="#6B7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      Add new task
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Unscheduled Tasks */}
            <View ref={unscheduledSectionRef} className="flex-1 mt-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-2xl font-bold">Unscheduled Tasks</Text>
                {isDragging && draggedTask?.originalSection === "today" && (
                  <Text className="text-sm text-orange-500">
                    Drop here to unschedule
                  </Text>
                )}
              </View>
              <View className="mt-4">
                {unscheduledTasks.length > 0 ? (
                  unscheduledTasks.map((task) => (
                    <TaskItem key={task.id} task={task} section="unscheduled" />
                  ))
                ) : (
                  <View className="flex-row justify-center items-center py-4">
                    <MaterialIcons
                      name="event-busy"
                      size={24}
                      color="#9CA3AF"
                    />
                    <Text className="ml-2 text-gray-500">
                      No unscheduled tasks
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  className="bg-gray-100 flex-row items-center mb-2 px-2 py-3 rounded-2xl"
                  onPress={() => router.push("/scheduler")}
                >
                  <View className="mr-3">
                    <MaterialIcons name="add" size={24} color="#6B7280" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      Add new task
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>

            {/* Goals */}
            <View className="flex-1 mt-4">
              <Text className="text-2xl font-bold mb-2">Goals</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-1"
              >
                <View className="flex-row">
                  {fakeGoals.map((goal, idx) => (
                    <TouchableOpacity key={idx} className="mr-1">
                      <GoalCard goal={goal} />
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Habits */}
            <View className="flex-1 mt-4">
              <Text className="text-2xl font-bold mb-2">Habits</Text>
              <ScrollView className="flex-1">
                <View className="mt-4">
                  <View className="flex-row"></View>
                </View>
              </ScrollView>
            </View>
          </ScrollView>

          <ShareCalendarModal
            isVisible={isShareModalVisible}
            onClose={() => setIsShareModalVisible(false)}
            calendarId={selectedCalendar?.id || ""}
            calendarName={selectedCalendar?.name || "Calendar"}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default dashboard;
