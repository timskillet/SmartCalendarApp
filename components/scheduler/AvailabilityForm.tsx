import DateTimePicker from "@react-native-community/datetimepicker";
import { addDays, format } from "date-fns";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";

type TimeIncrement = 15 | 30 | 60;
type DateRange = {
  startDate: Date;
  endDate: Date;
};

interface AvailabilityFormProps {
  onContinue: (
    dateRange: DateRange,
    timeRange: { start: Date; end: Date }
  ) => void;
}

export const AvailabilityForm: React.FC<AvailabilityFormProps> = ({
  onContinue,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date>(new Date());
  startTime.setHours(9, 0, 0, 0);
  const [endTime, setEndTime] = useState<Date>(new Date());
  endTime.setHours(17, 0, 0, 0);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(),
    endDate: addDays(new Date(), 7),
  });
  const [showStartTimePicker, setShowStartTimePicker] = useState(
    Platform.OS === "ios"
  );
  const [showEndTimePicker, setShowEndTimePicker] = useState(
    Platform.OS === "ios"
  );

  // For calendar selection
  const [markedDates, setMarkedDates] = useState<{ [date: string]: any }>({});

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

  const handleDateSelection = (day: any) => {
    const dateString = day.dateString;
    const selectedDate = new Date(dateString);

    // If we haven't selected a start date yet, or we're starting a new selection
    if (!dateRange.startDate || (dateRange.startDate && dateRange.endDate)) {
      setDateRange({
        startDate: selectedDate,
        endDate: selectedDate,
      });

      // Mark this date
      setMarkedDates({
        [dateString]: {
          selected: true,
          startingDay: true,
          endingDay: true,
          color: "#3498db",
        },
      });
    }
    // If we have a start date but no end date
    else if (dateRange.startDate && !dateRange.endDate) {
      // Ensure end date is after start date
      if (selectedDate < dateRange.startDate) {
        setError("End date must be after start date");
        return;
      }

      setDateRange({
        ...dateRange,
        endDate: selectedDate,
      });

      // Mark the date range
      const newMarkedDates: { [date: string]: any } = {};
      let currentDate = new Date(dateRange.startDate);

      while (currentDate <= selectedDate) {
        const dateStr = format(currentDate, "yyyy-MM-dd");

        if (
          format(currentDate, "yyyy-MM-dd") ===
          format(dateRange.startDate, "yyyy-MM-dd")
        ) {
          newMarkedDates[dateStr] = {
            selected: true,
            startingDay: true,
            color: "#3498db",
          };
        } else if (
          format(currentDate, "yyyy-MM-dd") ===
          format(selectedDate, "yyyy-MM-dd")
        ) {
          newMarkedDates[dateStr] = {
            selected: true,
            endingDay: true,
            color: "#3498db",
          };
        } else {
          newMarkedDates[dateStr] = { selected: true, color: "#3498db" };
        }

        currentDate = addDays(currentDate, 1);
      }

      setMarkedDates(newMarkedDates);
    }
  };

  const handleContinue = () => {
    if (!dateRange.startDate || !dateRange.endDate) {
      setError("Please select a date range");
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

    // Call the onContinue prop with the selected date and time ranges
    onContinue(dateRange, {
      start: new Date(startTime),
      end: new Date(endTime),
    });
  };

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="p-6">
        {error && (
          <View className="bg-red-100 p-3 rounded-lg mb-4">
            <Text className="text-red-600 text-center">{error}</Text>
          </View>
        )}

        <Text className="text-2xl font-bold mb-8">Set Your Availability</Text>

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
          <Text className="text-lg font-semibold mb-4">Select Date Range</Text>
          <View className="bg-gray-50 p-2 rounded-lg">
            <Text className="text-sm text-gray-600 mb-2 px-2">
              {dateRange.startDate && dateRange.endDate
                ? `${format(dateRange.startDate, "MMM d, yyyy")} - ${format(
                    dateRange.endDate,
                    "MMM d, yyyy"
                  )}`
                : "Tap to select dates"}
            </Text>
            <Calendar
              onDayPress={handleDateSelection}
              markedDates={markedDates}
              markingType={"period"}
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
          onPress={handleContinue}
        >
          <Text className="text-white font-semibold text-center text-lg">
            Continue to Grid View
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
