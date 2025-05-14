import { Text, View } from "react-native";
import { LogoutButton } from "./_layout";

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Profile</Text>
      <LogoutButton />
    </View>
  );
}
