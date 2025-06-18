import { AvailabilityForm } from "@/components/scheduler/AvailabilityForm";
import { AvailabilityGrid } from "@/components/scheduler/AvailabilityGrid";
import { AvailabilitySuggestions } from "@/components/scheduler/AvailabilitySuggestions";
import { Suggestion } from "@/components/scheduler/utils/schedulerUtils";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { SafeAreaView, Text, TouchableOpacity, View } from "react-native";

type TimeRange = {
  start: Date;
  end: Date;
};

type AvailabilityData = {
  [date: string]: string[]; // date -> array of time slots
};

export default function SchedulerScreen() {
  const [step, setStep] = useState<"form" | "grid" | "suggestions">("form");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [proposalId, setProposalId] = useState<string>("");

  const handleFormContinue = (
    proposalId: string,
    selectedDates: Date[],
    timeRange: TimeRange
  ) => {
    setProposalId(proposalId);
    setSelectedDates(selectedDates);
    setTimeRange(timeRange);
    setStep("grid");
  };

  const handleGridBack = () => {
    setStep("form");
  };

  const handleSelectSuggestion = (suggestion: Suggestion) => {
    console.log("Selected suggestion:", suggestion);
  };

  const handleSaveAvailability = async (availabilityData: AvailabilityData) => {
    setStep("suggestions");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center p-4 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 rounded-full"
        >
          <MaterialIcons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold ml-2">Schedule Event</Text>
      </View>

      {step === "form" && <AvailabilityForm onContinue={handleFormContinue} />}

      {step === "grid" && selectedDates && timeRange && (
        <AvailabilityGrid
          proposalId={proposalId}
          selectedDates={selectedDates}
          timeRange={timeRange}
          onSave={handleSaveAvailability}
          onBack={handleGridBack}
        />
      )}

      {step === "suggestions" && (
        <AvailabilitySuggestions
          proposalId={proposalId}
          onSelectSuggestion={handleSelectSuggestion}
          onBack={() => setStep("form")}
        />
      )}
    </SafeAreaView>
  );
}
