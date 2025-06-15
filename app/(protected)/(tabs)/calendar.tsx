import { MonthlyView } from "@/components/calendar/MonthlyView";
import { WeeklyView } from "@/components/calendar/weekly/WeeklyView";
import { YearlyView } from "@/components/calendar/YearlyView";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView } from "react-native";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"weekly" | "monthly" | "yearly">("weekly");

  // Get route parameters
  const params = useLocalSearchParams();
  const selectedCalendarId = params.selectedCalendarId as string | undefined;
  const calendarName = params.calendarName as string | undefined;

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (view === "yearly") {
      setView("monthly");
    } else if (view === "monthly") {
      setView("weekly");
    }
  };

  const handleViewChange = (view: "weekly" | "monthly" | "yearly") => {
    setView(view);
  };

  // Log the received parameters for debugging
  useEffect(() => {
    if (selectedCalendarId) {
      console.log("Calendar screen received:", {
        selectedCalendarId,
        calendarName,
      });
    }
  }, [selectedCalendarId, calendarName]);

  return (
    <SafeAreaView className="flex-1">
      {view === "weekly" && (
        <WeeklyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onBackToMonthly={() => handleViewChange("monthly")}
          selectedCalendarId={selectedCalendarId}
          calendarName={calendarName}
        />
      )}
      {view === "monthly" && (
        <MonthlyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onBackToYearly={() => handleViewChange("yearly")}
        />
      )}
      {view === "yearly" && (
        <YearlyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />
      )}
    </SafeAreaView>
  );
}
