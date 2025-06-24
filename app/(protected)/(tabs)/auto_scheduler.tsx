import * as Haptics from "expo-haptics";
import React, { useRef, useState } from "react";
import { SafeAreaView, Text, View } from "react-native";
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

const ItemHeight = 80;
const MarginBottom = 12;

const Board = ({
  tasks,
  title,
  boardId,
  ref,
  onTaskMove,
  onTaskReorder,
  scheduledBoardRef,
  unscheduledBoardRef,
}: {
  tasks: Task[];
  title: string;
  boardId: "scheduled" | "unscheduled";
  ref: React.RefObject<View | null>;
  onTaskMove: (
    taskId: string,
    fromBoard: string,
    toBoard: string,
    dropIndex?: number
  ) => void;
  onTaskReorder: (
    taskId: string,
    fromIndex: number,
    toIndex: number,
    boardId: string
  ) => void;
  scheduledBoardRef: React.RefObject<View | null>;
  unscheduledBoardRef: React.RefObject<View | null>;
}) => {
  // Shared values for drag-to-sort functionality
  const positions = useSharedValue<Record<string, number>>({});
  const isDragging = useSharedValue(false);
  const draggedTaskId = useSharedValue<string | null>(null);
  const boardScale = useSharedValue(1);
  const scheduledHovered = useSharedValue(false);
  const unscheduledHovered = useSharedValue(false);

  // Initialize positions when tasks change
  React.useEffect(() => {
    const newPositions: Record<string, number> = {};
    tasks.forEach((task, index) => {
      newPositions[task.id] = index;
    });
    positions.value = newPositions;
  }, [tasks, boardId]);

  const BoardItem = ({ task, index }: { task: Task; index: number }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const scale = useSharedValue(1);
    const zIndex = useSharedValue(0);
    const lastTouchX = useSharedValue(0);
    const lastTouchY = useSharedValue(0);
    const isGestureActive = useSharedValue(false);
    const startY = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => {
      const position = positions.value[task.id] ?? index;
      const basePosition = position * (ItemHeight + MarginBottom);

      return {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: ItemHeight,
        transform: [
          {
            translateY: withSpring(
              isGestureActive.value
                ? startY.value + translateY.value
                : basePosition
            ),
          },
          { translateX: withSpring(translateX.value) },
          { scale: withSpring(scale.value) },
        ],
        zIndex: isGestureActive.value ? 2000 : zIndex.value,
      };
    });

    const hoverGesture = Gesture.Pan()
      .onStart(() => {})
      .onUpdate((event) => {
        // Get drop zones and check if task should be moved using measureInWindow
        scheduledBoardRef.current?.measureInWindow((x, y, width, height) => {
          unscheduledBoardRef.current?.measureInWindow((ux, uy, uw, uh) => {
            const dropY = lastTouchY.value;
            const dropX = lastTouchX.value;

            // Check if dropped in scheduled section
            if (
              dropY >= y &&
              dropY <= y + height &&
              dropX >= x &&
              dropX <= x + width
            ) {
              if (boardId === "unscheduled") {
                // Moving from unscheduled to scheduled
              } else if (boardId === "scheduled") {
                // Reordering within scheduled section
              }
            }
            // Check if dropped in unscheduled section
            else if (
              dropY >= uy &&
              dropY <= uy + uh &&
              dropX >= ux &&
              dropX <= ux + uw
            ) {
              if (boardId === "scheduled") {
                // Moving from scheduled to unscheduled
              } else if (boardId === "unscheduled") {
                // Reordering within unscheduled section
              }
            }
          });
        });
      })
      .runOnJS(true)
      .onEnd(() => {
        scheduledHovered.value = false;
        unscheduledHovered.value = false;
        boardScale.value = 1;
      });

    const dragGesture = Gesture.Pan()
      .onStart(() => {
        isGestureActive.value = true;
        isDragging.value = true;
        draggedTaskId.value = task.id;

        // Set the initial position for dragging
        const position = positions.value[task.id] ?? index;
        startY.value = position * (ItemHeight + MarginBottom);

        scale.value = withSpring(1.05);
        zIndex.value = 1000;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      })
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
        lastTouchX.value = event.absoluteX;
        lastTouchY.value = event.absoluteY;

        // Drag-to-sort logic within the same board
        const oldPosition = positions.value[task.id];
        const newPosition = Math.max(
          0,
          Math.min(
            tasks.length - 1,
            Math.floor(
              (startY.value + translateY.value) / (ItemHeight + MarginBottom) +
                0.5
            )
          )
        );

        if (oldPosition !== newPosition) {
          const idToMove = Object.keys(positions.value).find(
            (key) => positions.value[key] === newPosition
          );

          if (idToMove) {
            const newPositions = { ...positions.value };
            newPositions[task.id] = newPosition;
            newPositions[idToMove] = oldPosition;
            positions.value = newPositions;
          }
        }
      })
      .onEnd(() => {
        isGestureActive.value = false;
        isDragging.value = false;
        scale.value = withSpring(1);
        zIndex.value = 0;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);

        // Get drop zones and check if task should be moved using measureInWindow
        scheduledBoardRef.current?.measureInWindow((x, y, width, height) => {
          unscheduledBoardRef.current?.measureInWindow((ux, uy, uw, uh) => {
            const dropY = lastTouchY.value;
            const dropX = lastTouchX.value;

            // Check if dropped in scheduled section
            if (
              dropY >= y &&
              dropY <= y + height &&
              dropX >= x &&
              dropX <= x + width
            ) {
              if (boardId === "unscheduled") {
                // Moving from unscheduled to scheduled
                const taskHeight = ItemHeight + MarginBottom;
                const relativeDropY = dropY - y;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                runOnJS(onTaskMove)(
                  task.id,
                  "unscheduled",
                  "scheduled",
                  dropIndex
                );
              } else if (boardId === "scheduled") {
                // Reordering within scheduled section
                const taskHeight = ItemHeight + MarginBottom;
                const relativeDropY = dropY - y;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                if (dropIndex !== index) {
                  runOnJS(onTaskReorder)(
                    task.id,
                    index,
                    dropIndex,
                    "scheduled"
                  );
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
              if (boardId === "scheduled") {
                // Moving from scheduled to unscheduled
                const taskHeight = ItemHeight + MarginBottom;
                const relativeDropY = dropY - uy;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                runOnJS(onTaskMove)(
                  task.id,
                  "scheduled",
                  "unscheduled",
                  dropIndex
                );
              } else if (boardId === "unscheduled") {
                // Reordering within unscheduled section
                const taskHeight = ItemHeight + MarginBottom;
                const relativeDropY = dropY - uy;
                const dropIndex = Math.floor(relativeDropY / taskHeight);
                if (dropIndex !== index) {
                  runOnJS(onTaskReorder)(
                    task.id,
                    index,
                    dropIndex,
                    "unscheduled"
                  );
                }
              }
            }

            // Reset drag state
            draggedTaskId.value = null;
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          });
        });
      })
      .runOnJS(true);

    const composedGesture = Gesture.Simultaneous(hoverGesture, dragGesture);

    return (
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={animatedStyle}>
          <View className="bg-gray-200 rounded-lg p-4 m-2 border border-black">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-lg font-bold">{task.title}</Text>
                <Text className="text-sm text-gray-500">
                  {task.description}
                </Text>
              </View>
              <View className="flex-row items-center">
                <Text>Edit</Text>
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: boardScale.value }],
      borderColor:
        scheduledHovered.value || unscheduledHovered.value
          ? "#3b82f6"
          : "#000000",
      backgroundColor:
        scheduledHovered.value || unscheduledHovered.value
          ? "#eff6ff"
          : "#ffffff",
    };
  });

  const titleAnimatedStyle = useAnimatedStyle(() => {
    return {
      color:
        scheduledHovered.value || unscheduledHovered.value
          ? "#2563eb"
          : "#000000",
    };
  });

  return (
    <Animated.View
      ref={ref}
      className="flex-1 border rounded-lg m-4 p-4"
      style={[
        animatedStyle,
        {
          position: "relative",
          minHeight: Math.max(tasks.length * (ItemHeight + MarginBottom), 200),
        },
      ]}
    >
      <Animated.Text
        className="text-2xl font-bold mb-4"
        style={titleAnimatedStyle}
      >
        {title}
      </Animated.Text>
      <View
        style={{
          minHeight: Math.max(tasks.length * (ItemHeight + MarginBottom), 200),
          position: "relative",
        }}
      >
        {tasks.map((task, index) => (
          <BoardItem key={task.id} task={task} index={index} />
        ))}
      </View>
    </Animated.View>
  );
};

