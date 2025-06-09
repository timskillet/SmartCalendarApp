import React, { useState } from "react";
import { Modal, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Calendar } from "../../types";
import { ColorPicker } from "./ColorPicker";

interface CalendarListProps {
  calendars: Calendar[];
  onToggleCalendar: (calendarId: string) => void;
  onAddCalendar: (
    calendar: Omit<Calendar, "id" | "userId" | "createdAt" | "updatedAt">
  ) => void;
  onDeleteCalendar: (calendarId: string) => void;
}

export const CalendarList: React.FC<CalendarListProps> = ({
  calendars,
  onToggleCalendar,
  onAddCalendar,
  onDeleteCalendar,
}) => {
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState("");
  const [selectedColor, setSelectedColor] = useState("#3B82F6");
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleAddCalendar = () => {
    if (!newCalendarName.trim()) return;

    onAddCalendar({
      name: newCalendarName.trim(),
      color: selectedColor,
      isVisible: true,
    });

    setNewCalendarName("");
    setSelectedColor("#3B82F6");
    setIsAddModalVisible(false);
  };

  return (
    <View className="bg-white rounded-lg p-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold">Calendars</Text>
        <TouchableOpacity
          onPress={() => setIsAddModalVisible(true)}
          className="bg-blue-500 px-3 py-1 rounded-lg"
        >
          <Text className="text-white">Add Calendar</Text>
        </TouchableOpacity>
      </View>

      {calendars.map((calendar) => (
        <View
          key={calendar.id}
          className="flex-row items-center justify-between py-2"
        >
          <TouchableOpacity
            onPress={() => onToggleCalendar(calendar.id)}
            className="flex-row items-center flex-1"
          >
            <View
              className="w-4 h-4 rounded-full mr-3"
              style={{ backgroundColor: calendar.color }}
            />
            <Text
              className={`flex-1 ${
                calendar.isVisible ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {calendar.name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onDeleteCalendar(calendar.id)}
            className="ml-2 p-2"
          >
            <Text className="text-red-500">Delete</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add Calendar Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-xl p-5 w-[90%] max-w-[400px]">
            <Text className="text-xl font-bold mb-5">Add New Calendar</Text>

            <TextInput
              className="border border-gray-200 rounded-lg p-3 mb-4"
              placeholder="Calendar Name"
              value={newCalendarName}
              onChangeText={setNewCalendarName}
            />

            <TouchableOpacity
              onPress={() => setShowColorPicker(true)}
              className="flex-row items-center mb-4"
            >
              <View
                className="w-6 h-6 rounded-full mr-2"
                style={{ backgroundColor: selectedColor }}
              />
              <Text>Select Color</Text>
            </TouchableOpacity>

            <ColorPicker
              isVisible={showColorPicker}
              onClose={() => setShowColorPicker(false)}
              onSelectColor={(name, color) => {
                setSelectedColor(color);
                setShowColorPicker(false);
              }}
              selectedColor={selectedColor}
            />

            <View className="flex-row justify-end mt-4">
              <TouchableOpacity
                onPress={() => setIsAddModalVisible(false)}
                className="px-4 py-2 mr-2"
              >
                <Text className="text-gray-600">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddCalendar}
                className="bg-blue-500 px-4 py-2 rounded-lg"
              >
                <Text className="text-white">Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};
