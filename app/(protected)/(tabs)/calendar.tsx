import GoalCard from "@/components/GoalCard";
import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type EventIcon = "check-circle" | "edit" | "directions-run";

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

const calendar = () => {
  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="flex-1 bg-white px-4 pb-2">
        {/* Today Section */}
        <ScrollView className="flex-1">
          <View className="mt-4">
            <Text className="text-2xl font-bold mb-2">Today</Text>
            <View className="mb-4">
              {fakeEvents.map((event, idx) => (
                <View
                  key={event.id}
                  className="flex-row items-center mb-2 px-2 py-3 rounded-2xl"
                  style={{ backgroundColor: event.color }}
                >
                  <View className="mr-3">
                    <MaterialIcons
                      name={event.checked ? "check-box" : event.icon}
                      size={24}
                      color={event.checked ? "#6366f1" : "#6b7280"}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-gray-900">
                      {event.title}
                    </Text>
                  </View>
                  <Text className="text-gray-700 text-base font-medium">
                    {event.time}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Goals */}
          <Text className="text-2xl font-bold mb-2">Goals</Text>
          <ScrollView horizontal className="flex-1">
            <View className="mt-4">
              <View className="flex-row flex-wrap -mx-2">
                {fakeGoals.map((goal) => (
                  <TouchableOpacity key={goal.id} className="w-1/2 px-2 mb-4">
                    <GoalCard goal={goal} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

export default calendar;
