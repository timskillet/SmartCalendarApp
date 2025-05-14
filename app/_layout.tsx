import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { AuthProvider } from "../context/AuthProvider";
import "../global.css";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="index"
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/signup" />
        <Stack.Screen name="(protected)" />
      </Stack>
    </AuthProvider>
  );
}
