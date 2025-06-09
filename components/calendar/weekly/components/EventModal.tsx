import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Calendar } from "../../types";
import { ColorPicker } from "./ColorPicker";

// Import with a try-catch to handle potential missing module
let defaultTimezone = "UTC";
try {
  const RNLocalize = require("react-native-localize");
  defaultTimezone = RNLocalize.getTimeZone();
} catch (error) {
  console.warn("Could not load RNLocalize, using UTC as default timezone");
}

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: {
    title: string;
    description: string;
    location: string;
    attendees: string[];
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    recurring: boolean;
    color: string;
    timezone: string;
    metadata: Record<string, any>;
  }) => void;
  start: Date;
  end: Date;
  calendars: Calendar[];
  selectedCalendarId: string | null;
  onCalendarChange: (calendarId: string) => void;
}

// Color options with their hex values
const colorOptions = [
  { name: "Red", value: "#FF0000" },
  { name: "Blue", value: "#0000FF" },
  { name: "Green", value: "#00FF00" },
  { name: "Yellow", value: "#FFFF00" },
  { name: "Purple", value: "#800080" },
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
  const [recurring, setRecurring] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState("#000000");
  const [attendees, setAttendees] = useState([]);
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [metadata, setMetadata] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState("Black");

  useEffect(() => {
    setStartTime(start);
    setEndTime(end);
  }, [start, end]);

  const handleAllDay = () => {
    if (allDay) {
      setAllDay(false);
    } else {
      setAllDay(true);
    }
  };

  const handleRecurringChange = () => {
    if (recurring) {
      setRecurring(false);
    } else {
      setRecurring(true);
    }
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
  };

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (showColorPicker) {
      setShowColorPicker(false);
    }
  };

  const handleSave = () => {
    onSave({
      title: title || "New Event",
      description: description,
      attendees: attendees,
      location: location,
      startTime: startTime,
      endTime: endTime,
      color: color || "#3B82F6", // Pass the color to parent component
      recurring: recurring,
      allDay: allDay,
      timezone: timezone,
      metadata: metadata,
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
      <TouchableWithoutFeedback onPress={handleOutsideClick}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-xl p-5 w-[90%] max-w-[400px]">
              <Text className="text-xl font-bold mb-5">Create New Event</Text>

              {/* Calendar Selection */}
              <View className="mb-4">
                <Text className="text-gray-600 mb-2">Calendar:</Text>
                <View className="border border-gray-200 rounded-lg overflow-hidden">
                  {calendars.map((calendar) => (
                    <TouchableOpacity
                      key={calendar.id}
                      onPress={() => onCalendarChange(calendar.id)}
                      className={`flex-row items-center p-3 border-b border-gray-100 ${
                        selectedCalendarId === calendar.id
                          ? "bg-blue-50"
                          : "bg-white"
                      }`}
                    >
                      <View
                        className="w-4 h-4 rounded-full mr-2"
                        style={{ backgroundColor: calendar.color }}
                      />
                      <Text
                        className={`${
                          selectedCalendarId === calendar.id
                            ? "font-medium text-blue-600"
                            : "text-gray-700"
                        }`}
                      >
                        {calendar.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TextInput
                className="border border-gray-200 rounded-lg p-3 mb-4"
                placeholder="Event Title"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                className="border border-gray-200 rounded-lg p-3 mb-4"
                placeholder="Location"
                value={location}
                onChangeText={setLocation}
              />
              <TextInput
                className="border border-gray-200 rounded-lg p-3 mb-4 min-h-[100px]"
                placeholder="Description"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <View className="flex-row items-center justify-start">
                <Text className="text-gray-600 mb-2">Start Time:</Text>
                <View className="p-2">
                  <DateTimePicker
                    mode="time"
                    is24Hour={true}
                    value={startTime}
                    onChange={handleStartTimeChange}
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-start">
                <Text className="text-gray-600 mb-2">End Time:</Text>
                <View className="p-2">
                  <DateTimePicker
                    mode="time"
                    is24Hour={true}
                    value={endTime}
                    onChange={handleEndTimeChange}
                  />
                </View>
              </View>

              <View className="flex-row items-center justify-start my-2">
                <Text className="text-gray-600 mb-2">Recurring?</Text>
                <Switch
                  className="p-2"
                  thumbColor={"white"}
                  value={recurring}
                  onChange={handleRecurringChange}
                />
              </View>

              <View className="flex-row items-center justify-start my-2">
                <Text className="text-gray-600 mb-2">Is all day?</Text>
                <Switch
                  className="p-2"
                  thumbColor={"white"}
                  value={allDay}
                  onChange={handleAllDay}
                />
              </View>

              <View className="mb-4 relative">
                <Text className="text-gray-600 mb-2">Select Color</Text>
                <TouchableOpacity
                  onPress={() => setShowColorPicker(true)}
                  className="flex-row items-center border border-gray-200 rounded-lg p-2"
                >
                  <View
                    className="w-6 h-6 rounded-full mr-2"
                    style={{ backgroundColor: color }}
                  />
                  <Text className="text-gray-800">{selectedColorName}</Text>
                </TouchableOpacity>
                <ColorPicker
                  isVisible={showColorPicker}
                  onClose={() => setShowColorPicker(false)}
                  onSelectColor={handleColorSelect}
                  selectedColor={color}
                />
              </View>

              <View className="flex-row justify-end mt-4">
                <TouchableOpacity onPress={onClose} className="px-4 py-2 mr-2">
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
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
