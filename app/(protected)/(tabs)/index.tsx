import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../context/AuthProvider";

export default function HomeScreen() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    router.replace("/(auth)/login");
  };

  const calendars = [
    { name: "Study", description: "Description 1", status: "In Progress" },
    { name: "Fitness", description: "Description 2", status: "Completed" },
    { name: "Project 3", description: "Description 3", status: "In Progress" },
  ];

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
              <TouchableOpacity className="p-2 border border-gray-300 rounded-full">
                <MaterialIcons name="add" size={24} color="black" />
              </TouchableOpacity>
            </View>

            {/* Calendar cards */}
            <ScrollView horizontal className="my-4">
              <View className="flex-row gap-4">
                {calendars.map((calendar, index) => (
                  <TouchableOpacity
                    key={index}
                    className="p-4 bg-white rounded-lg"
                  >
                    <Text key={`name${index}`} className="text-lg font-bold">
                      {calendar.name}
                    </Text>
                    <Text
                      key={`description${index}`}
                      className="text-sm text-gray-500"
                    >
                      {calendar.description}
                    </Text>
                    <Text
                      key={`status${index}`}
                      className="text-sm text-gray-500"
                    >
                      {calendar.status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
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
      </SafeAreaView>
    </LinearGradient>
  );
}
