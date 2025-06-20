import { MaterialIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";
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

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

const board = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Task 1",
      description: "Description 1",
      completed: false,
    },
    {
      id: "2",
      title: "Task 2",
      description: "Description 2",
      completed: false,
    },
    {
      id: "3",
      title: "Task 3",
      description: "Description 3",
      completed: false,
    },
  ]);

  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([
    {
      id: "4",
      title: "Task 4",
      description: "Description 4",
      completed: false,
    },
    {
      id: "5",
      title: "Task 5",
      description: "Description 5",
      completed: false,
    },
    {
      id: "6",
      title: "Task 6",
      description: "Description 6",
      completed: false,
    },
  ]);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [draggedFromSection, setDraggedFromSection] = useState<
    "scheduled" | "unscheduled" | null
  >(null);
  const [draggedFromIndex, setDraggedFromIndex] = useState<number>(-1);

  const scheduledSectionRef = useRef<View>(null);
  const unscheduledSectionRef = useRef<View>(null);

  const moveTaskToScheduled = (taskId: string, dropIndex?: number) => {
    const task = unscheduledTasks.find((t) => t.id === taskId);
    if (task) {
      setUnscheduledTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (dropIndex !== undefined) {
        setTasks((prev) => {
          const newTasks = [...prev];
          newTasks.splice(dropIndex, 0, task);
          return newTasks;
        });
      } else {
        setTasks((prev) => [...prev, task]);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const moveTaskToUnscheduled = (taskId: string, dropIndex?: number) => {
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      if (dropIndex !== undefined) {
        setUnscheduledTasks((prev) => {
          const newTasks = [...prev];
          newTasks.splice(dropIndex, 0, task);
          return newTasks;
        });
      } else {
        setUnscheduledTasks((prev) => [...prev, task]);
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const reorderTasksInSection = (
    section: "scheduled" | "unscheduled",
    fromIndex: number,
    toIndex: number
  ) => {
    if (section === "scheduled") {
      setTasks((prev) => {
        const newTasks = [...prev];
        const [movedTask] = newTasks.splice(fromIndex, 1);
        newTasks.splice(toIndex, 0, movedTask);
        return newTasks;
      });
    } else {
      setUnscheduledTasks((prev) => {
        const newTasks = [...prev];
        const [movedTask] = newTasks.splice(fromIndex, 1);
        newTasks.splice(toIndex, 0, movedTask);
        return newTasks;
      });
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const TaskItem = ({
    task,
    section,
    index,
  }: {
    task: Task;
    section: "scheduled" | "unscheduled";
    index: number;
  }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);
    const lastTouchX = useSharedValue(0);
    const lastTouchY = useSharedValue(0);

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
      .minDistance(0)
      .onBegin(() => {
        runOnJS(setIsDragging)(true);
        runOnJS(setDraggedTask)(task);
        runOnJS(setDraggedFromSection)(section);
        runOnJS(setDraggedFromIndex)(index);
        scale.value = withSpring(1.05);
        zIndex.value = 1000;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      })
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        lastTouchX.value = event.absoluteX;
        lastTouchY.value = event.absoluteY;
      })
      .onEnd(() => {
        runOnJS(setIsDragging)(false);
        scale.value = withSpring(1);
        zIndex.value = 0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        // Get drop zones and check if task should be moved
        scheduledSectionRef.current?.measureInWindow((x, y, width, height) => {
          unscheduledSectionRef.current?.measureInWindow((ux, uy, uw, uh) => {
            const dropY = lastTouchY.value;
            const dropX = lastTouchX.value;

            // Check if dropped in scheduled section
            if (
              dropY >= y &&
              dropY <= y + height &&
              dropX >= x &&
              dropX <= x + width
            ) {
              if (section === "unscheduled") {
                // Moving from unscheduled to scheduled
                const taskHeight = 80;
                const relativeDropY = dropY - y;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                runOnJS(moveTaskToScheduled)(task.id, dropIndex);
              } else if (section === "scheduled") {
                // Reordering within scheduled section
                const taskHeight = 80;
                const relativeDropY = dropY - y;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                if (dropIndex !== index) {
                  runOnJS(reorderTasksInSection)("scheduled", index, dropIndex);
                }
              }
            }
            // Check if dropped in unscheduled section
            else if (
              dropY >= uy &&
              dropY <= uy + uh &&
              dropX >= ux &&
              dropX <= ux + uw
            ) {
              if (section === "scheduled") {
                // Moving from scheduled to unscheduled
                const taskHeight = 80;
                const relativeDropY = dropY - uy;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                runOnJS(moveTaskToUnscheduled)(task.id, dropIndex);
              } else if (section === "unscheduled") {
                // Reordering within unscheduled section
                const taskHeight = 80;
                const relativeDropY = dropY - uy;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                if (dropIndex !== index) {
                  runOnJS(reorderTasksInSection)(
                    "unscheduled",
                    index,
                    dropIndex
                  );
                }
              }
            }

            // Always reset drag state
            runOnJS(setDraggedTask)(null);
            runOnJS(setDraggedFromSection)(null);
            runOnJS(setDraggedFromIndex)(-1);
          });
        });
      })
      .runOnJS(true);

    return (
      <GestureDetector gesture={dragGesture}>
        <Animated.View style={animatedStyle}>
          <View className="rounded-xl bg-white p-4 flex-col items-center justify-center gap-2 mb-2">
            <Text className="text-center">{task.title}</Text>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView>
        <View className="flex-col gap-4">
          <View
            ref={scheduledSectionRef}
            className="bg-gray-500 border border-black rounded-xl m-4"
          >
            <View className="items-center justify-center">
              <Text className="text-2xl font-bold">Scheduled Tasks</Text>
              {tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  section="scheduled"
                  index={index}
                />
              ))}
              <TouchableOpacity className="flex-row items-center justify-center bg-blue-500 p-4 border border-gray-500 rounded-xl">
                <MaterialIcons name="add" size={24} color="white" />
                <Text>Add new task</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View
            ref={unscheduledSectionRef}
            className="bg-gray-500 border border-black rounded-xl m-4"
          >
            <View className="items-center justify-center">
              <Text className="text-2xl font-bold">Unscheduled Tasks</Text>
              {unscheduledTasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  section="unscheduled"
                  index={index}
                />
              ))}
              <TouchableOpacity className="flex-row items-center justify-center bg-blue-500 p-4 border border-gray-500 rounded-xl">
                <MaterialIcons name="add" size={24} color="white" />
                <Text>Add new task</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default board;
