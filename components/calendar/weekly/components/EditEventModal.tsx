import { CalendarEntry } from "@/components/calendar/types";
import { useCalendar } from "@/context/CalendarProvider";
import { supabase } from "@/lib/supabase";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

// Color options with their hex values
const colorOptions = [
  { name: "Red", color: "#FF0000" },
  { name: "Blue", color: "#0000FF" },
  { name: "Green", color: "#00FF00" },
  { name: "Yellow", color: "#FFFF00" },
  { name: "Purple", color: "#800080" },
];

// Type options for events
const typeOptions = [
  { type: "event", icon: "event" as const },
  { type: "task", icon: "check-circle" as const },
  { type: "habit", icon: "repeat" as const },
  { type: "goal", icon: "emoji-events" as const },
];

interface EditEventModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (updatedEvent: CalendarEntry) => void;
  onDelete: (eventId: string) => void;
  entry: CalendarEntry;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  visible,
  onClose,
  onUpdate,
  onDelete,
  entry,
}) => {
  const { calendars } = useCalendar();
  const [title, setTitle] = useState(entry.title || "");
  const [location, setLocation] = useState(entry.location || "");
  const [description, setDescription] = useState(entry.description || "");
  const [startTime, setStartTime] = useState(entry.startTime);
  const [endTime, setEndTime] = useState(entry.endTime);
  const [repeat, setRepeat] = useState(entry.repeat || false);
  const [color, setColor] = useState(entry.color || "#000000");
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(entry.type || "event");
  const [selectedCalendarId, setSelectedCalendarId] = useState(
    entry.calendarId
  );
  const [selectedColorName, setSelectedColorName] = useState(
    colorOptions.find((c) => c.color === color)?.name || "Black"
  );

  useEffect(() => {
    // Reset form when event changes
    setTitle(entry.title || "");
    setLocation(entry.location || "");
    setDescription(entry.description || "");
    setStartTime(entry.startTime);
    setEndTime(entry.endTime);
    setRepeat(entry.repeat || false);
    setColor(entry.color || "#000000");
    setSelectedType(entry.type || "event");
    setSelectedCalendarId(entry.calendarId);
    setSelectedColorName(
      colorOptions.find((c) => c.color === entry.color)?.name || "Black"
    );
  }, [entry]);

  const handleRecurringChange = () => {
    setRepeat(!repeat);
  };

  const handleStartTimeChange = (
    event: DateTimePickerEvent,
    selectedStartTime?: Date
  ) => {
    if (Platform.OS === "android") {
      onClose();
      if (event.type === "set" && selectedStartTime) {
        setStartTime(selectedStartTime);
      }
    } else {
      if (selectedStartTime) {
        setStartTime(selectedStartTime);
      }
    }
  };

  const handleEndTimeChange = (
    event: DateTimePickerEvent,
    selectedEndTime?: Date
  ) => {
    if (Platform.OS === "android") {
      onClose();
      if (event.type === "set" && selectedEndTime) {
        if (selectedEndTime > startTime) {
          setEndTime(selectedEndTime);
        }
      }
    } else {
      if (selectedEndTime && selectedEndTime > startTime) {
        setEndTime(selectedEndTime);
      }
    }
  };

  const handleColorSelect = (colorName: string, colorValue: string) => {
    setColor(colorValue);
    setSelectedColorName(colorName);
    setIsColorDropdownOpen(false);
  };

  const handleSave = async () => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      const userId = authData.session?.user?.id;

      if (!userId) {
        console.error("No authenticated user found.");
        return;
      }

      const { data, error } = await supabase
        .from("calendar_entries")
        .update({
          title: title || "New Event",
          description: description || "",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          repeat: repeat,
          location: location || "",
          color: color,
          type: selectedType,
          calendar_id: selectedCalendarId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", entry.id)
        .select();

      if (error) {
        console.error("Error updating event:", error);
        return;
      }

      const updatedEvent: CalendarEntry = {
        ...entry,
        title: title || "New Event",
        description: description || "",
        startTime: startTime,
        endTime: endTime,
        repeat: repeat,
        location: location || "",
        color: color,
        type: selectedType,
        calendarId: selectedCalendarId,
      };

      onUpdate(updatedEvent);
      onClose();
    } catch (error) {
      console.error("Error in handleSave:", error);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete Event", "Are you sure you want to delete this event?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          onDelete(entry.id);
          onClose();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-xl p-5 w-[90%] max-w-[400px]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold">Edit Entry</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Title */}
              <TextInput
                className="border border-gray-200 rounded-lg p-3 mb-4"
                placeholder="Event Title"
                value={title}
                onChangeText={setTitle}
              />

              {/* Type */}
              <View className="mb-4 relative">
                <Text className="text-gray-600 mb-2">Type</Text>
                <TouchableOpacity
                  onPress={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name={
                        typeOptions.find((t) => t.type === selectedType)
                          ?.icon || "event"
                      }
                      size={20}
                      color="#6B7280"
                      style={{ marginRight: 8 }}
                    />
                    <Text className="text-gray-700">
                      {selectedType.charAt(0).toUpperCase() +
                        selectedType.slice(1)}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={
                      isTypeDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"
                    }
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {isTypeDropdownOpen && (
                  <View className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                    {typeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.type}
                        onPress={() => {
                          setSelectedType(option.type);
                          setIsTypeDropdownOpen(false);
                        }}
                        className="flex-row items-center p-3 border-b border-gray-100 last:border-b-0"
                      >
                        <MaterialIcons
                          name={option.icon}
                          size={20}
                          color="#6B7280"
                          style={{ marginRight: 8 }}
                        />
                        <Text className="text-gray-700">
                          {option.type.charAt(0).toUpperCase() +
                            option.type.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Calendar Selection */}
              <View className="mb-4 relative">
                <Text className="text-gray-600 mb-2">Calendar:</Text>
                <TouchableOpacity
                  onPress={() =>
                    setIsCalendarDropdownOpen(!isCalendarDropdownOpen)
                  }
                  className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-4 h-4 rounded-full mr-2"
                      style={{
                        backgroundColor:
                          calendars.find((c) => c.id === selectedCalendarId)
                            ?.color || "#3B82F6",
                      }}
                    />
                    <Text className="text-gray-700">
                      {calendars.find((c) => c.id === selectedCalendarId)
                        ?.name || "Select Calendar"}
                    </Text>
                  </View>
                  <MaterialIcons
                    name={
                      isCalendarDropdownOpen
                        ? "arrow-drop-up"
                        : "arrow-drop-down"
                    }
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {isCalendarDropdownOpen && (
                  <View className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                    {calendars.map((calendar) => (
                      <TouchableOpacity
                        key={calendar.id}
                        onPress={() => {
                          setSelectedCalendarId(calendar.id);
                          setIsCalendarDropdownOpen(false);
                        }}
                        className="flex-row items-center p-3 border-b border-gray-100 last:border-b-0"
                      >
                        <View
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <Text className="text-gray-700">{calendar.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Date */}
              <Text className="text-gray-600 mb-2">Date</Text>
              <View className="flex-col border border-gray-200 rounded-lg mb-4">
                {/* Day */}
                <View className="border-b border-gray-200 flex-row items-center justify-between px-2 py-1">
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="date-range"
                      size={24}
                      color="#6B7280"
                    />
                    <Text className="pl-2 text-gray-600">Date</Text>
                  </View>
                  <DateTimePicker
                    className="flex-1"
                    mode="date"
                    value={startTime}
                  />
                </View>

                {/* Start Time */}
                <View className="border-b border-gray-200 flex-row items-center justify-between px-2 py-1">
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="access-time"
                      size={24}
                      color="#6B7280"
                    />
                    <Text className="pl-2 text-gray-600">Start Time</Text>
                  </View>
                  <DateTimePicker
                    mode="time"
                    is24Hour={true}
                    value={startTime}
                    onChange={handleStartTimeChange}
                  />
                </View>

                {/* End Time */}
                <View className="flex-row items-center justify-between px-2 py-1">
                  <View className="flex-row items-center">
                    <MaterialIcons
                      name="access-time"
                      size={24}
                      color="#6B7280"
                    />
                    <Text className="pl-2 text-gray-600">End Time</Text>
                  </View>
                  <DateTimePicker
                    mode="time"
                    is24Hour={true}
                    value={endTime}
                    onChange={handleEndTimeChange}
                  />
                </View>
              </View>

              {/* Color Selection */}
              <View className="mb-4 relative">
                <Text className="text-gray-600 mb-2">Color</Text>
                <TouchableOpacity
                  onPress={() => setIsColorDropdownOpen(!isColorDropdownOpen)}
                  className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: color }}
                    />
                    <Text className="text-gray-700">{selectedColorName}</Text>
                  </View>
                  <MaterialIcons
                    name={
                      isColorDropdownOpen ? "arrow-drop-up" : "arrow-drop-down"
                    }
                    size={24}
                    color="#6B7280"
                  />
                </TouchableOpacity>

                {isColorDropdownOpen && (
                  <View className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50 max-h-[200px]">
                    <ScrollView className="max-h-[200px]">
                      {colorOptions.map((option) => {
                        return (
                          <TouchableOpacity
                            key={option.name}
                            onPress={() => setColor(option.color)}
                            className="flex-row items-center p-3 border-b border-gray-100 last:border-b-0"
                          >
                            <View
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: option.color }}
                            />
                            <Text className="text-gray-700">{option.name}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}
              </View>

              <View className="flex-row justify-between mt-4">
                <TouchableOpacity
                  onPress={handleDelete}
                  className="bg-red-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white">Delete</Text>
                </TouchableOpacity>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={onClose}
                    className="px-4 py-2 mr-2"
                  >
                    <Text className="text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSave}
                    className="bg-blue-500 px-4 py-2 rounded-lg"
                  >
                    <Text className="text-white">Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
