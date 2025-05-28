import { addMinutes, format, parse } from "date-fns";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  TouchableOpacity,
  View,
} from "react-native";
import { computeAvailability } from "./utils/schedulerUtils";

const SCREEN_WIDTH = Dimensions.get("window").width;
const SCREEN_HEIGHT = Dimensions.get("window").height;
const MIN_CELL_WIDTH = 80; // Minimum width for a cell
const MIN_CELL_HEIGHT = 40; // Minimum height for a cell
const PADDING = 32; // Total horizontal padding (16 on each side)
const TIME_COLUMN_WIDTH = 80; // Width of the time labels column

type TimeRange = {
  start: Date;
  end: Date;
};

type AvailabilityGridProps = {
  proposalId: string;
  selectedDates: Date[];
  timeRange: TimeRange;
  onSave: (availability: AvailabilityData) => void;
  onBack: () => void;
};

type AvailabilityData = {
  [date: string]: string[]; // date -> array of time slots
};

export const AvailabilityGrid: React.FC<AvailabilityGridProps> = ({
  selectedDates,
  timeRange,
  onSave,
  onBack,
}) => {
  const [hours, setHours] = useState<string[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [selectedCells, setSelectedCells] = useState<{
    [key: string]: string[];
  }>({});

  // Calculate dynamic cell dimensions
  const availableWidth = SCREEN_WIDTH - PADDING - TIME_COLUMN_WIDTH;
  const numDates = selectedDates.length;
  const cellWidth = Math.max(
    MIN_CELL_WIDTH,
    numDates > 0 ? availableWidth / numDates : availableWidth
  );

  const availableHeight = SCREEN_HEIGHT - 200; // Adjust based on your header height
  const numTimeSlots = hours.length;
  const cellHeight = Math.max(
    MIN_CELL_HEIGHT,
    numTimeSlots > 0 ? availableHeight / numTimeSlots : availableHeight
  );

  const dateScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Generate time slots based on the time range
    if (timeRange.start && timeRange.end) {
      const timeSlots: string[] = [];
      let currentTime = new Date(timeRange.start);

      while (currentTime < timeRange.end) {
        timeSlots.push(format(currentTime, "HH:mm"));
        currentTime = addMinutes(currentTime, 30); // 30-minute intervals
      }

      setHours(timeSlots);
    }
  }, [selectedDates, timeRange]);

  const toggleCellSelection = (day: Date, hour: string) => {
    const key = `${format(day, "yyyy-MM-dd")}`;

    // Initialize the array iff it doesn't exist
    if (!selectedCells[key]) {
      selectedCells[key] = []; // Initialize as an empty array
      // Add the hour to the selected cells
      setSelectedCells((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), hour],
      }));
    } else if (selectedCells[key].includes(hour)) {
      setSelectedCells((prev) => ({
        ...prev,
        [key]: selectedCells[key].filter((h) => h !== hour),
      }));
    } else {
      // Add the hour to the selected cells
      setSelectedCells((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), hour],
      }));
    }
  };

  const isCellSelected = (day: Date, hour: string) => {
    const key = format(day, "yyyy-MM-dd");
    return selectedCells[key] ? selectedCells[key].includes(hour) : false;
  };

  const handleSave = async () => {
    try {
      // Convert selected cells to the format expected by the onSave callback
      const availability: AvailabilityData = {};

      Object.keys(selectedCells).forEach((key) => {
        if (selectedCells[key]) {
          availability[key] = selectedCells[key];
        }
      });

      if (Object.keys(availability).length === 0) {
        Alert.alert(
          "No availability selected",
          "Please select at least one time slot."
        );
        return;
      }

      console.log("Getting user...");
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

      const availabilitySubmission = {
        user_id: user.id,
        proposal_id: proposalId,
        availability: availability,
        submitted_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .schema("public")
        .from("availability_submissions")
        .insert([availabilitySubmission])
        .select();

      if (error) {
        console.error("Error saving availability:", error);
      } else {
        console.log("Availability saved successfully:", data);
      }
      computeAvailability(proposalId);
      onSave(availability);
    } catch (err) {
      console.error("Error saving availability:", err);
    }
  };

  const handleHorizontalScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>
  ) => {
    if (isScrolling) return;
    setIsScrolling(true);
    const { x } = event.nativeEvent.contentOffset;
    dateScrollRef.current?.scrollTo({ x, animated: false });
    setIsScrolling(false);
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header with back and save buttons */}
      <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
        <TouchableHighlight onPress={onBack} className="px-4 py-2">
          <Text className="text-blue-500">Back</Text>
        </TouchableHighlight>

        <Text className="text-lg font-semibold">Select Availability</Text>

        <TouchableHighlight onPress={handleSave} className="px-4 py-2">
          <Text className="text-blue-500">Save</Text>
        </TouchableHighlight>
      </View>

      {/* Instructions */}
      <View className="p-4 bg-gray-50">
        <Text className="text-gray-700">
          Tap on time slots to mark when you're available.
        </Text>
      </View>

      {/* Date Headers */}
      <View style={styles.headerRow}>
        <View style={[styles.cornerCell, { width: TIME_COLUMN_WIDTH }]} />

        <ScrollView
          horizontal
          ref={dateScrollRef}
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
        >
          <View className="flex-row">
            {selectedDates.map((date, i) => (
              <View
                key={i}
                style={{ width: cellWidth }}
                className="py-2 items-center justify-center border-r border-gray-100"
              >
                <Text className="text-gray-800">{format(date, "EEE")}</Text>
                <Text className="text-xs text-gray-500">
                  {format(date, "MMM d")}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView scrollEventThrottle={16}>
        <View className="flex-row">
          {/* Time column */}
          <View style={[styles.timeColumn, { width: TIME_COLUMN_WIDTH }]}>
            {hours.map((hour, i) => (
              <View
                key={i}
                style={{ height: cellHeight }}
                className="justify-center items-center border-r border-b border-gray-100"
              >
                <Text className="text-sm text-gray-600">
                  {format(parse(hour, "HH:mm", new Date()), "h:mm a")}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid cells */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={handleHorizontalScroll}
          >
            <View>
              {hours.map((hour, hourIndex) => (
                <View key={`hour-${hourIndex}`} className="flex-row">
                  {selectedDates.map((day, dayIndex) => (
                    <TouchableOpacity
                      key={`${dayIndex}-${hourIndex}`}
                      onPress={() => toggleCellSelection(day, hour)}
                      style={{ width: cellWidth, height: cellHeight }}
                      className={`border-b border-r border-gray-100 items-center justify-center ${
                        isCellSelected(day, hour) ? "bg-blue-200" : ""
                      }`}
                    >
                      {isCellSelected(day, hour) && (
                        <View className="absolute inset-0 bg-blue-500" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Bottom save button */}
      <View className="p-4 border-t border-gray-200">
        <TouchableOpacity
          className="bg-blue-500 px-6 py-4 rounded-lg"
          onPress={handleSave}
        >
          <Text className="text-white font-semibold text-center text-lg">
            Save Availability
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    height: 50,
    zIndex: 10,
  },
  cornerCell: {
    height: 50,
    backgroundColor: "#FAFAFA",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    zIndex: 20,
  },
  timeColumn: {
    backgroundColor: "#FAFAFA",
    borderRightWidth: 1,
    borderRightColor: "#E5E7EB",
    zIndex: 10,
  },
});
