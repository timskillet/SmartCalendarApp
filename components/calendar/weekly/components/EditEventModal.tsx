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
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Event } from "../../types/index";

// Color options with their hex values
const colorOptions = [
  { name: "Red", color: "#FF0000" },
  { name: "Blue", color: "#0000FF" },
  { name: "Green", color: "#00FF00" },
  { name: "Yellow", color: "#FFFF00" },
  { name: "Purple", color: "#800080" },
];

interface EditEventModalProps {
  visible: boolean;
  onClose: () => void;
  onUpdate: (updatedEvent: Event) => void;
  onDelete: (eventId: string) => void;
  event: Event;
}

export const EditEventModal: React.FC<EditEventModalProps> = ({
  visible,
  onClose,
  onUpdate,
  onDelete,
  event,
}) => {
  const [title, setTitle] = useState(event.title || "");
  const [location, setLocation] = useState(event.location || "");
  const [description, setDescription] = useState(event.description || "");
  const [startTime, setStartTime] = useState(event.startTime);
  const [endTime, setEndTime] = useState(event.endTime);
  const [repeat, setRepeat] = useState(event.repeat || false);
  const [color, setColor] = useState(event.color || "#000000");
  const [isColorDropdownOpen, setIsColorDropdownOpen] = useState(false);
  const [selectedColorName, setSelectedColorName] = useState(
    colorOptions.find((c) => c.color === color)?.name || "Black"
  );

  useEffect(() => {
    // Reset form when event changes
    setTitle(event.title || "");
    setLocation(event.location || "");
    setDescription(event.description || "");
    setStartTime(event.startTime);
    setEndTime(event.endTime);
    setRepeat(event.repeat || false);
    setColor(event.color || "#000000");
    setSelectedColorName(
      colorOptions.find((c) => c.color === event.color)?.name || "Black"
    );
  }, [event]);

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
        .schema("api")
        .from("events")
        .update({
          title: title || "New Event",
          description: description || "",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          repeat: repeat,
          location: location || "",
          color: color,
          updated_at: new Date().toISOString(),
        })
        .eq("id", event.id)
        .select();

      if (error) {
        console.error("Error updating event:", error);
        return;
      }

      const updatedEvent: Event = {
        ...event,
        title: title || "New Event",
        description: description || "",
        startTime: startTime,
        endTime: endTime,
        repeat: repeat,
        location: location || "",
        color: color,
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
          onDelete(event.id);
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
              <Text className="text-xl font-bold mb-5">Edit Event</Text>

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
                  value={repeat}
                  onChange={handleRecurringChange}
                />
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
