import 'expo-router/entry';
import { AppState, Platform } from "react-native";
import { supabase } from "./lib/supabase";

// This file uses expo-router's entry point
if (Platform.OS === 'ios') {
    AppState.addEventListener('change', (state) => {
        if (state === 'active') {
            supabase.auth.startAutoRefresh();
        } else {
            supabase.auth.stopAutoRefresh();
        }
    });
} else {
    supabase.auth.startAutoRefresh();
}

