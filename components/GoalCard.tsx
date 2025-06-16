import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface ChecklistItem {
  text: string;
  done: boolean;
}

interface BaseGoal {
  id: string;
  type: "habit" | "numeric" | "checklist" | "time";
  icon: string;
  iconColor: string;
  title: string;
  subtitle: string;
}

interface RecurringGoal extends BaseGoal {
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

type Goal = RecurringGoal | NumericGoal | ChecklistGoal | TimeGoal;

interface GoalCardProps {
  goal: Goal;
  onPress?: () => void;
}

const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const renderGoalIcon = () => {
    switch (goal.type) {
      case "habit":
        return (
          <MaterialIcons name="check-circle" size={20} color={goal.iconColor} />
        );
      case "numeric":
        return <MaterialIcons name="home" size={20} color={goal.iconColor} />;
      case "checklist":
        return (
          <MaterialIcons name="check-box" size={20} color={goal.iconColor} />
        );
      case "time":
        return <Ionicons name="bar-chart" size={20} color={goal.iconColor} />;
    }
  };

  const renderGoalContent = () => {
    switch (goal.type) {
      case "habit":
        return (
          <View className="flex-1 justify-center">
            <Text className="text-gray-700 text-xs">{goal.frequency}</Text>
          </View>
        );

      case "numeric":
        return (
          <View className="flex-1 justify-center">
            <Text className="text-gray-700 text-xs mb-1">
              ${goal.current.toLocaleString()} of $
              {goal.target.toLocaleString()}
            </Text>
            <View className="h-1.5 w-20 bg-gray-200 rounded-full overflow-hidden">
              <View
                className="h-1.5 bg-blue-500 rounded-full"
                style={{
                  width: `${Math.round((goal.current / goal.target) * 100)}%`,
                }}
              />
            </View>
            <Text className="text-gray-500 text-xs mt-1">
              {Math.round((goal.current / goal.target) * 100)}%
            </Text>
          </View>
        );

      case "checklist":
        return (
          <View className="flex-1 justify-center">
            {goal.checklist.slice(0, 2).map((item, idx) => (
              <View key={idx} className="flex-row items-center mb-1">
                <MaterialIcons
                  name={item.done ? "check" : "radio-button-unchecked"}
                  size={14}
                  color={item.done ? "#10B981" : "#9ca3af"}
                />
                <Text
                  className={`ml-1 text-xs ${
                    item.done ? "text-gray-700" : "text-gray-500"
                  }`}
                  numberOfLines={1}
                >
                  {item.text}
                </Text>
              </View>
            ))}
            {goal.checklist.length > 2 && (
              <Text className="text-gray-500 text-xs mt-1">
                +{goal.checklist.length - 2} more
              </Text>
            )}
          </View>
        );

      case "time":
        return (
          <View className="flex-1 justify-center">
            <View className="flex-row items-end mb-1">
              {[...Array(goal.targetHours)].map((_, i) => (
                <View
                  key={i}
                  className={`w-1.5 h-4 mx-0.5 rounded ${
                    i < goal.hours ? "bg-purple-500" : "bg-gray-200"
                  }`}
                />
              ))}
            </View>
            <Text className="text-gray-700 text-xs">
              {goal.hours} hr this week
            </Text>
          </View>
        );
    }
  };

  return (
    <View className="bg-white rounded-xl p-3 shadow-sm border border-gray-200 h-[140px] w-[160px]">
      <View className="flex-row items-center mb-1">
        {renderGoalIcon()}
        <Text className="ml-1.5 text-sm font-semibold flex-1" numberOfLines={1}>
          {goal.title}
        </Text>
      </View>
      <Text className="text-gray-500 text-xs mb-1.5" numberOfLines={1}>
        {goal.subtitle}
      </Text>
      {renderGoalContent()}
    </View>
  );
};

export default GoalCard;
