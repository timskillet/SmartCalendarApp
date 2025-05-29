import { MaterialIcons } from "@expo/vector-icons";
import { router, Tabs } from "expo-router";
import React from "react";
import { Pressable, Text } from "react-native";
import { supabase } from "../../../lib/supabase";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: "Calendar",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="calendar-month" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: "Inbox",
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="inbox" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

export function LogoutButton() {
  return (
    <Pressable
      className="absolute top-12 right-4 bg-red-500 p-2 rounded-md"
      onPress={async () => {
        await supabase.auth.signOut();
        router.replace("/(auth)/login");
      }}
    >
      <Text className="text-white font-bold">Logout</Text>
    </Pressable>
  );
}
