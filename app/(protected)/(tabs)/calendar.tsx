import React from "react";
import { SafeAreaView, View } from "react-native";
import { Calendar } from "../../../components/calendar/Calendar";

export default function CalendarScreen() {
  const handleDateSelect = (date: string) => {
    console.log("Selected date:", date);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1">
        <Calendar onDateSelect={handleDateSelect} />
      </View>
    </SafeAreaView>
  );
}
