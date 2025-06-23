import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, SafeAreaView, ScrollView, Text, View } from "react-native";
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
  priority: "high" | "medium" | "low";
  completed: boolean;
  scheduled?: boolean;
}

interface Board {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanData {
  scheduled: Board[];
  unscheduled: Board[];
}

const { width: screenWidth } = Dimensions.get("window");
const ItemHeight = 80;
const MarginBottom = 12;

// Dummy data
const initialData: KanbanData = {
  scheduled: [
    {
      id: "scheduled-high",
      title: "High Priority",
      tasks: [
        {
          id: "1",
          title: "Team Meeting",
          description: "9:00 AM - 10:00 AM",
          priority: "high",
          completed: false,
          scheduled: true,
        },
        {
          id: "2",
          title: "Project Review",
          description: "2:00 PM - 3:00 PM",
          priority: "high",
          completed: false,
          scheduled: true,
        },
      ],
    },
    {
      id: "scheduled-medium",
      title: "Medium Priority",
      tasks: [
        {
          id: "3",
          title: "Lunch with Sarah",
          description: "12:30 PM - 1:30 PM",
          priority: "medium",
          completed: false,
          scheduled: true,
        },
      ],
    },
    {
      id: "scheduled-low",
      title: "Low Priority",
      tasks: [
        {
          id: "4",
          title: "Write Blog Post",
          description: "4:00 PM - 5:00 PM",
          priority: "low",
          completed: false,
          scheduled: true,
        },
      ],
    },
  ],
  unscheduled: [
    {
      id: "unscheduled-high",
      title: "High Priority",
      tasks: [
        {
          id: "5",
          title: "Prepare Presentation",
          description: "Client meeting prep",
          priority: "high",
          completed: false,
          scheduled: false,
        },
        {
          id: "6",
          title: "Send Report",
          description: "Monthly report to stakeholders",
          priority: "high",
          completed: false,
          scheduled: false,
        },
      ],
    },
    {
      id: "unscheduled-medium",
      title: "Medium Priority",
      tasks: [
        {
          id: "7",
          title: "Email Client",
          description: "Follow up on project status",
          priority: "medium",
          completed: false,
          scheduled: false,
        },
        {
          id: "8",
          title: "Update Documentation",
          description: "Update API documentation",
          priority: "medium",
          completed: false,
          scheduled: false,
        },
      ],
    },
    {
      id: "unscheduled-low",
      title: "Low Priority",
      tasks: [
        {
          id: "9",
          title: "Book Flight",
          description: "Book flight for next month",
          priority: "low",
          completed: false,
          scheduled: false,
        },
        {
          id: "10",
          title: "Organize Files",
          description: "Clean up project files",
          priority: "low",
          completed: false,
          scheduled: false,
        },
      ],
    },
  ],
};

const TaskItem = ({
  task,
  boardId,
  onDragStart,
  onDragEnd,
  onReorder,
  taskIndex,
  totalTasks,
  isDragging,
}: {
  task: Task;
  boardId: string;
  onDragStart: (
    task: Task,
    boardId: string,
    index: number,
    x: number,
    y: number
  ) => void;
  onDragEnd: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  taskIndex: number;
  totalTasks: number;
  isDragging: boolean;
}) => {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const isGestureActive = useSharedValue(false);
  const startY = useSharedValue(0);
  const startX = useSharedValue(0);
  const zIndex = useSharedValue(0);
  const lastReorderIndex = useSharedValue(taskIndex);

  const gesture = Gesture.Pan()
    .onStart((event) => {
      isGestureActive.value = true;
      startY.value = translateY.value;
      startX.value = translateX.value;
      zIndex.value = 1000;
      lastReorderIndex.value = taskIndex;

      runOnJS(onDragStart)(
        task,
        boardId,
        taskIndex,
        event.absoluteX,
        event.absoluteY
      );
    })
    .onUpdate((event) => {
      translateY.value = startY.value + event.translationY;
      translateX.value = startX.value + event.translationX;

      // Calculate new position for reordering within the same board
      const newIndex = Math.max(
        0,
        Math.min(
          totalTasks - 1,
          Math.floor(translateY.value / (ItemHeight + MarginBottom) + 0.5)
        )
      );

      // Only trigger reorder if the index actually changed
      if (newIndex !== lastReorderIndex.value) {
        lastReorderIndex.value = newIndex;
        runOnJS(onReorder)(taskIndex, newIndex);
      }
    })
    .onEnd(() => {
      isGestureActive.value = false;
      translateY.value = withSpring(0);
      translateX.value = withSpring(0);
      zIndex.value = 0;

      runOnJS(onDragEnd)();
    })
    .onFinalize(() => {
      isGestureActive.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { translateX: translateX.value },
        { scale: withSpring(isGestureActive.value ? 1.1 : 1) },
      ],
      zIndex: zIndex.value,
      opacity: isDragging ? 0.3 : 1, // Make original task semi-transparent when dragging
    };
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      case "low":
        return "border-l-4 border-l-green-500";
      default:
        return "";
    }
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <View
          className={`h-20 w-full bg-white rounded-lg p-3 justify-center mb-3 shadow-sm ${getPriorityColor(
            task.priority
          )}`}
        >
          <Text className="text-sm font-medium text-gray-700">
            {task.title}
          </Text>
          {task.description ? (
            <Text className="text-xs text-gray-500 mt-1">
              {task.description}
            </Text>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const Board = ({
  board,
  boardId,
  onDragStart,
  onDragEnd,
  onReorder,
  onTaskDrop,
  isHovered,
  onHoverBoard,
}: {
  board: Board;
  boardId: string;
  onDragStart: (
    task: Task,
    boardId: string,
    index: number,
    x: number,
    y: number
  ) => void;
  onDragEnd: () => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onTaskDrop: (
    task: Task,
    fromBoard: string,
    toBoard: string,
    toIndex: number
  ) => void;
  isHovered: boolean;
  onHoverBoard: (boardId: string | null) => void;
}) => {
  const boardRef = useRef<View>(null);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(isHovered ? 1.05 : 1);
  }, [isHovered]);

  const boardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.View
      ref={boardRef}
      style={[boardStyle]}
      className="w-80 bg-gray-100 border border-gray-300 rounded-lg p-4 gap-2"
      onLayout={(event) => {
        // Store board layout for drop detection
        if (boardRef.current) {
          boardRef.current.measureInWindow((x, y, width, height) => {
            // This will be used for drop detection
          });
        }
      }}
    >
      <Text className="text-gray-800 font-bold text-lg mb-4">
        {board.title}
      </Text>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {board.tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            boardId={boardId}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onReorder={onReorder}
            taskIndex={index}
            totalTasks={board.tasks.length}
            isDragging={false} // This will be set by parent
          />
        ))}
      </ScrollView>
    </Animated.View>
  );
};

