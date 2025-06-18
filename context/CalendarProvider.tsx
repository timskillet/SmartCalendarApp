import { fetchUserCalendars } from "@/services/CalendarService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useQuery } from "@tanstack/react-query";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Calendar {
  id: string;
  name: string;
  color: string;
  is_primary: boolean;
  is_shared?: boolean;
  permission?: "view" | "edit" | "copy";
  user_id?: string;
  created_at?: string;
}

interface CalendarData {
  editableCalendars: Calendar[];
  viewableCalendars: Calendar[];
  copyableCalendars: Calendar[];
}

interface CalendarContextType {
  editableCalendars: Calendar[];
  viewableCalendars: Calendar[];
  copyableCalendars: Calendar[];
  selectedCalendarId: string | null;
  selectedCalendar: Calendar | null;
  calendars: Calendar[];
  setSelectedCalendar: (calendarId: string) => void;
  setCalendars: (calendars: Calendar[]) => void;
  clearSelection: () => void;
  refreshCalendars: () => Promise<void>;
  isLoading: boolean;
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
  const [editableCalendars, setEditableCalendars] = useState<Calendar[]>([]);
  const [viewableCalendars, setViewableCalendars] = useState<Calendar[]>([]);
  const [copyableCalendars, setCopyableCalendars] = useState<Calendar[]>([]);
  const [calendars, setCalendars] = useState<Calendar[]>([]);

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

  const { data, isLoading, refetch } = useQuery<CalendarData>({
    queryKey: ["user-calendars"],
    queryFn: async () => {
      const result = await fetchUserCalendars();

      // Ensure all calendar objects have the required properties
      const processCalendar = (cal: any): Calendar => {
        if (!cal || !cal.id) {
          console.warn("CalendarProvider: Invalid calendar object:", cal);
          return null as any;
        }
        return {
          id: cal.id,
          name: cal.name || "Unnamed Calendar",
          color: cal.color || "#3B82F6",
          is_primary: cal.is_primary || false,
          permission: cal.permission,
          user_id: cal.user_id,
          created_at: cal.created_at,
        };
      };

      const processedData = {
        editableCalendars: result.editableCalendars
          .map(processCalendar)
          .filter(Boolean),
        viewableCalendars: result.viewableCalendars
          .map(processCalendar)
          .filter(Boolean),
        copyableCalendars: result.copyableCalendars
          .map(processCalendar)
          .filter(Boolean),
      };

      return processedData;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  useEffect(() => {
    if (data) {
      setEditableCalendars(data.editableCalendars);
      setViewableCalendars(data.viewableCalendars);
      setCopyableCalendars(data.copyableCalendars);

      const allCalendars = [
        ...data.editableCalendars,
        ...data.viewableCalendars,
        ...data.copyableCalendars,
      ];

      setCalendars(allCalendars);

      // If no calendar is selected and we have calendars, select the primary one
      if (!selectedCalendarId && allCalendars.length > 0) {
        const primaryCalendar = allCalendars.find((cal) => cal.is_primary);
        if (primaryCalendar) {
          setSelectedCalendar(primaryCalendar.id);
        } else {
          setSelectedCalendar(allCalendars[0].id);
        }
      }
    }
  }, [data, selectedCalendarId]);

  const selectedCalendar =
    calendars.find((cal) => cal.id === selectedCalendarId) || null;

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

  const refreshCalendars = async () => {
    await refetch();
  };

  return (
    <CalendarContext.Provider
      value={{
        editableCalendars,
        viewableCalendars,
        copyableCalendars,
        selectedCalendarId,
        selectedCalendar,
        calendars,
        setSelectedCalendar,
        setCalendars,
        clearSelection,
        refreshCalendars,
        isLoading,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
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
