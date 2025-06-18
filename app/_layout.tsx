import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { AuthProvider } from "../context/AuthProvider";
import { CalendarEntryProvider } from "../context/CalendarEntryProvider";
import { CalendarProvider } from "../context/CalendarProvider";
import "../global.css";

// Create a client
const queryClient = new QueryClient();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CalendarEntryProvider>
          <CalendarProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)/login" />
              <Stack.Screen name="(auth)/signup" />
              <Stack.Screen name="(protected)" />
            </Stack>
          </CalendarProvider>
        </CalendarEntryProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
