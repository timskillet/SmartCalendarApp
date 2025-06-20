import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "../../types";

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: {
    title: string;
    calendarId: string;
    type: string;
    startTime: Date;
    endTime: Date;
    completed: boolean;
    color: string;
    description: string;
    location: string;
    invitees: string[];
    repeat: boolean;
  }) => void;
  start: Date;
  end: Date;
  calendars: Calendar[];
  selectedCalendarId: string;
  onCalendarChange: (calendarId: string) => void;
}

// Color options with their hex values
const colorOptions = [
  { name: "Red", color: "#FF0000" },
  { name: "Blue", color: "#0000FF" },
  { name: "Green", color: "#00FF00" },
  { name: "Yellow", color: "#FFFF00" },
  { name: "Purple", color: "#800080" },
];

const typeOptions = [
  { type: "Goal", icon: "emoji-events" as const },
  { type: "Task", icon: "check-circle" as const },
  { type: "Habit", icon: "repeat" as const },
  { type: "Meeting", icon: "groups" as const },
];

export const EventModal: React.FC<EventModalProps> = ({
  visible,
  onClose,
  onSave,
  start,
  end,
  calendars,
  selectedCalendarId,
  onCalendarChange,
}) => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(start);
  const [endTime, setEndTime] = useState(end);
  const [repeat, setRepeat] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState("#000000");
  const [invitees, setInvitees] = useState([]);
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState("Black");
  const [isCalendarDropdownOpen, setIsCalendarDropdownOpen] = useState(false);
  const [selectedType, setSelectedType] = useState("Event");
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);

  useEffect(() => {
    // Initialize with explicit date components to avoid timezone issues
    const initialStart = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate(),
      start.getHours(),
      start.getMinutes(),
      0,
      0
    );
    const initialEnd = new Date(
      end.getFullYear(),
      end.getMonth(),
      end.getDate(),
      end.getHours(),
      end.getMinutes(),
      0,
      0
    );
    setStartTime(initialStart);
    setEndTime(initialEnd);
  }, [start, end]);

  const handleAllDay = () => {
    if (allDay) {
      setAllDay(false);
    } else {
      setAllDay(true);
    }
  };

  const handleRecurringChange = () => {
    if (repeat) {
      setRepeat(false);
    } else {
      setRepeat(true);
    }
  };

  const handleStartTimeChange = (
    event: DateTimePickerEvent,
    selectedStartTime?: Date
  ) => {
    if (Platform.OS === "android") {
      onClose();
      if (event.type === "set" && selectedStartTime) {
        // Create a new date using the selected date's components
        const newStartTime = new Date(
          startTime.getFullYear(),
          startTime.getMonth(),
          startTime.getDate(),
          selectedStartTime.getHours(),
          selectedStartTime.getMinutes(),
          0,
          0
        );
        setStartTime(newStartTime);
      }
    } else {
      if (selectedStartTime) {
        // Create a new date using the selected date's components
        const newStartTime = new Date(
          startTime.getFullYear(),
          startTime.getMonth(),
          startTime.getDate(),
          selectedStartTime.getHours(),
          selectedStartTime.getMinutes(),
          0,
          0
        );
        setStartTime(newStartTime);
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
        // Create a new date using the selected date's components
        const newEndTime = new Date(
          endTime.getFullYear(),
          endTime.getMonth(),
          endTime.getDate(),
          selectedEndTime.getHours(),
          selectedEndTime.getMinutes(),
          0,
          0
        );
        if (newEndTime > startTime) {
          setEndTime(newEndTime);
        }
      }
    } else {
      if (selectedEndTime) {
        // Create a new date using the selected date's components
        const newEndTime = new Date(
          endTime.getFullYear(),
          endTime.getMonth(),
          endTime.getDate(),
          selectedEndTime.getHours(),
          selectedEndTime.getMinutes(),
          0,
          0
        );
        if (newEndTime > startTime) {
          setEndTime(newEndTime);
        }
      }
    }
  };

  const handleColorSelect = (colorName: string, colorValue: string) => {
    setColor(colorValue);
    setSelectedColorName(colorName);
    setIsColorDropdownOpen(false);
  };

  const handleSave = () => {
    // Ensure we're using the local time components
    const localStartTime = new Date(
      startTime.getFullYear(),
      startTime.getMonth(),
      startTime.getDate(),
      startTime.getHours(),
      startTime.getMinutes(),
      0,
      0
    );

    const localEndTime = new Date(
      endTime.getFullYear(),
      endTime.getMonth(),
      endTime.getDate(),
      endTime.getHours(),
      endTime.getMinutes(),
      0,
      0
    );

    onSave({
      title: title || "New Event",
      calendarId: selectedCalendarId,
      type: selectedType,
      completed: false,
      color: color || "#3B82F6",
      description: description,
      invitees: invitees,
      location: location,
      startTime: localStartTime,
      endTime: localEndTime,
      repeat: repeat,
    });
    onClose();
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
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold">New Entry</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <ScrollView>
                {/* Title */}
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 mb-4"
                  placeholder="Title"
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
                      <Text className="text-gray-700">{selectedType}</Text>
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
                          <Text className="text-gray-700">{option.type}</Text>
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
                            onCalendarChange(calendar.id);
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
                        isColorDropdownOpen
                          ? "arrow-drop-up"
                          : "arrow-drop-down"
                      }
                      size={24}
                      color="#6B7280"
                    />
                  </TouchableOpacity>

                  {isColorDropdownOpen && (
                    <View className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                      <ScrollView className="max-h-[200px]">
                        {colorOptions.map((option) => (
                          <TouchableOpacity
                            key={option.name}
                            onPress={() =>
                              handleColorSelect(option.name, option.color)
                            }
                            className="flex-row items-center p-3 border-b border-gray-100 last:border-b-0"
                          >
                            <View
                              className="w-4 h-4 rounded-full mr-2"
                              style={{ backgroundColor: option.color }}
                            />
                            <Text className="text-gray-700">{option.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </ScrollView>
              {/* Save/Cancel Buttons */}
              <View className="flex-row justify-between mt-4">
                <TouchableOpacity className="rounded-lg bg-gray-500 px-4 py-2 mr-2">
                  <Text className="text-white">Advanced</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
