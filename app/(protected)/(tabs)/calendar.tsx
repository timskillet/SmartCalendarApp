import { MonthlyView } from "@/components/calendar/MonthlyView";
import { WeeklyView } from "@/components/calendar/weekly/WeeklyView";
import { YearlyView } from "@/components/calendar/YearlyView";
import { useState } from "react";
import { SafeAreaView } from "react-native";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<"weekly" | "monthly" | "yearly">("weekly");

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

  return (
    <SafeAreaView className="flex-1">
      {view === "weekly" && (
        <WeeklyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onBackToMonthly={() => handleViewChange("monthly")}
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
