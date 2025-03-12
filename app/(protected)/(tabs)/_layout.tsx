import { Tabs } from "expo-router";
import { View, Text, Pressable } from "react-native";
import { supabase } from "../../../lib/supabase";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}

export function LogoutButton() {
  return (
    <Pressable
      className="absolute top-12 right-4 bg-red-500 p-2 rounded-md"
      onPress={async () => {
        await supabase.auth.signOut();
      }}
    >
      <Text className="text-white font-bold">Logout</Text>
    </Pressable>
  );
}
