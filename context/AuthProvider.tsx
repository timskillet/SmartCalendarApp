import AsyncStorage from "@react-native-async-storage/async-storage";
import { Session } from "@supabase/supabase-js";
import { router } from "expo-router";
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Set up auth state change listener first
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;

            setSession(session);
            if (session) {
              router.replace("/(protected)/(tabs)");
            } else if (event === "SIGNED_OUT") {
              await AsyncStorage.clear();
              router.replace("/(auth)/login");
            }
          }
        );

        // Then fetch initial session
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        if (!mounted) return;

        setSession(initialSession);
        setIsLoading(false);

        return () => {
          mounted = false;
          authListener.subscription.unsubscribe();
        };
      } catch (error: any) {
        if (!mounted) return;

        console.error("Error initializing auth:", error);
        if (error.message?.includes("Invalid Refresh Token")) {
          await AsyncStorage.clear();
          await supabase.auth.signOut();
          router.replace("/(auth)/login");
        }
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await AsyncStorage.clear();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
