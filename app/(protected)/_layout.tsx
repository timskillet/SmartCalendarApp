import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Redirect, Slot } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../context/AuthProvider";
import { CalendarProvider } from "../../context/CalendarProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
    },
  },
});

export default function ProtectedLayout() {
  const { session, isLoading: isAuthLoading } = useAuth();

  // Only redirect to login if we're sure there's no session
  if (!isAuthLoading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <CalendarProvider>
        {isAuthLoading ? (
          <LinearGradient colors={["#a7f3d0", "#93c5fd"]} className="flex-1">
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#3B82F6" />
            </View>
          </LinearGradient>
        ) : (
          <Slot />
        )}
      </CalendarProvider>
    </QueryClientProvider>
  );
}
