import { Text, View } from "react-native";
import { LogoutButton } from "./_layout";

export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text>Home</Text>
      <LogoutButton />
    </View>
  );
}
