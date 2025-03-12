import { Redirect, Slot } from "expo-router";
import { useAuth } from "../../context/AuthProvider";

export default function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) return null; // Show a loading screen if necessary

  if (!session) return <Redirect href="/login" />;

  return <Slot />;
}
