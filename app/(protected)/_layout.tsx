import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Redirect, Slot } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../context/AuthProvider";
import { CalendarProvider } from "../../context/CalendarProvider";

const queryClient = new QueryClient();

export default function ProtectedLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isLoading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CalendarProvider>
        <Slot />
      </CalendarProvider>
    </QueryClientProvider>
  );
}
