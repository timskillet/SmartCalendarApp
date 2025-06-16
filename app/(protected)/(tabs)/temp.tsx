import { Calendar, Event } from "@/components/calendar/types";
import { supabase } from "@/lib/supabase";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns";
import { useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Task {
  id: string;
  title: string;
  dueDate: Date;
  completed: boolean;
  priority: "high" | "medium" | "low";
}

interface Habit {
  id: string;
  title: string;
  frequency: "daily" | "weekly" | "monthly";
  streak: number;
  completed: boolean;
}

interface Goal {
  id: string;
  title: string;
  targetDate: Date;
  progress: number;
  category: string;
}

const fakeGoals = [
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

const fakeTasks = [
  { id: "t1", text: "Finish project report", done: false },
  { id: "t2", text: "Schedule team meeting", done: false },
];

const CalendarScreen = () => {
  const params = useLocalSearchParams();
  const selectedCalendarId = params.selectedCalendarId as string;
  const calendarName = params.calendarName as string | undefined;
  const [calendar, setCalendar] = useState<Calendar | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [activeTab, setActiveTab] = useState<
    "events" | "tasks" | "habits" | "goals"
  >("events");

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

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !selectedCalendarId) return;

      const startOfSelectedDay = startOfDay(selectedDate);
      const endOfSelectedDay = endOfDay(selectedDate);

      // Fetch Events
      const { data: calendarEvents, error: eventsError } = await supabase
        .from("calendar_entries")
        .select("*")
        .eq("calendar_id", selectedCalendarId)
        .gte("start_time", startOfSelectedDay.toISOString())
        .lte("end_time", endOfSelectedDay.toISOString());

      if (!eventsError) {
        setEvents(
          calendarEvents.map((event) => ({
            id: event.id,
            calendarId: event.calendar_id,
            title: event.title,
            type: event.type,
            startTime: new Date(event.start_time),
            endTime: new Date(event.end_time),
            completed: event.completed,
            color: event.color || "#3B82F6",
            description: event.description,
            location: event.location,
            invitees: event.invitees,
            repeat: event.repeat,
            position: 0,
            createdAt: new Date(event.created_at),
            updatedAt: event.updated_at
              ? new Date(event.updated_at)
              : undefined,
          }))
        );
      }

      // Fetch Tasks
      const { data: tasksData, error: tasksError } = await supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .gte("due_date", startOfSelectedDay.toISOString())
        .lte("due_date", endOfSelectedDay.toISOString());

      if (!tasksError) {
        setTasks(
          tasksData.map((task) => ({
            id: task.id,
            title: task.title,
            dueDate: new Date(task.due_date),
            completed: task.completed,
            priority: task.priority,
          }))
        );
      }

      // Fetch Habits
      const { data: habitsData, error: habitsError } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id);

      if (!habitsError) {
        setHabits(habitsData);
      }

      // Fetch Goals
      const { data: goalsData, error: goalsError } = await supabase
        .from("goals")
        .select("*")
        .eq("user_id", user.id)
        .gte("target_date", startOfSelectedDay.toISOString());

      if (!goalsError) {
        setGoals(
          goalsData.map((goal) => ({
            id: goal.id,
            title: goal.title,
            targetDate: new Date(goal.target_date),
            progress: goal.progress,
            category: goal.category,
          }))
        );
      }
    };

    fetchData();
  }, [selectedCalendarId, selectedDate]);

  const handlePreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1));
  };

  const handleNextDay = () => {
    setSelectedDate(addDays(selectedDate, 1));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "events":
        return (
          <View className="flex-1">
            {events.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">
                No events for this day
              </Text>
            ) : (
              events.map((event) => (
                <View
                  key={event.id}
                  className="bg-white rounded-lg p-4 mb-3 shadow-sm"
                  style={{ borderLeftWidth: 4, borderLeftColor: event.color }}
                >
                  <Text className="text-lg font-semibold">{event.title}</Text>
                  <Text className="text-gray-600">
                    {format(event.startTime, "h:mm a")} -{" "}
                    {format(event.endTime, "h:mm a")}
                  </Text>
                  {event.location && (
                    <Text className="text-gray-500 mt-1">
                      📍 {event.location}
                    </Text>
                  )}
                  {event.description && (
                    <Text className="text-gray-500 mt-1">
                      {event.description}
                    </Text>
                  )}
                </View>
              ))
            )}
          </View>
        );

      case "tasks":
        return (
          <View className="flex-1">
            {tasks.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">
                No tasks for this day
              </Text>
            ) : (
              tasks.map((task) => (
                <View
                  key={task.id}
                  className="bg-white rounded-lg p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold">{task.title}</Text>
                    <View
                      className={`px-2 py-1 rounded ${
                        task.priority === "high"
                          ? "bg-red-100"
                          : task.priority === "medium"
                          ? "bg-yellow-100"
                          : "bg-green-100"
                      }`}
                    >
                      <Text
                        className={`text-sm ${
                          task.priority === "high"
                            ? "text-red-600"
                            : task.priority === "medium"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {task.priority}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-600">
                    Due: {format(task.dueDate, "h:mm a")}
                  </Text>
                </View>
              ))
            )}
          </View>
        );

      case "habits":
        return (
          <View className="flex-1">
            {habits.length === 0 ? (
              <Text className="text-gray-500 text-center py-4">
                No habits tracked
              </Text>
            ) : (
              habits.map((habit) => (
                <View
                  key={habit.id}
                  className="bg-white rounded-lg p-4 mb-3 shadow-sm"
                >
                  <View className="flex-row items-center justify-between">
                    <Text className="text-lg font-semibold">{habit.title}</Text>
                    <View className="flex-row items-center">
                      <Text className="text-blue-500 mr-2">
                        🔥 {habit.streak} days
                      </Text>
                      <MaterialIcons
                        name={
                          habit.completed
                            ? "check-circle"
                            : "radio-button-unchecked"
                        }
                        size={24}
                        color={habit.completed ? "#10B981" : "#6B7280"}
                      />
                    </View>
                  </View>
                  <Text className="text-gray-600 capitalize">
                    {habit.frequency}
                  </Text>
                </View>
              ))
            )}
          </View>
        );

      case "goals":
        return (
          <View className="flex-1">
            <Text className="text-xl font-bold mb-2">GOALS</Text>
            <View className="flex-row flex-wrap -mx-2">
              {fakeGoals.map((goal) => (
                <View
                  key={goal.id}
                  className="w-1/2 px-2 mb-4"
                  style={{ minWidth: 180, maxWidth: "50%" }}
                >
                  <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 min-h-[140px]">
                    <View className="flex-row items-center mb-2">
                      {goal.type === "habit" && (
                        <MaterialIcons
                          name="check-circle"
                          size={22}
                          color={goal.iconColor}
                        />
                      )}
                      {goal.type === "numeric" && (
                        <MaterialIcons
                          name="home"
                          size={22}
                          color={goal.iconColor}
                        />
                      )}
                      {goal.type === "checklist" && (
                        <MaterialIcons
                          name="check-box"
                          size={22}
                          color={goal.iconColor}
                        />
                      )}
                      {goal.type === "time" && (
                        <Ionicons
                          name="bar-chart"
                          size={22}
                          color={goal.iconColor}
                        />
                      )}
                      <Text className="ml-2 text-base font-semibold">
                        {goal.title}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs mb-1">
                      {goal.subtitle}
                    </Text>
                    {/* Goal Details */}
                    {goal.type === "habit" && (
                      <Text className="text-gray-700 text-sm">
                        {goal.frequency}
                      </Text>
                    )}
                    {goal.type === "numeric" &&
                      typeof goal.current === "number" &&
                      typeof goal.target === "number" && (
                        <View className="mt-1">
                          <Text className="text-gray-700 text-sm mb-1">
                            ${goal.current.toLocaleString()} of $
                            {goal.target.toLocaleString()}
                          </Text>
                          <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <View
                              className="h-2 bg-blue-500 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (goal.current / goal.target) * 100
                                )}%`,
                              }}
                            />
                          </View>
                          <Text className="text-gray-500 text-xs mt-1">
                            {Math.round((goal.current / goal.target) * 100)} %
                          </Text>
                        </View>
                      )}
                    {goal.type === "checklist" &&
                      Array.isArray(goal.checklist) && (
                        <View className="mt-1">
                          {goal.checklist.map((item, idx) => (
                            <View
                              key={idx}
                              className="flex-row items-center mb-1"
                            >
                              <MaterialIcons
                                name={
                                  item.done ? "check" : "radio-button-unchecked"
                                }
                                size={16}
                                color={item.done ? "#10B981" : "#9ca3af"}
                              />
                              <Text
                                className={`ml-2 text-sm ${
                                  item.done ? "text-gray-700" : "text-gray-500"
                                }`}
                              >
                                {item.text}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    {goal.type === "time" &&
                      typeof goal.hours === "number" &&
                      typeof goal.targetHours === "number" && (
                        <View className="mt-1">
                          <View className="flex-row items-end mb-1">
                            {[...Array(goal.targetHours)].map((_, i) => (
                              <View
                                key={i}
                                className={`w-2 h-5 mx-0.5 rounded ${
                                  i < goal.hours
                                    ? "bg-purple-500"
                                    : "bg-gray-200"
                                }`}
                              />
                            ))}
                          </View>
                          <Text className="text-gray-700 text-sm">
                            {goal.hours} hr this week
                          </Text>
                        </View>
                      )}
                  </View>
                </View>
              ))}
            </View>
            <Text className="text-lg font-bold mt-2 mb-1">TASKS</Text>
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              {fakeTasks.map((task) => (
                <View key={task.id} className="flex-row items-center mb-2">
                  <MaterialIcons
                    name={task.done ? "check-circle" : "radio-button-unchecked"}
                    size={20}
                    color={task.done ? "#2563eb" : "#9ca3af"}
                  />
                  <Text
                    className={`ml-2 text-base ${
                      task.done ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    {task.text}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <View className="px-4 py-2">
        <Text className="text-3xl font-bold">{calendarName}</Text>
      </View>

      {/* Date Navigation */}
      <View className="flex-row justify-between items-center px-4 py-2 border-b border-gray-200">
        <TouchableOpacity onPress={handlePreviousDay} className="p-2">
          <Text className="text-lg">←</Text>
        </TouchableOpacity>
        <Text className="text-xl font-semibold">
          {format(selectedDate, "EEEE, MMMM d, yyyy")}
        </Text>
        <TouchableOpacity onPress={handleNextDay} className="p-2">
          <Text className="text-lg">→</Text>
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setActiveTab("events")}
          className={`flex-1 py-3 ${
            activeTab === "events" ? "border-b-2 border-blue-500" : ""
          }`}
        >
          <Text
            className={`text-center ${
              activeTab === "events" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Events
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("tasks")}
          className={`flex-1 py-3 ${
            activeTab === "tasks" ? "border-b-2 border-blue-500" : ""
          }`}
        >
          <Text
            className={`text-center ${
              activeTab === "tasks" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Tasks
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("habits")}
          className={`flex-1 py-3 ${
            activeTab === "habits" ? "border-b-2 border-blue-500" : ""
          }`}
        >
          <Text
            className={`text-center ${
              activeTab === "habits" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Habits
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab("goals")}
          className={`flex-1 py-3 ${
            activeTab === "goals" ? "border-b-2 border-blue-500" : ""
          }`}
        >
          <Text
            className={`text-center ${
              activeTab === "goals" ? "text-blue-500" : "text-gray-500"
            }`}
          >
            Goals
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-2">{renderTabContent()}</ScrollView>

      {/* Quick Actions */}
      <View className="flex-row justify-between items-center px-4 py-2 border-t border-gray-200">
        <TouchableOpacity className="flex-row items-center">
          <MaterialIcons name="today" size={24} color="#3B82F6" />
          <Text className="ml-2 text-blue-500">Today</Text>
        </TouchableOpacity>
        <TouchableOpacity className="flex-row items-center">
          <MaterialIcons name="add" size={24} color="#3B82F6" />
          <Text className="ml-2 text-blue-500">Add New</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CalendarScreen;
