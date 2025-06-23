import Board from "@/components/Board";
import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { SafeAreaView, ScrollView, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  scheduled?: boolean;
}

const Kanban = () => {
  const [unscheduledTasks, setUnscheduledTasks] = useState<Task[]>([
    {
      id: "1",
      title: "Prepare presentation",
      description: "Description 1",
      completed: false,
      scheduled: false,
    },
    {
      id: "2",
      title: "Send report",
      description: "Description 2",
      completed: false,
      scheduled: false,
    },
    {
      id: "3",
      title: "Email client",
      description: "Description 3",
      completed: false,
      scheduled: false,
    },
    {
      id: "4",
      title: "Book flight",
      description: "Description 4",
      completed: false,
      scheduled: false,
    },
  ]);

  const [scheduledTasks, setScheduledTasks] = useState<Task[]>([
    {
      id: "5",
      title: "Team meeting",
      description: "9:00 AM – 10:00 AM",
      completed: false,
      scheduled: true,
    },
    {
      id: "6",
      title: "Project review",
      description: "11:00 AM – 12:00 PM",
      completed: false,
      scheduled: true,
    },
    {
      id: "7",
      title: "Lunch with Sarah",
      description: "12:30 PM – 1:30 PM",
      completed: false,
      scheduled: true,
    },
    {
      id: "8",
      title: "Write blog post",
      description: "2:00 PM – 3:00 PM",
      completed: false,
      scheduled: true,
    },
  ]);

  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scheduledRef = useRef<View>(null);
  const unscheduledRef = useRef<View>(null);

  const allBoardRefs: Record<string, React.RefObject<View>> = {
    unscheduled: unscheduledRef as React.RefObject<View>,
    scheduled: scheduledRef as React.RefObject<View>,
  };

  const allTasks: Record<string, Task[]> = {
    unscheduled: unscheduledTasks,
    scheduled: scheduledTasks,
  };

  const handleUnscheduledReorder = (from: number, to: number) => {
    setUnscheduledTasks((prev) => {
      const newTasks = [...prev];
      const [movedTask] = newTasks.splice(from, 1);
      newTasks.splice(to, 0, movedTask);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("unscheduledTasks:", newTasks.length);
      console.log("scheduledTasks:", scheduledTasks.length);
      return newTasks;
    });
  };

  const handleScheduledReorder = (from: number, to: number) => {
    setScheduledTasks((prev) => {
      const newTasks = [...prev];
      const [movedTask] = newTasks.splice(from, 1);
      newTasks.splice(to, 0, movedTask);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      console.log("unscheduledTasks:", unscheduledTasks.length);
      console.log("scheduledTasks:", newTasks.length);
      return newTasks;
    });
  };

  // Move task between boards
  const handleTaskDrop = (
    task: Task,
    fromBoard: string,
    toBoard: string,
    toIndex: number
  ) => {
    if (fromBoard === toBoard) return;
    if (fromBoard === "unscheduled" && toBoard === "scheduled") {
      setUnscheduledTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== task.id);
        console.log("unscheduledTasks:", filtered.length);
        return filtered;
      });
      setScheduledTasks((prev) => {
        const newTasks = [...prev];
        newTasks.splice(toIndex, 0, task);
        console.log("scheduledTasks:", newTasks.length);
        return newTasks;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else if (fromBoard === "scheduled" && toBoard === "unscheduled") {
      setScheduledTasks((prev) => {
        const filtered = prev.filter((t) => t.id !== task.id);
        console.log("scheduledTasks:", filtered.length);
        return filtered;
      });
      setUnscheduledTasks((prev) => {
        const newTasks = [...prev];
        newTasks.splice(toIndex, 0, task);
        console.log("unscheduledTasks:", newTasks.length);
        return newTasks;
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleHoverBoard = (boardId: string | null, index: number | null) => {
    if (boardId && index !== null) {
      // Ensure the index is within bounds for the target board
      const targetBoardTasks =
        boardId === "unscheduled" ? unscheduledTasks : scheduledTasks;
      const clampedIndex = Math.max(
        0,
        Math.min(targetBoardTasks.length, index)
      );
      setHoveredBoardId(boardId);
      setHoveredIndex(clampedIndex);
    } else {
      setHoveredBoardId(null);
      setHoveredIndex(null);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1">
      <SafeAreaView className="flex-1">
        <View className="flex-1 rounded-lg bg-gray-200 p-4 m-4 items-center justify-center">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View
              style={{
                flexDirection: "row",
                flex: 1,
                width: "100%",
                paddingHorizontal: 12,
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              {/* Unscheduled Tasks Column */}
              <Board
                boardId="unscheduled"
                title="Unscheduled Tasks"
                tasks={unscheduledTasks}
                onReorder={handleUnscheduledReorder}
                onTaskDrop={handleTaskDrop}
                innerRef={unscheduledRef as React.RefObject<View>}
                allBoardRefs={allBoardRefs}
                allTasks={allTasks}
                hoveredBoardId={hoveredBoardId}
                hoveredIndex={hoveredIndex}
                onHoverBoard={handleHoverBoard}
              />
              {/* Scheduled Tasks Column */}
              <Board
                boardId="scheduled"
                title="Scheduled Tasks"
                tasks={scheduledTasks}
                onReorder={handleScheduledReorder}
                onTaskDrop={handleTaskDrop}
                innerRef={scheduledRef as React.RefObject<View>}
                allBoardRefs={allBoardRefs}
                allTasks={allTasks}
                hoveredBoardId={hoveredBoardId}
                hoveredIndex={hoveredIndex}
                onHoverBoard={handleHoverBoard}
              />
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default Kanban;
