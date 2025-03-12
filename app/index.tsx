import { View, Text, Image, Pressable } from "react-native";
import { useRouter } from "expo-router";
import "../global.css";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="items-center mb-10">
        <Text className="text-3xl font-bold text-blue-600 mb-2">
          Smart Calendar
        </Text>
        <Text className="text-lg text-gray-600 text-center px-10">
          Organize your life and stay productive with Smart Calendar
        </Text>
      </View>

      <View className="w-full items-center">
        <Pressable
          className="bg-blue-600 p-3 rounded-md w-64 mb-3"
          onPress={() => router.push("/login")}
        >
          <Text className="text-white font-bold text-center">Login</Text>
        </Pressable>

        <Pressable
          className="bg-gray-200 p-3 rounded-md w-64"
          onPress={() => router.push("/login")}
        >
          <Text className="text-gray-800 font-bold text-center">
            Create Account
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
