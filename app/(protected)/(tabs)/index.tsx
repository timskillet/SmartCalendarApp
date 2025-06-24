import { MaterialIcons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CalendarCard } from "../../../components/calendar/CalendarCard";
import { CreateCalendarModal } from "../../../components/calendar/CreateCalendarModal";
import { useAuth } from "../../../context/AuthProvider";
import { useCalendar } from "../../../context/CalendarProvider";
import { supabase } from "../../../lib/supabase";

// Color options with their hex values
const colorOptions = [
  { name: "Red", color: "#FF0000" },
  { name: "Blue", color: "#0000FF" },
  { name: "Green", color: "#00FF00" },
  { name: "Yellow", color: "#FFFF00" },
  { name: "Purple", color: "#800080" },
];

interface Task {
  id: string;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  completed: boolean;
  calendar_id: string;
  calendar: {
    color: string;
  };
}

export default function HomeScreen() {
  const { signOut } = useAuth();
  const {
    calendars,
    isLoading: isLoadingCalendars,
    refreshCalendars,
  } = useCalendar();
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].color);
  const [selectedColorName, setSelectedColorName] = useState(
    colorOptions[0].name
  );
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);

  // Fetch user data
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch today's tasks
  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["today-tasks"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const today = new Date();
      const { data: todayTasks } = await supabase
        .from("calendar_entries")
        .select(
          `
          *,
          calendar:calendars(color)
        `
        )
        .gte("start_time", startOfDay(today).toISOString())
        .lte("start_time", endOfDay(today).toISOString())
        .order("start_time", { ascending: true });

      return todayTasks || [];
    },
  });

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleCalendarPress = (calendar: any) => {
    router.push({
      pathname: "/(protected)/(tabs)/dashboard",
      params: {
        selectedCalendarId: calendar.id,
        calendarName: calendar.name,
      },
    });
  };

  const handleSubmitCalendar = async (
    newCalendarName: string,
    selectedColor: string
  ) => {
    setIsCreateModalVisible(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("calendars")
        .insert([
          {
            name: newCalendarName.trim(),
            color: selectedColor,
            user_id: user.id,
            is_primary: false,
            createdAt: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;

      // Refresh calendars using the provider
      await refreshCalendars();
    } catch (err) {
      console.error("Error creating calendar:", err);
    }
  };

  return (
    // <LinearGradient colors={["#a7f3d0", "#93c5fd"]} style={{ flex: 1 }}>
    <SafeAreaView style={{ flex: 1 }}>
      <View className="px-4 py-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-3xl font-bold">Jump back in,</Text>
          <TouchableOpacity
            onPress={handleLogout}
            className="p-2 bg-red-500 rounded-full"
          >
            <MaterialIcons name="logout" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="flex-1">
        {/* My Calendars */}
        <View className="px-4 py-2">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="calendar-today" size={24} color="black" />
              <Text className="text-2xl font-bold text-gray-800">
                My Calendars
              </Text>
            </View>
            <TouchableOpacity
              className="p-2 border border-gray-300 rounded-full"
              onPress={() => setIsCreateModalVisible(true)}
            >
              <MaterialIcons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>

          {/* Calendar cards */}
          <View className="my-4">
            {isLoadingCalendars ? (
              <View className="flex-row justify-center items-center py-8">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="ml-2 text-gray-600">Loading calendars...</Text>
              </View>
            ) : calendars.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View className="flex-row gap-4">
                  {calendars.map((calendar) => (
                    <CalendarCard
                      key={calendar.id}
                      calendar={{
                        ...calendar,
                        user_id: calendar.user_id || "",
                        createdAt: calendar.created_at
                          ? new Date(calendar.created_at)
                          : new Date(),
                      }}
                      onPress={handleCalendarPress}
                    />
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="flex-row justify-center items-center py-8">
                <MaterialIcons
                  name="calendar-today"
                  size={48}
                  color="#D1D5DB"
                />
                <View className="ml-4">
                  <Text className="text-gray-600 text-lg font-semibold">
                    No calendars yet
                  </Text>
                  <Text className="text-gray-500">
                    Create your first calendar to get started
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Today's tasks */}
        <View className="px-4 py-2">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="check" size={24} color="black" />
              <Text className="text-2xl font-bold text-gray-800">
                Today's Tasks
              </Text>
            </View>
            <TouchableOpacity className="p-2 border border-gray-300 rounded-full">
              <MaterialIcons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="bg-white rounded-xl my-4">
            {isLoadingTasks ? (
              <View className="flex-row justify-center items-center py-8">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="ml-2 text-gray-600">Loading tasks...</Text>
              </View>
            ) : tasks.length > 0 ? (
              <View className="space-y-3">
                {tasks.map((task) => (
                  <View
                    key={task.id}
                    className="bg-white p-4 rounded-lg shadow-sm"
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: task.calendar.color,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold flex-1">
                        {task.title}
                      </Text>
                      <TouchableOpacity
                        className={`p-2 rounded-full ${
                          task.completed ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <MaterialIcons
                          name={
                            task.completed
                              ? "check-circle"
                              : "radio-button-unchecked"
                          }
                          size={24}
                          color={task.completed ? "#10B981" : "#6B7280"}
                        />
                      </TouchableOpacity>
                    </View>
                    {task.description && (
                      <Text className="text-gray-600 mt-1">
                        {task.description}
                      </Text>
                    )}
                    <Text className="text-sm text-gray-500 mt-2">
                      {new Date(task.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="flex-row justify-center items-center py-8">
                <MaterialIcons name="task" size={24} color="black" />
                <View className="ml-4">
                  <Text className="text-gray-600 text-lg font-semibold">
                    No tasks for today
                  </Text>
                  <Text className="text-gray-500">
                    Add a task to get started
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Scheduler */}
        <View className="px-4 py-2">
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center gap-2">
              <MaterialIcons name="schedule" size={24} color="black" />
              <Text className="text-2xl font-bold text-gray-800">
                Scheduler
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push("../scheduler_form")}
              className="p-2 border border-gray-300 rounded-full"
            >
              <MaterialIcons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity className="rounded-xl bg-white my-4">
            {isLoadingTasks ? (
              <View className="flex-row justify-center items-center py-8">
                <ActivityIndicator size="small" color="#3B82F6" />
                <Text className="ml-2 text-gray-600">Loading tasks...</Text>
              </View>
            ) : tasks.length > 0 ? (
              <View className="space-y-3">
                {tasks.map((task) => (
                  <View
                    key={task.id}
                    className="bg-white p-4 rounded-lg shadow-sm"
                    style={{
                      borderLeftWidth: 4,
                      borderLeftColor: task.calendar.color,
                    }}
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-lg font-semibold flex-1">
                        {task.title}
                      </Text>
                      <TouchableOpacity
                        className={`p-2 rounded-full ${
                          task.completed ? "bg-green-100" : "bg-gray-100"
                        }`}
                      >
                        <MaterialIcons
                          name={
                            task.completed
                              ? "check-circle"
                              : "radio-button-unchecked"
                          }
                          size={24}
                          color={task.completed ? "#10B981" : "#6B7280"}
                        />
                      </TouchableOpacity>
                    </View>
                    {task.description && (
                      <Text className="text-gray-600 mt-1">
                        {task.description}
                      </Text>
                    )}
                    <Text className="text-sm text-gray-500 mt-2">
                      {new Date(task.start_time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View className="flex-row justify-center items-center py-8">
                <MaterialIcons name="schedule-send" size={24} color="black" />
                <View className="ml-4">
                  <Text className="text-gray-600 text-lg font-semibold">
                    No scheduled events
                  </Text>
                  <Text className="text-gray-500">Schedule a new event</Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {isCreateModalVisible && (
        <CreateCalendarModal
          isVisible={isCreateModalVisible}
          onClose={() => setIsCreateModalVisible(false)}
          onSave={handleSubmitCalendar}
          colorOptions={colorOptions}
          selectedColor={selectedColor}
          selectedColorName={selectedColorName}
          isColorDropdownOpen={isColorDropdownOpen}
          onColorSelect={(colorName, colorValue) => {
            setSelectedColor(colorValue);
            setSelectedColorName(colorName);
          }}
          onColorDropdownToggle={() =>
            setIsColorDropdownOpen(!isColorDropdownOpen)
          }
        />
      )}
    </SafeAreaView>
    // </LinearGradient>
  );
}
