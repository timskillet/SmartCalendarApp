import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface CreateCalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
  colorOptions: { name: string; color: string }[];
  selectedColor: string;
  selectedColorName: string;
  isColorDropdownOpen: boolean;
  onColorSelect: (colorName: string, colorValue: string) => void;
  onColorDropdownToggle: () => void;
}

export const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({
  isVisible,
  onClose,
  onSave,
  colorOptions,
  selectedColor,
  selectedColorName,
  isColorDropdownOpen,
  onColorSelect,
  onColorDropdownToggle,
}) => {
  const [calendarName, setCalendarName] = useState("");

  const handleSubmit = () => {
    if (calendarName.trim()) {
      onSave(calendarName.trim(), selectedColor);
      setCalendarName("");
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-xl p-5 w-[90%] max-w-[400px]">
              <Text className="text-xl font-bold mb-5">
                Create New Calendar
              </Text>

              <TextInput
                className="border border-gray-200 rounded-lg p-3 mb-4"
                placeholder="Calendar Name"
                value={calendarName}
                onChangeText={setCalendarName}
              />

              {/* Color Selection */}
              <View className="mb-4 relative">
                <Text className="text-gray-600 mb-2">Color</Text>
                <TouchableOpacity
                  onPress={onColorDropdownToggle}
                  className="flex-row items-center justify-between border border-gray-200 rounded-lg p-3 bg-white"
                >
                  <View className="flex-row items-center">
                    <View
                      className="w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: selectedColor }}
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
                  <View className="absolute top-full left-0 right-0 mt-1 border border-gray-200 rounded-lg bg-white shadow-lg z-50">
                    <ScrollView className="max-h-[200px]">
                      {colorOptions.map((option) => (
                        <TouchableOpacity
                          key={option.name}
                          onPress={() =>
                            onColorSelect(option.name, option.color)
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

              <View className="flex-row justify-end mt-4">
                <TouchableOpacity onPress={onClose} className="px-4 py-2 mr-2">
                  <Text className="text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  className="bg-blue-500 px-4 py-2 rounded-lg"
                >
                  <Text className="text-white">Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
