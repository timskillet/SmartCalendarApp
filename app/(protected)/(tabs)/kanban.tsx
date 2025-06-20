import { useCalendarEntries } from "@/context/CalendarEntryProvider";
import { useCalendar } from "@/context/CalendarProvider";
import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
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
  withTiming,
} from "react-native-reanimated";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_HEIGHT = 200; // Fixed height for each column

interface Task {
  id: string;
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  completed: boolean;
  color: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "in-progress" | "completed";
}

interface Column {
  id: string;
  title: string;
  color: string;
  tasks: Task[];
}

// Dummy data for testing
const dummyTasks: Task[] = [
  {
    id: "1",
    title: "Design new app interface",
    type: "task",
    startTime: "2024-01-15T09:00:00Z",
    endTime: "2024-01-15T11:00:00Z",
    completed: false,
    color: "#3B82F6",
    priority: "high",
    status: "todo",
  },
  {
    id: "2",
    title: "Team meeting",
    type: "event",
    startTime: "2024-01-15T14:00:00Z",
    endTime: "2024-01-15T15:00:00Z",
    completed: false,
    color: "#EF4444",
    priority: "medium",
    status: "in-progress",
  },
  {
    id: "3",
    title: "Review code changes",
    type: "task",
    startTime: "2024-01-15T16:00:00Z",
    endTime: "2024-01-15T17:00:00Z",
    completed: true,
    color: "#10B981",
    priority: "low",
    status: "completed",
  },
  {
    id: "4",
    title: "Daily workout",
    type: "habit",
    startTime: "2024-01-15T07:00:00Z",
    endTime: "2024-01-15T08:00:00Z",
    completed: false,
    color: "#F59E0B",
    priority: "medium",
    status: "todo",
  },
  {
    id: "5",
    title: "Client presentation",
    type: "event",
    startTime: "2024-01-15T10:00:00Z",
    endTime: "2024-01-15T12:00:00Z",
    completed: false,
    color: "#8B5CF6",
    priority: "high",
    status: "in-progress",
  },
  {
    id: "6",
    title: "Write documentation",
    type: "task",
    startTime: "2024-01-15T13:00:00Z",
    endTime: "2024-01-15T15:00:00Z",
    completed: false,
    color: "#06B6D4",
    priority: "medium",
    status: "todo",
  },
  {
    id: "7",
    title: "Project planning session",
    type: "event",
    startTime: "2024-01-15T09:30:00Z",
    endTime: "2024-01-15T10:30:00Z",
    completed: true,
    color: "#84CC16",
    priority: "low",
    status: "completed",
  },
  {
    id: "8",
    title: "Read technical articles",
    type: "habit",
    startTime: "2024-01-15T20:00:00Z",
    endTime: "2024-01-15T21:00:00Z",
    completed: false,
    color: "#F97316",
    priority: "low",
    status: "todo",
  },
];

