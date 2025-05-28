import { supabase } from "@/lib/supabase";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { format } from "date-fns";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

type DateRange = {
  startDate: Date;
  endDate: Date;
};

interface AvailabilityFormProps {
  onContinue: (
    proposalId: string,
    selectedDates: Date[],
    timeRange: { start: Date; end: Date }
  ) => void;
}

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  onContinue,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("New Event");
  const [description, setDescription] = useState("");
  const [durationHours, setDurationHours] = useState(0);
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [timezone, setTimezone] = useState("UTC");
  const [inviteeEmails, setInviteeEmails] = useState("");

  const [startTime, setStartTime] = useState<Date>(new Date());
  startTime.setHours(9, 0, 0, 0);
  const [endTime, setEndTime] = useState<Date>(new Date());
  endTime.setHours(17, 0, 0, 0);

  const [showStartTimePicker, setShowStartTimePicker] = useState(
    Platform.OS === "ios"
  );
  const [showEndTimePicker, setShowEndTimePicker] = useState(
    Platform.OS === "ios"
  );

  // For calendar selection
  const [selectedDates, setSelectedDates] = useState<{ [date: string]: any }>(
    {}
  );

  const handleTimeChange = (
    type: "startTime" | "endTime",
    event: any,
    date?: Date
  ) => {
    if (!date) return;
    setError(null);

    if (type === "startTime") {
      setStartTime(date);
      if (Platform.OS === "android") {
        setShowStartTimePicker(false);
      }

      // Validate time range
      if (date >= endTime) {
        setError("Start time must be before end time");
      }
    } else {
      setEndTime(date);
      if (Platform.OS === "android") {
        setShowEndTimePicker(false);
      }

      // Validate time range
      if (startTime >= date) {
        setError("End time must be after start time");
      }
    }
  };

  const onDayPress = (day: { dateString: string }) => {
    const newSelectedDates = { ...selectedDates };
    if (newSelectedDates[day.dateString]) {
      delete newSelectedDates[day.dateString]; // Deselect if already selected
    } else {
      newSelectedDates[day.dateString] = { selected: true }; // Select the date
    }
    setSelectedDates(newSelectedDates);
  };

  const getTotalDurationMinutes = () => {
    return durationHours * 60 + durationMinutes;
  };

  const handleSubmit = async () => {
    try {
      if (!title.trim()) {
        setError("Please enter a title");
        return;
      }

      if (Object.keys(selectedDates).length === 0) {
        setError("Please select at least one date");
        return;
      }

      if (!startTime || !endTime) {
        setError("Please select a time range");
        return;
      }

      if (startTime >= endTime) {
        setError("Start time must be before end time");
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("User error:", userError);
        throw userError;
      }

      if (!user) {
        console.error("No user found");
        throw new Error("No authenticated user found");
      }

      // Convert invitee emails to array and remove empty strings
      const inviteeList = inviteeEmails
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      const newEventProposal = {
        creator_id: user.id,
        title: title.trim(),
        description: description.trim(),
        proposed_dates: Object.keys(selectedDates),
        time_range_start: format(startTime, "HH:mm:ss"),
        time_range_end: format(endTime, "HH:mm:ss"),
        duration_minutes: getTotalDurationMinutes(),
        timezone: timezone,
        invitee_ids: [user.id],
        metadata: { category: "work" },
      };

      const { data, error } = await supabase
        .from("event_proposals")
        .insert([newEventProposal])
        .select();

      if (error) {
        console.log(error);
        console.error("Database error:", error);
        throw error;
      }

      console.log("Event proposal created:", data[0].id);

      // Call the onContinue prop with the selected date and time ranges
      onContinue(
        data[0].id,
        Object.keys(selectedDates).map((date) => new Date(date)),
        {
          start: new Date(startTime),
          end: new Date(endTime),
        }
      );
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {error && (
          <View className="bg-red-100 p-3 rounded-lg mb-4">
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        <Text className="text-2xl font-bold mb-8">Create Event Proposal</Text>

        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2">Event Details</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-lg mb-4"
            placeholder="Event Title"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            className="bg-gray-50 p-4 rounded-lg mb-4"
            placeholder="Description (optional)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2">Duration</Text>
          <TouchableOpacity
            onPress={() => setShowDurationPicker(true)}
            className="bg-gray-50 p-4 rounded-lg"
          >
            <Text className="text-gray-600">
              {durationHours > 0
                ? `${durationHours} hour${durationHours > 1 ? "s" : ""}`
                : ""}
              {durationHours > 0 && durationMinutes > 0 ? " and " : ""}
              {durationMinutes > 0 ? `${durationMinutes} minutes` : ""}
            </Text>
          </TouchableOpacity>

          {showDurationPicker && (
            <View className="mt-2 bg-white rounded-lg shadow-lg">
              <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
                <Text className="text-lg font-semibold">Select Duration</Text>
                <TouchableOpacity
                  onPress={() => setShowDurationPicker(false)}
                  className="px-4 py-2"
                >
                  <Text className="text-blue-500">Done</Text>
                </TouchableOpacity>
              </View>

              <View className="flex-row p-4">
                <View className="flex-1 mr-4">
                  <Text className="text-gray-600 mb-2">Hours</Text>
                  <Picker
                    selectedValue={durationHours}
                    onValueChange={(value) => setDurationHours(value)}
                    style={{ height: 150 }}
                  >
                    {[...Array(13)].map((_, i) => (
                      <Picker.Item key={i} label={`${i}`} value={i} />
                    ))}
                  </Picker>
                </View>

                <View className="flex-1">
                  <Text className="text-gray-600 mb-2">Minutes</Text>
                  <Picker
                    selectedValue={durationMinutes}
                    onValueChange={(value) => setDurationMinutes(value)}
                    style={{ height: 150 }}
                  >
                    <Picker.Item label="00" value={0} />
                    <Picker.Item label="15" value={15} />
                    <Picker.Item label="30" value={30} />
                    <Picker.Item label="45" value={45} />
                  </Picker>
                </View>
              </View>
            </View>
          )}
        </View>

        <View className="mb-6">
          <Text className="text-lg font-semibold mb-2">Invitees</Text>
          <TextInput
            className="bg-gray-50 p-4 rounded-lg"
            placeholder="Enter email addresses (comma-separated)"
            value={inviteeEmails}
            onChangeText={setInviteeEmails}
            multiline
          />
        </View>

        <View className="mb-8">
          <Text className="text-lg font-semibold mb-4">Time Range</Text>
          <View className="flex-row justify-between items-center bg-gray-50 p-4 rounded-lg">
            <View>
              <Text className="text-gray-600 mb-2">Start Time</Text>
              {Platform.OS === "android" ? (
                <TouchableOpacity
                  onPress={() => setShowStartTimePicker(true)}
                  className="bg-white px-4 py-2 rounded-md border border-gray-200"
                >
                  <Text>{format(new Date(startTime), "h:mm a")}</Text>
                </TouchableOpacity>
              ) : null}

              {showStartTimePicker && (
                <DateTimePicker
                  value={new Date(startTime)}
                  mode="time"
                  is24Hour={false}
                  minuteInterval={15}
                  onChange={(event, date) =>
                    handleTimeChange("startTime", event, date)
                  }
                  style={styles.timePicker}
                />
              )}
            </View>

            <View>
              <Text className="text-gray-600 mb-2">End Time</Text>
              {Platform.OS === "android" ? (
                <TouchableOpacity
                  onPress={() => setShowEndTimePicker(true)}
                  className="bg-white px-4 py-2 rounded-md border border-gray-200"
                >
                  <Text>{format(new Date(endTime), "h:mm a")}</Text>
                </TouchableOpacity>
              ) : null}

              {showEndTimePicker && (
                <DateTimePicker
                  value={new Date(endTime)}
                  mode="time"
                  is24Hour={false}
                  minuteInterval={15}
                  onChange={(event, date) =>
                    handleTimeChange("endTime", event, date)
                  }
                  style={styles.timePicker}
                />
              )}
            </View>
          </View>
        </View>

        <View className="mb-8">
          <Text className="text-lg font-semibold mb-4">Select Dates</Text>
          <View className="bg-gray-50 p-2 rounded-lg">
            <Calendar
              onDayPress={onDayPress}
              markedDates={selectedDates}
              markingType={"multi-dot"}
              theme={{
                backgroundColor: "#F9FAFB",
                calendarBackground: "#F9FAFB",
                textSectionTitleColor: "#64748B",
                selectedDayBackgroundColor: "#3498db",
                selectedDayTextColor: "#ffffff",
                todayTextColor: "#3498db",
                dayTextColor: "#1F2937",
                textDisabledColor: "#CBD5E1",
              }}
            />
          </View>
        </View>

        <TouchableOpacity
          className="bg-blue-500 px-6 py-4 rounded-lg"
          onPress={handleSubmit}
        >
          <Text className="text-white font-semibold text-center text-lg">
            Create Event Proposal
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  timePicker: {
    height: 40,
    minWidth: 120,
  },
});
