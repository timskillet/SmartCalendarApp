import { supabase } from "@/lib/supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Calendar {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
  is_shared?: boolean;
  permission?: "view" | "edit" | "copy";
}

interface CalendarContextType {
  selectedCalendarId: string | null;
  selectedCalendar: Calendar | null;
  calendars: Calendar[];
  setSelectedCalendar: (calendarId: string) => void;
  setCalendars: (calendars: Calendar[]) => void;
  clearSelection: () => void;
  refreshCalendars: () => Promise<void>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(
    null
  );
  const [calendars, setCalendars] = useState<Calendar[]>([]);

  const selectedCalendar =
    calendars.find((cal) => cal.id === selectedCalendarId) || null;

  const fetchCalendars = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch owned calendars
      const { data: ownedCalendars, error: ownedError } = await supabase
        .from("calendars")
        .select("*")
        .eq("user_id", user.id);

      if (ownedError) throw ownedError;

      // Fetch shared calendars
      const { data: sharedCalendars, error: sharedError } = await supabase
        .from("calendar_shares")
        .select(
          `
          permission,
          calendars (
            id,
            name,
            color,
            is_primary
          )
        `
        )
        .eq("shared_with", user.id);

      if (sharedError) throw sharedError;

      // Transform shared calendars data
      const transformedSharedCalendars = sharedCalendars.map((share) => ({
        ...share.calendars,
        is_shared: true,
        permission: share.permission,
      }));

      // Combine owned and shared calendars
      const allCalendars = [
        ...(ownedCalendars || []),
        ...transformedSharedCalendars,
      ];

      setCalendars(allCalendars);

      // If no calendar is selected, select the primary calendar
      if (!selectedCalendarId) {
        const primaryCalendar = allCalendars.find((cal) => cal.is_primary);
        if (primaryCalendar) {
          setSelectedCalendarId(primaryCalendar.id);
          await AsyncStorage.setItem("selectedCalendarId", primaryCalendar.id);
        }
      }
    } catch (error) {
      console.error("Error fetching calendars:", error);
    }
  };

  // Load persisted selection on app start
  useEffect(() => {
    const loadSelection = async () => {
      try {
        const savedCalendarId = await AsyncStorage.getItem(
          "selectedCalendarId"
        );
        if (savedCalendarId) {
          setSelectedCalendarId(savedCalendarId);
        }
      } catch (error) {
        console.error("Error loading calendar selection:", error);
      }
    };
    loadSelection();
    fetchCalendars();
  }, []);

  const setSelectedCalendar = async (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    try {
      await AsyncStorage.setItem("selectedCalendarId", calendarId);
    } catch (error) {
      console.error("Error saving calendar selection:", error);
    }
  };

  const clearSelection = async () => {
    setSelectedCalendarId(null);
    try {
      await AsyncStorage.removeItem("selectedCalendarId");
    } catch (error) {
      console.error("Error clearing calendar selection:", error);
    }
  };

  return (
    <CalendarContext.Provider
      value={{
        selectedCalendarId,
        selectedCalendar,
        calendars,
        setSelectedCalendar,
        setCalendars,
        clearSelection,
        refreshCalendars: fetchCalendars,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
};

// Usage in components:
/*
const { selectedCalendar, setSelectedCalendar } = useCalendar();

// In home page
const handleCalendarPress = (calendar: Calendar) => {
  setSelectedCalendar(calendar.id);
  router.push('/calendar');
};

// In calendar page
const { selectedCalendar } = useCalendar(); // Automatically available
*/
