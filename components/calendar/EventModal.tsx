import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Event } from "./WeeklyView";

interface EventModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, "id">) => void;
  start: Date;
  end: Date;
}

export const EventModal: React.FC<EventModalProps> = ({
  visible,
  onClose,
  onSave,
  start,
  end,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState(start);
  const [endTime, setEndTime] = useState(end);

  useEffect(() => {
    setStartTime(start);
    setEndTime(end);
  }, [start, end]);

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

  const handleSave = () => {
    onSave({
      title: title || "New Event",
      description,
      startTime,
      endTime,
      position: 0,
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
      <View className="flex-1 bg-black/50 justify-center items-center">
        <View className="bg-white rounded-xl p-5 w-[90%] max-w-[400px]">
          <Text className="text-xl font-bold mb-5">Create New Event</Text>

          <TextInput
            className="border border-gray-200 rounded-lg p-3 mb-4"
            placeholder="Event Title"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            className="border border-gray-200 rounded-lg p-3 mb-4 min-h-[100px]"
            placeholder="Description"
            value={description}
            onChangeText={setDescription}
            multiline
          />

          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-1 mr-2">
              <Text className="text-gray-600 mb-2">Start Time</Text>
              <View className="border border-gray-200 rounded-lg p-2">
                <DateTimePicker
                  mode="time"
                  is24Hour={true}
                  value={startTime}
                  onChange={handleStartTimeChange}
                />
              </View>
            </View>
            <View className="flex-1 ml-2">
              <Text className="text-gray-600 mb-2">End Time</Text>
              <View className="border border-gray-200 rounded-lg p-2">
                <DateTimePicker
                  mode="time"
                  is24Hour={true}
                  value={endTime}
                  onChange={handleEndTimeChange}
                />
              </View>
            </View>
          </View>

          <View className="flex-row justify-end gap-3">
            <TouchableOpacity
              className="px-4 py-3 rounded-lg min-w-[80px] items-center"
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
      </View>
    </Modal>
  );
};
