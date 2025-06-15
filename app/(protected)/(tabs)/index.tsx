import { MaterialIcons } from "@expo/vector-icons";
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

interface Calendar {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
  created_at: string;
}

export default function HomeScreen() {
  const { signOut } = useAuth();
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [isLoadingCalendars, setIsLoadingCalendars] = useState(true);

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const handleCalendarPress = (calendar: Calendar) => {
    // Navigate to calendar tab with the specific calendar ID
    router.push({
      pathname: "/(protected)/(tabs)/calendar",
      params: {
        selectedCalendarId: calendar.id,
        calendarName: calendar.name,
      },
    });
  };

  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

  const handleSubmitCalendar = async (
    newCalendarName: string,
    selectedColor: string
  ) => {
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

        const { data: userCalendars, error } = await supabase
          .from("calendars")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching calendars:", error);
        } else {
          setCalendars(userCalendars || []);
        }
      } catch (err) {
        console.error("Error in fetchCalendars:", err);
      } finally {
        setIsLoadingCalendars(false);
      }
    };

    fetchCalendars();
  }, []);

  const tasks = [
    { name: "Task 1", description: "Description 1", status: "In Progress" },
    { name: "Task 2", description: "Description 2", status: "Completed" },
  ];

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
                    {calendars.map((calendar) => (
                      <TouchableOpacity
                        key={calendar.id}
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
                          Created{" "}
                          {new Date(calendar.created_at).toLocaleDateString()}
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

          {/* Today's tasks*/}
          <View className="flex-row justify-between items-center px-4 py-2">
            <Text className="text-2xl font-bold text-gray-800">
              Today's Tasks
            </Text>
            <TouchableOpacity className="p-2 border border-gray-300 rounded-full">
              <MaterialIcons name="add" size={24} color="black" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {isCreateModalVisible && (
          <CreateCalendarModal
            isVisible={isCreateModalVisible}
            onClose={() => setIsCreateModalVisible(false)}
            onSave={handleSubmitCalendar}
          />
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}
