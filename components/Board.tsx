import React from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
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

// Place these outside the component so they are not recreated on every render
const ItemHeight = 80;
const MarginBottom = 12;

function listToObject(list: Task[]) {
  const data: Record<string, number> = {};
  list.forEach((item, index) => {
    data[item.id] = index;
  });
  return data;
}

interface BoardProps {
  boardId: string;
  title: string;
  tasks: Task[];
  onReorder: (from: number, to: number) => void;
  onTaskDrop: (
    task: Task,
    fromBoard: string,
    toBoard: string,
    toIndex: number
  ) => void;
  innerRef?: React.RefObject<View>;
  allBoardRefs: Record<string, React.RefObject<View>>;
  hoveredBoardId: string | null;
  hoveredIndex: number | null;
  onHoverBoard: (boardId: string | null, index: number | null) => void;
  allTasks: Record<string, Task[]>;
}

const Board: React.FC<BoardProps> = ({
  boardId,
  title,
  tasks,
  onReorder,
  onTaskDrop,
  innerRef,
  allBoardRefs,
  hoveredBoardId,
  hoveredIndex,
  onHoverBoard,
  allTasks,
}) => {
  const positions = useSharedValue(listToObject(tasks));
  const isDragging = useSharedValue(false);

  React.useEffect(() => {
    positions.value = listToObject(tasks);
  }, [tasks, positions]);

  // JS function to update hover board
  const updateHoverBoard = React.useCallback(
    (absoluteX: number, absoluteY: number) => {
      let foundHoverBoard: string | null = null;
      let foundHoverIndex: number | null = null;
      let measurementsCompleted = 0;
      const totalBoards = Object.keys(allBoardRefs).length;

      Object.entries(allBoardRefs).forEach(([id, ref]) => {
        if (ref.current) {
          ref.current.measureInWindow((x, y, width, height) => {
            measurementsCompleted++;
            if (
              absoluteX >= x &&
              absoluteX <= x + width &&
              absoluteY >= y &&
              absoluteY <= y + height
            ) {
              foundHoverBoard = id;
              const targetBoardTasks = allTasks[id] || [];
              foundHoverIndex = Math.max(
                0,
                Math.min(
                  targetBoardTasks.length,
                  Math.floor(
                    (absoluteY - y) / (ItemHeight + MarginBottom) + 0.5
                  )
                )
              );
            }
            if (measurementsCompleted === totalBoards) {
              onHoverBoard(foundHoverBoard, foundHoverIndex);
            }
          });
        } else {
          measurementsCompleted++;
          if (measurementsCompleted === totalBoards) {
            onHoverBoard(foundHoverBoard, foundHoverIndex);
          }
        }
      });
    },
    [allBoardRefs, allTasks, onHoverBoard]
  );

  // JS function to handle drop
  const handleDrop = React.useCallback(
    (task: Task, dropX: number, dropY: number) => {
      let foundBoard: string | null = null;
      let foundIndex = 0;
      let measurementsCompleted = 0;
      const totalBoards = Object.keys(allBoardRefs).length;

      Object.entries(allBoardRefs).forEach(([id, ref]) => {
        if (ref.current) {
          ref.current.measureInWindow((x, y, width, height) => {
            measurementsCompleted++;
            if (
              dropX >= x &&
              dropX <= x + width &&
              dropY >= y &&
              dropY <= y + height
            ) {
              foundBoard = id;
              const targetBoardTasks = allTasks[id] || [];
              foundIndex = Math.max(
                0,
                Math.min(
                  targetBoardTasks.length,
                  Math.floor((dropY - y) / (ItemHeight + MarginBottom))
                )
              );
            }
            if (measurementsCompleted === totalBoards) {
              if (foundBoard && foundBoard !== boardId) {
                onTaskDrop(task, boardId, foundBoard, foundIndex);
              } else {
                // If not dropped into another board, just reorder in this board
                const from = positions.value[task.id];
                const to = Math.max(
                  0,
                  Math.min(
                    tasks.length - 1,
                    Math.floor(
                      (dropY - (ref.current ? y : 0)) /
                        (ItemHeight + MarginBottom) +
                        0.5
                    )
                  )
                );
                if (from !== to) {
                  onReorder(from, to);
                }
              }
            }
          });
        } else {
          measurementsCompleted++;
          if (measurementsCompleted === totalBoards) {
            // If not dropped into another board, just reorder in this board
            const from = positions.value[task.id];
            const to = Math.max(
              0,
              Math.min(
                tasks.length - 1,
                Math.floor(dropY / (ItemHeight + MarginBottom) + 0.5)
              )
            );
            if (from !== to) {
              onReorder(from, to);
            }
          }
        }
      });
    },
    [allBoardRefs, allTasks, onTaskDrop, boardId, positions, onReorder, tasks]
  );

  const TaskItem = React.memo(
    ({
      task,
      positions,
      isDragging,
      taskCount,
      onDragEnd,
      index,
    }: {
      task: Task;
      positions: Animated.SharedValue<Record<string, number>>;
      isDragging: Animated.SharedValue<boolean>;
      taskCount: number;
      onDragEnd: (from: number, to: number) => void;
      index: number;
    }) => {
      const translateY = useSharedValue(0);
      const translateX = useSharedValue(0);
      const isGestureActive = useSharedValue(false);
      const startY = useSharedValue(0);
      const startX = useSharedValue(0);
      const lastAbsoluteX = useSharedValue(0);
      const lastAbsoluteY = useSharedValue(0);

      const animatedStyle = useAnimatedStyle(() => {
        const position = positions.value[task.id];
        let gap = 0;
        if (hoveredBoardId === boardId && hoveredIndex !== null) {
          if (index === hoveredIndex) {
            gap = ItemHeight + MarginBottom;
          } else if (index > hoveredIndex) {
            gap = 0;
          }
        }
        return {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: ItemHeight,
          transform: [
            {
              translateY: withSpring(
                (isGestureActive.value
                  ? translateY.value
                  : position * (ItemHeight + MarginBottom)) + gap
              ),
            },
            {
              translateX: withSpring(
                isGestureActive.value ? translateX.value : 0
              ),
            },
            { scale: withSpring(isGestureActive.value ? 1.05 : 1) },
          ],
          zIndex: isGestureActive.value ? 100 : 0,
        };
      });

      const gesture = Gesture.Pan()
        .onStart((event) => {
          isGestureActive.value = true;
          isDragging.value = true;
          const currentPosition =
            positions.value[task.id] * (ItemHeight + MarginBottom);
          startY.value = currentPosition;
          startX.value = 0;
          translateY.value = currentPosition;
          translateX.value = 0;
          lastAbsoluteX.value = event.absoluteX;
          lastAbsoluteY.value = event.absoluteY;
        })
        .onUpdate((event) => {
          translateY.value = startY.value + event.translationY;
          translateX.value = startX.value + event.translationX;
          lastAbsoluteX.value = event.absoluteX;
          lastAbsoluteY.value = event.absoluteY;

          // Use runOnJS to update hover board in JS context
          runOnJS(updateHoverBoard)(event.absoluteX, event.absoluteY);

          const oldPosition = positions.value[task.id];
          const newPosition = Math.max(
            0,
            Math.min(
              taskCount - 1,
              Math.floor(translateY.value / (ItemHeight + MarginBottom) + 0.5)
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
          // Use runOnJS to handle drop in JS context
          runOnJS(handleDrop)(task, lastAbsoluteX.value, lastAbsoluteY.value);
          runOnJS(onHoverBoard)(null, null);
        })
        .onFinalize(() => {
          isGestureActive.value = false;
          isDragging.value = false;
        });

      return (
        <GestureDetector gesture={gesture}>
          <Animated.View style={animatedStyle}>
            <View className="h-20 w-full bg-white rounded-lg p-3 justify-center mb-3">
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
    }
  );

  TaskItem.displayName = "TaskItem";

  return (
    <View className="flex-1" ref={innerRef}>
      <Text className="text-xl font-semibold text-gray-700 mb-4 text-center">
        {title}
      </Text>
      <View
        style={{
          height: tasks.length * (ItemHeight + MarginBottom),
          position: "relative",
        }}
        key={tasks.map((t) => t.id).join(",")}
      >
        {tasks.map((task, idx) => (
          <TaskItem
            key={task.id}
            task={task}
            positions={positions}
            isDragging={isDragging}
            taskCount={tasks.length}
            onDragEnd={onReorder}
            index={idx}
          />
        ))}
      </View>
    </View>
  );
};

export default Board;
