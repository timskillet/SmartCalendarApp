import { WeeklyView } from "@/components/calendar/WeeklyView";
import { useState } from "react";
import { SafeAreaView } from "react-native";

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  return (
    <SafeAreaView className="flex-1">
      <WeeklyView selectedDate={selectedDate} onSelectDate={handleDateSelect} />
    </SafeAreaView>
  );
}
