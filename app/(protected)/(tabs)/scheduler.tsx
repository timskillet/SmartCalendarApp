import { AvailabilityForm } from "@/components/scheduler/AvailabilityForm";
import { AvailabilityGrid } from "@/components/scheduler/AvailabilityGrid";
import React, { useState } from "react";
import { SafeAreaView, Text, View } from "react-native";

type TimeRange = {
  start: Date;
  end: Date;
};

type AvailabilityData = {
  [date: string]: string[]; // date -> array of time slots
};

export default function SchedulerScreen() {
  const [step, setStep] = useState<"form" | "grid">("form");
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRange | null>(null);
  const [availability, setAvailability] = useState<AvailabilityData | null>(
    null
  );
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

  const handleSaveAvailability = (availabilityData: AvailabilityData) => {
    setAvailability(availabilityData);
    // Here you would typically send this data to your backend
    console.log("Saved availability:", availabilityData);

    // For demo purposes, show the form again
    setStep("form");
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      {step === "form" ? (
        <AvailabilityForm onContinue={handleFormContinue} />
      ) : selectedDates && timeRange ? (
        <AvailabilityGrid
          proposalId={proposalId}
          selectedDates={selectedDates}
          timeRange={timeRange}
          onSave={handleSaveAvailability}
          onBack={handleGridBack}
        />
      ) : (
        <View className="flex-1 justify-center items-center">
          <Text>Loading...</Text>
        </View>
      )}
    </SafeAreaView>
  );
}
