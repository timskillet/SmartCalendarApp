import GoalCard from "@/components/GoalCard";
import CalendarPreview from "@/components/calendar/CalendarPreview";
import { ShareCalendarModal } from "@/components/calendar/ShareCalendarModal";
import { Calendar } from "@/components/calendar/types";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
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

const dashboard = () => {
  const params = useLocalSearchParams();
  const selectedCalendarId = params.selectedCalendarId as string;
  const calendarName = params.calendarName as string | undefined;
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);

  useEffect(() => {
    const fetchCalendars = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userCalendars, error } = await supabase
        .from("calendars")
        .select("*")
        .eq("id", selectedCalendarId);

      if (error) {
        console.error("Error fetching calendars:", error);
        return;
      }
      setCalendar(userCalendars[0]);
    };

    fetchCalendars();
  }, [selectedCalendarId]);

  return (
    <SafeAreaView className="flex-1">
      <View className="flex-1 px-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-2xl font-bold">{calendarName}</Text>
          <View className="flex-row gap-5">
            <TouchableOpacity onPress={() => setIsShareModalVisible(true)}>
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

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {/* Calendar */}
          <CalendarPreview />

          {/* Today Section */}
          <View className="flex-1 mt-4">
            <Text className="text-2xl font-bold mb-2">Today's Agenda</Text>
            <View className="mb-4">
              {fakeEvents.map((event, idx) => (
                <TouchableOpacity
                  key={idx}
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
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                className="bg-gray-300 flex-row items-center mb-2 px-2 py-3 rounded-2xl"
                onPress={() => router.push("/scheduler")}
              >
                <View className="mr-3">
                  <MaterialIcons name={"add"} size={24} color={"gray"} />
                </View>
                <View className="flex-1">
                  <Text className="text-base font-semibold text-gray-900">
                    Add new task
                  </Text>
                </View>
                <Text className="text-gray-700 text-base font-medium"></Text>
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
          calendarId={selectedCalendarId}
          calendarName={calendarName || "Calendar"}
        />
      </View>
    </SafeAreaView>
  );
};

export default dashboard;
