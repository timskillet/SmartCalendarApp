import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Calendar {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
}

interface CalendarContextType {
  selectedCalendarId: string | null;
  selectedCalendar: Calendar | null;
  calendars: Calendar[];
  setSelectedCalendar: (calendarId: string) => void;
  setCalendars: (calendars: Calendar[]) => void;
  clearSelection: () => void;
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