const AutoScheduler = () => {
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

  const scheduledBoardRef = useRef<View | null>(null);
  const unscheduledBoardRef = useRef<View | null>(null);

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

  const handleTaskMove = (
    taskId: string,
    fromBoard: string,
    toBoard: string,
    dropIndex?: number
  ) => {
    if (fromBoard === "scheduled" && toBoard === "unscheduled") {
      moveTaskToUnscheduled(taskId, dropIndex);
    } else if (fromBoard === "unscheduled" && toBoard === "scheduled") {
      moveTaskToScheduled(taskId, dropIndex);
    }
  };

  const handleTaskReorder = (
    taskId: string,
    fromIndex: number,
    toIndex: number,
    boardId: string
  ) => {
    reorderTasksInSection(
      boardId as "scheduled" | "unscheduled",
      fromIndex,
      toIndex
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1">
        <View className="flex-row">
          <Board
            tasks={tasks}
            title="Scheduled"
            boardId="scheduled"
            ref={scheduledBoardRef}
            onTaskMove={handleTaskMove}
            onTaskReorder={handleTaskReorder}
            scheduledBoardRef={scheduledBoardRef}
            unscheduledBoardRef={unscheduledBoardRef}
          />
          <Board
            tasks={unscheduledTasks}
            title="Unscheduled"
            boardId="unscheduled"
            ref={unscheduledBoardRef}
            onTaskMove={handleTaskMove}
            onTaskReorder={handleTaskReorder}
            scheduledBoardRef={scheduledBoardRef}
            unscheduledBoardRef={unscheduledBoardRef}
          />
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default AutoScheduler;
