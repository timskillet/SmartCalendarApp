import React, { useState } from "react";
import { View } from "react-native";
import { YearlyView } from "./YearlyView";
import { MonthlyView } from "./MonthlyView";
import { WeeklyView } from "./WeeklyView";
export type CalendarViewType = "yearly" | "monthly" | "weekly";

export interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO string
  startTime?: string;
  endTime?: string;
}

interface CalendarProps {
  onDateSelect: (date: string) => void;
}

export const Calendar: React.FC<CalendarProps> = ({ onDateSelect }) => {
  const [viewType, setViewType] = useState<CalendarViewType>("yearly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    if (viewType === "yearly") {
      setViewType("monthly");
    } else if (viewType === "monthly") {
      setViewType("weekly");
    }
    onDateSelect(date.toISOString());
  };

  const handleBackToYearly = () => {
    setViewType("yearly");
  };

  const handleBackToMonthly = () => {
    setViewType("monthly");
  };

  return (
    <View className="flex-1">
      {viewType === "yearly" && (
        <YearlyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
        />
      )}
      {viewType === "monthly" && (
        <MonthlyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onBackToYearly={handleBackToYearly}
        />
      )}
      {viewType === "weekly" && (
        <WeeklyView
          selectedDate={selectedDate}
          onSelectDate={handleDateSelect}
          onBackToMonthly={handleBackToMonthly}
        />
      )}
    </View>
  );
};
