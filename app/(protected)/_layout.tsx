import { Redirect, Slot } from "expo-router";
import { Text } from "react-native";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  if (!isLoading && !session) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Slot />;
}
