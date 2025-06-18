import { CalendarEntry } from "@/components/calendar/types";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  endOfDay,
  endOfMonth,
  endOfWeek,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { createContext, useCallback, useContext, useState } from "react";

export type TimeRange = "day" | "week" | "month" | "custom";

interface CalendarEntryProviderProps {
  children: React.ReactNode;
}

interface CalendarEntryContextType {
  // State
  selectedTimeRange: TimeRange;
  customDateRange: { start: Date; end: Date } | null;
  visibleCalendarIds: string[];

  // Actions
  setSelectedTimeRange: (range: TimeRange) => void;
  setCustomDateRange: (range: { start: Date; end: Date } | null) => void;
  setVisibleCalendarIds: (ids: string[]) => void;

  // Data
  entries: CalendarEntry[];
  isLoading: boolean;
  error: Error | null;

  // Methods
  refreshEntries: () => Promise<void>;
  getEntriesForCalendar: (calendarId: string) => CalendarEntry[];
  getEntriesForDate: (date: Date) => CalendarEntry[];
}

const CalendarEntryContext = createContext<
  CalendarEntryContextType | undefined
>(undefined);

export const CalendarEntryProvider: React.FC<CalendarEntryProviderProps> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>("day");
  const [customDateRange, setCustomDateRange] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const [visibleCalendarIds, setVisibleCalendarIds] = useState<string[]>([]);

  // Helper function to get date range based on selected time range
  const getDateRange = useCallback(() => {
    const now = new Date();
    switch (selectedTimeRange) {
      case "day":
        return {
          start: startOfDay(now),
          end: endOfDay(now),
        };
      case "week":
        return {
          start: startOfWeek(now),
          end: endOfWeek(now),
        };
      case "month":
        return {
          start: startOfMonth(now),
          end: endOfMonth(now),
        };
      case "custom":
        return (
          customDateRange || {
            start: startOfDay(now),
            end: endOfDay(now),
          }
        );
    }
  }, [selectedTimeRange, customDateRange]);

  // Main query for fetching entries
  const {
    data: entries = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "calendar-entries",
      visibleCalendarIds,
      selectedTimeRange,
      customDateRange,
    ],
    queryFn: async () => {
      if (visibleCalendarIds.length === 0) return [];

      const { start, end } = getDateRange();

      const { data, error } = await supabase
        .from("calendar_entries")
        .select(
          `
          id,
          calendar_id,
          title,
          type,
          start_time,
          end_time,
          completed,
          color,
          description,
          location,
          invitees,
          repeat,
          created_at,
          updated_at,
          auto_scheduled,
          metadata,
          calendar:calendars (
            id,
            color
          )
        `
        )
        .in("calendar_id", visibleCalendarIds)
        .gte("start_time", start.toISOString())
        .lte("start_time", end.toISOString())
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error fetching calendar entries:", error);
        throw error;
      }

      if (!data) {
        console.warn("No calendar entries found");
        return [];
      }

      return data.map((entry) => {
        const calendarColor = entry.calendar?.[0]?.color;
        return {
          id: entry.id,
          calendarId: entry.calendar_id,
          title: entry.title,
          type: entry.type,
          startTime: new Date(entry.start_time),
          endTime: new Date(entry.end_time),
          completed: entry.completed ?? false,
          color: calendarColor || entry.color || "#3B82F6",
          description: entry.description || "",
          location: entry.location || "",
          invitees: entry.invitees || [],
          repeat: entry.repeat ?? false,
          position: 0, // This will be calculated when rendering
          createdAt: new Date(entry.created_at),
          updatedAt: entry.updated_at ? new Date(entry.updated_at) : undefined,
        };
      });
    },
    enabled: visibleCalendarIds.length > 0,
  });

  // Helper function to get icon based on entry type
  const getIconForType = (type: string) => {
    switch (type) {
      case "event":
        return "event";
      case "task":
        return "check-circle";
      case "habit":
        return "repeat";
      case "goal":
        return "emoji-events";
      default:
        return "event";
    }
  };

  // Method to refresh entries
  const refreshEntries = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["calendar-entries"],
    });
  }, [queryClient]);

  // Method to get entries for a specific calendar
  const getEntriesForCalendar = useCallback(
    (calendarId: string) => {
      return entries.filter((entry) => entry.calendarId === calendarId);
    },
    [entries]
  );

  // Method to get entries for a specific date
  const getEntriesForDate = useCallback(
    (date: Date) => {
      const start = startOfDay(date);
      const end = endOfDay(date);
      return entries.filter((entry) => {
        const entryDate = entry.startTime;
        return entryDate >= start && entryDate <= end;
      });
    },
    [entries]
  );

  const value = {
    selectedTimeRange,
    customDateRange,
    visibleCalendarIds,
    setSelectedTimeRange,
    setCustomDateRange,
    setVisibleCalendarIds,
    entries,
    isLoading,
    error,
    refreshEntries,
    getEntriesForCalendar,
    getEntriesForDate,
  };

  return (
    <CalendarEntryContext.Provider value={value}>
      {children}
    </CalendarEntryContext.Provider>
  );
};

// Custom hook to use the calendar entry context
export const useCalendarEntries = () => {
  const context = useContext(CalendarEntryContext);
  if (context === undefined) {
    throw new Error(
      "useCalendarEntries must be used within a CalendarEntryProvider"
    );
  }
  return context;
};