const kanban = () => {
  const { calendars, selectedCalendar } = useCalendar();
  const { entries: tasks, getEntriesForCalendar } = useCalendarEntries();
  const [columns, setColumns] = useState<Column[]>([
    {
      id: "todo",
      title: "To Do",
      color: "#EF4444",
      tasks: [],
    },
    {
      id: "in-progress",
      title: "In Progress",
      color: "#F59E0B",
      tasks: [],
    },
    {
      id: "completed",
      title: "Completed",
      color: "#10B981",
      tasks: [],
    },
  ]);

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFromColumn, setDraggedFromColumn] = useState<string>("");
  const [draggedFromIndex, setDraggedFromIndex] = useState<number>(-1);
  const [isDragging, setIsDragging] = useState(false);

  const calendarTasks = getEntriesForCalendar(selectedCalendar?.id || "");

  // Initialize with dummy data
  useEffect(() => {
    // Use dummy data for now
    const convertedTasks: Task[] = dummyTasks;

    // Distribute tasks to columns
    const newColumns = columns.map((column) => ({
      ...column,
      tasks: convertedTasks.filter((task) => {
        if (column.id === "completed") return task.status === "completed";
        if (column.id === "in-progress") return task.status === "in-progress";
        return task.status === "todo";
      }),
    }));

    setColumns(newColumns);
  }, []);

  const TaskItem = ({
    task,
    columnId,
    index,
  }: {
    task: Task;
    columnId: string;
    index: number;
  }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);
    const opacity = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { scale: scale.value },
        ],
        zIndex: zIndex.value,
        opacity: opacity.value,
      };
    });

    const dragGesture = Gesture.Pan()
      .onStart((event) => {
        runOnJS(setIsDragging)(true);
        runOnJS(setDraggedTask)(task);
        runOnJS(setDraggedFromColumn)(columnId);
        runOnJS(setDraggedFromIndex)(index);
        scale.value = withSpring(1.05);
        zIndex.value = 1000;
        opacity.value = withTiming(0.8);
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
        opacity.value = withTiming(1);
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        // Calculate drop position
        const dropX = event.absoluteX;
        const dropY = event.absoluteY;

        // Find which column the task was dropped in
        const targetColumn = findColumnAtPosition(dropX, dropY);
        if (targetColumn && draggedTask) {
          runOnJS(moveTask)(
            draggedTask,
            draggedFromColumn,
            targetColumn.id,
            dropY
          );
        }

        runOnJS(setDraggedTask)(null);
        runOnJS(setDraggedFromColumn)("");
        runOnJS(setDraggedFromIndex)(-1);
      })
      .runOnJS(true);

    return (
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={animatedStyle}>
          <TouchableOpacity
            className="bg-white rounded-lg p-3 mb-2 shadow-sm border border-gray-200"
            style={{
              borderLeftWidth: 4,
              borderLeftColor: task.color,
            }}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Text
                className="font-semibold text-gray-900 flex-1"
                numberOfLines={2}
              >
                {task.title}
              </Text>
              <View className="flex-row items-center">
                <View
                  className="w-2 h-2 rounded-full mr-1"
                  style={{
                    backgroundColor:
                      task.priority === "high"
                        ? "#EF4444"
                        : task.priority === "medium"
                        ? "#F59E0B"
                        : "#10B981",
                  }}
                />
                <MaterialIcons
                  name={
                    task.type === "event"
                      ? "event"
                      : task.type === "task"
                      ? "check-circle"
                      : task.type === "habit"
                      ? "repeat"
                      : "emoji-events"
                  }
                  size={16}
                  color={task.color}
                />
              </View>
            </View>
            <Text className="text-xs text-gray-500 mb-1">
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </Text>
            <Text className="text-xs text-gray-400">
              {new Date(task.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    );
  };

  const findColumnAtPosition = (x: number, y: number): Column | null => {
    // Find column based on Y position for vertical layout
    const columnHeight = COLUMN_HEIGHT + 20; // Add margin
    const columnIndex = Math.floor(y / columnHeight);
    return columns[columnIndex] || null;
  };

  const moveTask = (
    task: Task,
    fromColumnId: string,
    toColumnId: string,
    dropY: number
  ) => {
    if (fromColumnId === toColumnId) {
      // Reorder within the same column
      reorderTaskInColumn(fromColumnId, task, dropY);
    } else {
      // Move to different column
      moveTaskToColumn(fromColumnId, toColumnId, task, dropY);
    }
  };

  const reorderTaskInColumn = (columnId: string, task: Task, dropY: number) => {
    setColumns((prevColumns) => {
      return prevColumns.map((column) => {
        if (column.id === columnId) {
          const taskIndex = column.tasks.findIndex((t) => t.id === task.id);
          if (taskIndex === -1) return column;

          const newTasks = [...column.tasks];
          newTasks.splice(taskIndex, 1);

          // Calculate new position based on drop Y within the column
          const columnStartY =
            columns.findIndex((c) => c.id === columnId) * (COLUMN_HEIGHT + 20);
          const relativeDropY = dropY - columnStartY;
          const taskHeight = 80; // Approximate task height
          const newIndex = Math.floor(relativeDropY / taskHeight);
          const clampedIndex = Math.max(0, Math.min(newIndex, newTasks.length));

          newTasks.splice(clampedIndex, 0, task);

          return { ...column, tasks: newTasks };
        }
        return column;
      });
    });
  };

  const moveTaskToColumn = (
    fromColumnId: string,
    toColumnId: string,
    task: Task,
    dropY: number
  ) => {
    setColumns((prevColumns) => {
      return prevColumns.map((column) => {
        if (column.id === fromColumnId) {
          return {
            ...column,
            tasks: column.tasks.filter((t) => t.id !== task.id),
          };
        }
        if (column.id === toColumnId) {
          const newTasks = [...column.tasks];
          const taskHeight = 80;

          // Calculate position within the target column
          const columnStartY =
            columns.findIndex((c) => c.id === toColumnId) *
            (COLUMN_HEIGHT + 20);
          const relativeDropY = dropY - columnStartY;
          const newIndex = Math.floor(relativeDropY / taskHeight);
          const clampedIndex = Math.max(0, Math.min(newIndex, newTasks.length));

          // Update task status based on target column
          const updatedTask = {
            ...task,
            status: toColumnId as "todo" | "in-progress" | "completed",
            completed: toColumnId === "completed",
          };

          newTasks.splice(clampedIndex, 0, updatedTask);
          return { ...column, tasks: newTasks };
        }
        return column;
      });
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const Column = ({ column, index }: { column: Column; index: number }) => {
    return (
      <View className="mb-5" style={{ height: COLUMN_HEIGHT }}>
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <View
              className="w-3 h-3 rounded-full mr-2"
              style={{ backgroundColor: column.color }}
            />
            <Text className="font-bold text-lg text-gray-900">
              {column.title}
            </Text>
          </View>
          <View className="bg-gray-100 rounded-full px-2 py-1">
            <Text className="text-sm font-medium text-gray-600">
              {column.tasks.length}
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
        >
          {column.tasks.map((task, taskIndex) => (
            <TaskItem
              key={task.id}
              task={task}
              columnId={column.id}
              index={taskIndex}
            />
          ))}

          {column.tasks.length === 0 && (
            <View className="flex-row items-center justify-center py-8">
              <MaterialIcons name="event-busy" size={24} color="#9CA3AF" />
              <Text className="ml-2 text-gray-500">No tasks</Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1 bg-gray-50">
        <View className="flex-1 px-4">
          {/* Header */}
          <View className="flex-row items-center justify-between py-4">
            <Text className="text-2xl font-bold text-gray-900">
              Kanban Board
            </Text>
            <TouchableOpacity
              className="bg-blue-500 rounded-full p-2"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                // Add new task functionality
              }}
            >
              <MaterialIcons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Kanban Board - Vertical Layout */}
          <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {columns.map((column, index) => (
              <Column key={column.id} column={column} index={index} />
            ))}
          </ScrollView>

          {/* Drag Instructions */}
          {isDragging && (
            <View className="absolute bottom-4 left-4 right-4 bg-blue-500 rounded-lg p-3">
              <Text className="text-white text-center font-medium">
                Drag to reorder or move between columns
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default kanban;
