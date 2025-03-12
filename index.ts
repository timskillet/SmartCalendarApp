import 'expo-router/entry';
import { AppState } from "react-native";
import { supabase } from "./lib/supabase";

// This file uses expo-router's entry point

// Set up auth refresh outside of React component lifecycle
AppState.addEventListener("change", (state) => {
  if (state === "active") {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