const KanbanBoard = () => {
  const [kanbanData, setKanbanData] = useState<KanbanData>(initialData);
  const [draggedTask, setDraggedTask] = useState<{
    task: Task;
    fromBoard: string;
    fromIndex: number;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredBoard, setHoveredBoard] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  // Load data from AsyncStorage on component mount
  useEffect(() => {
    loadKanbanData();
  }, []);

  // Save data to AsyncStorage whenever it changes
  useEffect(() => {
    saveKanbanData();
  }, [kanbanData]);

  const loadKanbanData = async () => {
    try {
      const savedData = await AsyncStorage.getItem("kanbanData");
      if (savedData) {
        setKanbanData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error("Error loading kanban data:", error);
    }
  };

  const saveKanbanData = async () => {
    try {
      await AsyncStorage.setItem("kanbanData", JSON.stringify(kanbanData));
    } catch (error) {
      console.error("Error saving kanban data:", error);
    }
  };

  const handleDragStart = (
    task: Task,
    boardId: string,
    index: number,
    x: number,
    y: number
  ) => {
    setDraggedTask({ task, fromBoard: boardId, fromIndex: index, x, y });
    setDragPosition({ x, y });
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setHoveredBoard(null);
  };

  const handleReorder = (fromIndex: number, toIndex: number) => {
    if (!draggedTask) return;

    setKanbanData((prev) => {
      const newData = { ...prev };

      // Find the board in either scheduled or unscheduled
      const section = draggedTask.fromBoard.startsWith("scheduled")
        ? "scheduled"
        : "unscheduled";
      const boardIndex = newData[section].findIndex(
        (board) => board.id === draggedTask.fromBoard
      );

      if (boardIndex !== -1) {
        const board = { ...newData[section][boardIndex] };
        const newTasks = [...board.tasks];
        const [movedTask] = newTasks.splice(fromIndex, 1);
        newTasks.splice(toIndex, 0, movedTask);
        board.tasks = newTasks;
        newData[section][boardIndex] = board;
      }

      return newData;
    });
  };

  const handleTaskDrop = (
    task: Task,
    fromBoard: string,
    toBoard: string,
    toIndex: number
  ) => {
    if (fromBoard === toBoard) return;

    setKanbanData((prev) => {
      const newData = { ...prev };

      // Remove from source board
      const fromSection = fromBoard.startsWith("scheduled")
        ? "scheduled"
        : "unscheduled";
      const fromBoardIndex = newData[fromSection].findIndex(
        (board) => board.id === fromBoard
      );

      if (fromBoardIndex !== -1) {
        const fromBoardData = { ...newData[fromSection][fromBoardIndex] };
        fromBoardData.tasks = fromBoardData.tasks.filter(
          (t) => t.id !== task.id
        );
        newData[fromSection][fromBoardIndex] = fromBoardData;
      }

      // Add to destination board
      const toSection = toBoard.startsWith("scheduled")
        ? "scheduled"
        : "unscheduled";
      const toBoardIndex = newData[toSection].findIndex(
        (board) => board.id === toBoard
      );

      if (toBoardIndex !== -1) {
        const toBoardData = { ...newData[toSection][toBoardIndex] };
        const newTasks = [...toBoardData.tasks];
        newTasks.splice(toIndex, 0, task);
        toBoardData.tasks = newTasks;
        newData[toSection][toBoardIndex] = toBoardData;
      }

      return newData;
    });
  };

  const updateHoveredBoard = (boardId: string | null) => {
    setHoveredBoard(boardId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-4 border-l-red-500";
      case "medium":
        return "border-l-4 border-l-yellow-500";
      case "low":
        return "border-l-4 border-l-green-500";
      default:
        return "";
    }
  };

  return (
    <GestureHandlerRootView>
      <SafeAreaView className="flex-1">
        <ScrollView className="flex-1 bg-gray-50">
          {/* Scheduled Tasks Section */}
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Scheduled Tasks
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              <View className="flex-row gap-4">
                {kanbanData.scheduled.map((board) => (
                  <Board
                    key={board.id}
                    board={board}
                    boardId={board.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onReorder={handleReorder}
                    onTaskDrop={handleTaskDrop}
                    isHovered={hoveredBoard === board.id}
                    onHoverBoard={updateHoveredBoard}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Unscheduled Tasks Section */}
          <View className="p-4">
            <Text className="text-2xl font-bold text-gray-800 mb-4">
              Unscheduled Tasks
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row"
            >
              <View className="flex-row gap-4">
                {kanbanData.unscheduled.map((board) => (
                  <Board
                    key={board.id}
                    board={board}
                    boardId={board.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onReorder={handleReorder}
                    onTaskDrop={handleTaskDrop}
                    isHovered={hoveredBoard === board.id}
                    onHoverBoard={updateHoveredBoard}
                  />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Drag Overlay */}
          {draggedTask && (
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                pointerEvents: "none",
                zIndex: 9999,
              }}
            >
              <View
                style={{
                  position: "absolute",
                  left: dragPosition.x - 100, // Center the item on the finger
                  top: dragPosition.y - 40,
                  width: 200,
                  backgroundColor: "white",
                  borderRadius: 8,
                  padding: 12,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
                className={getPriorityColor(draggedTask.task.priority)}
              >
                <Text className="text-sm font-medium text-gray-700">
                  {draggedTask.task.title}
                </Text>
                {draggedTask.task.description ? (
                  <Text className="text-xs text-gray-500 mt-1">
                    {draggedTask.task.description}
                  </Text>
                ) : null}
              </View>
            </Animated.View>
          )}
        </ScrollView>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

export default KanbanBoard;
