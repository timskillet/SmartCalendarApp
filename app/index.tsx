import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import "../global.css";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-3xl font-bold mb-6">Welcome</Text>

      <Link href="/(auth)/login" asChild>
        <Pressable className="w-64 p-3 mb-3 bg-blue-500 rounded-md">
          <Text className="text-white text-center font-semibold">Login</Text>
        </Pressable>
      </Link>

      <Link href="/(auth)/signup" asChild>
        <Pressable className="w-64 p-3 mb-3 bg-green-500 rounded-md">
          <Text className="text-white text-center font-semibold">Sign Up</Text>
        </Pressable>
      </Link>
    </View>
  );
}
