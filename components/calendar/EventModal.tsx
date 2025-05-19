import { supabase } from "@/lib/supabase";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
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
    startTime: Date;
    endTime: Date;
    allDay: boolean;
  }) => void;
  start: Date;
  end: Date;
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
}) => {
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(start);
  const [endTime, setEndTime] = useState(end);
  const [recurring, setRecurring] = useState(false);
  const [allDay, setAllDay] = useState(false);
  const [color, setColor] = useState("#000000");
  const [timezone, setTimezone] = useState(defaultTimezone);
  const [metadata, setMetadata] = useState({});
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState("Black");
  const [dropdownPosition, setDropdownPosition] = useState({
    top: 70,
    bottom: "auto",
  });
  const colorPickerRef = useRef<View>(null);

  useEffect(() => {
    setStartTime(start);
    setEndTime(end);
  }, [start, end]);

  // Calculate dropdown position when showing
  useEffect(() => {
    if (showColorPicker && colorPickerRef.current) {
      colorPickerRef.current.measure((x, y, width, height, pageX, pageY) => {
        const screenHeight = Dimensions.get("window").height;
        const dropdownHeight = colorOptions.length * 50; // Approximate height of dropdown

        // Check if dropdown would go off screen
        if (pageY + height + dropdownHeight > screenHeight - 100) {
          // Position dropdown above the button
          setDropdownPosition({ top: "auto", bottom: height + 5 });
        } else {
          // Position dropdown below the button
          setDropdownPosition({ top: height + 5, bottom: "auto" });
        }
      });
    }
  }, [showColorPicker]);

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
    setShowColorPicker(false);
  };

  // Close dropdown when clicking outside
  const handleOutsideClick = () => {
    if (showColorPicker) {
      setShowColorPicker(false);
    }
  };

  const handleSave = async () => {
    try {
      const { data: authData } = await supabase.auth.getSession();
      console.log("Auth session:", JSON.stringify(authData, null, 2));

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
        return;
      }

      const userId = user?.id;

      if (!userId) {
        console.error("No authenticated user found.");
        return;
      }

      console.log("Attempting to insert event with user ID:", userId);

      const { data, error } = await supabase
        .schema("api")
        .from("events")
        .insert([
          {
            user_id: userId,
            title: title || "New Event",
            description: description || "",
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            is_all_day: allDay,
            recurrence: recurring,
            location: location || "",
            color: color || "#000000",
            timezone: timezone,
            metadata: metadata || {},
            created_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) {
        console.error("Error inserting event:", error.message);
        console.error("Error details:", JSON.stringify(error, null, 2));
      } else {
        console.log("Event created successfully:", data);
        onSave({
          title: title || "New Event",
          startTime: startTime,
          endTime: endTime,
          allDay,
        });
      }
    } catch (error) {
      console.error("Unexpected error in handleSave:", error);
    } finally {
      onClose();
    }
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
                  ref={colorPickerRef}
                  className="border border-gray-200 rounded-lg p-3 flex-row items-center"
                  onPress={() => setShowColorPicker(!showColorPicker)}
                >
                  <View
                    style={{ backgroundColor: color }}
                    className="w-5 h-5 rounded-full mr-2"
                  />
                  <Text>{selectedColorName}</Text>
                </TouchableOpacity>

                {showColorPicker && (
                  <View
                    className="absolute left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-md z-10"
                    style={{
                      top:
                        dropdownPosition.top !== "auto"
                          ? dropdownPosition.top
                          : undefined,
                      bottom:
                        dropdownPosition.bottom !== "auto"
                          ? dropdownPosition.bottom
                          : undefined,
                      maxHeight: 200,
                    }}
                  >
                    {colorOptions.map((item) => (
                      <TouchableOpacity
                        key={item.value}
                        className="flex-row items-center p-3 border-b border-gray-100"
                        onPress={() => handleColorSelect(item.name, item.value)}
                      >
                        <View
                          style={{ backgroundColor: item.value }}
                          className="w-5 h-5 rounded-full mr-2"
                        />
                        <Text>{item.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              <View className="flex-row justify-between gap-3">
                <TouchableOpacity
                  className="px-4 py-3 rounded-lg min-w-[80px] items-center bg-gray-200"
                  onPress={onClose}
                >
                  <Text className="text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="px-4 py-3 rounded-lg min-w-[80px] items-center bg-blue-500"
                  onPress={handleSave}
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
