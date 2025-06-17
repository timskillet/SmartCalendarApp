import { MaterialIcons } from "@expo/vector-icons";
import { User } from "@supabase/supabase-js";
import { endOfDay, startOfDay } from "date-fns";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { CreateCalendarModal } from "../../../components/calendar/CreateCalendarModal";
import { useAuth } from "../../../context/AuthProvider";
import { supabase } from "../../../lib/supabase";

// Color options with their hex values
const colorOptions = [
  { name: "Red", color: "#FF0000" },
  { name: "Blue", color: "#0000FF" },
  { name: "Green", color: "#00FF00" },
  { name: "Yellow", color: "#FFFF00" },
  { name: "Purple", color: "#800080" },
];

interface Calendar {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
  created_at: string;
  user_id: string;
  is_shared?: boolean;
  shared_by?: {
    email: string;
  };
  user?: {
    email: string;
  };
}

interface CalendarShare {
  calendar_id: string;
  calendar: {
    id: string;
    name: string;
    color: string;
    is_primary: boolean;
    created_at: string;
    user_id: string;
    user: {
      email: string;
    };
  } | null;
}

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
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].color);
  const [selectedColorName, setSelectedColorName] = useState(
    colorOptions[0].name
  );
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleCalendarPress = (calendar: Calendar) => {
    // Navigate to calendar tab with the specific calendar ID
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
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCalendars((prev) => [...prev, data]);
    } catch (err) {
      console.error("Error creating calendar:", err);
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
    };
    fetchUser();
  }, []);

  // Fetch user's calendars
  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No authenticated user found");
          setIsLoadingCalendars(false);
          return;
        }

        setIsLoadingCalendars(true);

        // First, get all calendar shares for this user
        const { data: shares, error: sharesError } = (await supabase
          .from("calendar_shares")
          .select(
            `
            calendar_id,
            calendar:calendars (
              id,
              name,
              color,
              is_primary,
              created_at,
              user_id,
              user:user_id (
                email
              )
            )
          `
          )
          .eq("shared_with", user.id)) as {
          data: CalendarShare[] | null;
          error: any;
        };

        console.log("Calendar shares with details:", shares);

        if (sharesError) {
          console.error("Error fetching shares:", sharesError);
          return;
        }

        // Get owned calendars
        const { data: ownedCalendars, error: ownedError } = await supabase
          .from("calendars")
          .select(
            `
            *,
            user:user_id (
              email
            )
          `
          )
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        console.log("Owned calendars:", ownedCalendars);

        if (ownedError) {
          console.error("Error fetching owned calendars:", ownedError);
          return;
        }

        // Format owned calendars
        const formattedOwnedCalendars = (ownedCalendars || []).map(
          (calendar) => ({
            ...calendar,
            is_shared: false,
          })
        );

        // Format shared calendars
        const formattedSharedCalendars = (shares || [])
          .filter((share) => share.calendar) // Filter out any null calendars
          .map((share) => ({
            ...share.calendar!,
            is_shared: true,
            shared_by: {
              email: share.calendar!.user?.email || "Unknown User",
            },
          }));

        console.log("Formatted owned calendars:", formattedOwnedCalendars);
        console.log("Formatted shared calendars:", formattedSharedCalendars);

        // Combine both types of calendars
        const allCalendars = [
          ...formattedOwnedCalendars,
          ...formattedSharedCalendars,
        ];
        console.log("Final combined calendars:", allCalendars);

        setCalendars(allCalendars);
      } catch (err) {
        console.error("Error in fetchCalendars:", err);
      } finally {
        setIsLoadingCalendars(false);
      }
    };

    fetchCalendars();
  }, []);

  // Fetch today's tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          console.error("No authenticated user found");
          setIsLoadingTasks(false);
          return;
        }

        const today = new Date();
        const { data: todayTasks, error } = await supabase
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

        if (error) {
          console.error("Error fetching tasks:", error);
        } else {
          setTasks(todayTasks || []);
        }
      } catch (err) {
        console.error("Error in fetchTasks:", err);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchTasks();
  }, []);

  return (
    <LinearGradient colors={["#a7f3d0", "#93c5fd"]} className="flex-1">
      <SafeAreaView className="bg-gray-100">
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

        <ScrollView>
          {/* My Calendars */}
          <View className="px-4 py-2">
            <View className="flex-row justify-between items-center">
              <Text className="text-2xl font-bold text-gray-800">
                My Calendars
              </Text>
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
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text className="ml-2 text-gray-600">
                    Loading calendars...
                  </Text>
                </View>
              ) : calendars.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-4">
                    {calendars.map((calendar, idx) => (
                      <TouchableOpacity
                        key={idx}
                        className="p-4 bg-white rounded-lg min-w-[150px] shadow-sm"
                        style={{
                          borderLeftWidth: 4,
                          borderLeftColor: calendar.color,
                        }}
                        onPress={() => handleCalendarPress(calendar)}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-center mb-2">
                          <View
                            className="w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: calendar.color }}
                          />
                          <Text
                            className="text-lg font-bold flex-1"
                            numberOfLines={1}
                          >
                            {calendar.name}
                          </Text>
                          {calendar.is_primary && (
                            <MaterialIcons
                              name="star"
                              size={16}
                              color="#FFD700"
                            />
                          )}
                        </View>
                        <Text className="text-sm text-gray-500">
                          {calendar.is_shared
                            ? `Shared by ${calendar.shared_by?.email}`
                            : `Created ${new Date(
                                calendar.created_at
                              ).toLocaleDateString()}`}
                        </Text>
                        <View className="flex-row items-center mt-2">
                          <MaterialIcons
                            name="arrow-forward"
                            size={16}
                            color="#6B7280"
                          />
                          <Text className="text-xs text-gray-500 ml-1">
                            View calendar
                          </Text>
                        </View>
                      </TouchableOpacity>
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
              <Text className="text-2xl font-bold text-gray-800">
                Today's Tasks
              </Text>
              <TouchableOpacity className="p-2 border border-gray-300 rounded-full">
                <MaterialIcons name="add" size={24} color="black" />
              </TouchableOpacity>
            </View>

            <View className="my-4">
              {isLoadingTasks ? (
                <View className="flex-row justify-center items-center py-8">
                  <ActivityIndicator size="large" color="#3B82F6" />
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
                  <MaterialIcons name="task" size={48} color="#D1D5DB" />
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
            </View>
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
    </LinearGradient>
  );
}
