import { MaterialIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Modal,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { ColorPicker } from "./weekly/components/ColorPicker";

interface CreateCalendarModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (name: string, color: string) => void;
}

export const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({
  isVisible,
  onClose,
  onSave,
}) => {
  const [calendarName, setCalendarName] = useState("");
  const [calendarColor, setCalendarColor] = useState("#3B82F6");
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    if (!calendarName.trim()) {
      setError("Calendar name is required");
      return;
    }
    onSave(calendarName.trim(), calendarColor);
    setCalendarName("");
    setCalendarColor("#3B82F6");
    setError(null);
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={() => setShowColorPicker(false)}>
        <View className="flex-1 bg-black/50 justify-center items-center">
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-xl p-6 w-[90%] max-w-[400px]">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold">Create Calendar</Text>
                <TouchableOpacity onPress={onClose}>
                  <MaterialIcons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              {/* Error Message */}
              {error && <Text className="text-red-500 mb-4">{error}</Text>}

              {/* Calendar Name Input */}
              <View className="mb-6">
                <Text className="text-gray-600 mb-2">Calendar Name</Text>
                <TextInput
                  className="border border-gray-200 rounded-lg p-3 bg-gray-50"
                  placeholder="Enter calendar name"
                  value={calendarName}
                  onChangeText={(text) => {
                    setCalendarName(text);
                    setError(null);
                  }}
                />
              </View>

              {/* Color Selection */}
              <View className="mb-6">
                <Text className="text-gray-600 mb-2">Calendar Color</Text>
                <TouchableOpacity
                  onPress={() => setShowColorPicker(true)}
                  className="flex-row items-center border border-gray-200 rounded-lg p-3 bg-gray-50"
                >
                  <View
                    className="w-6 h-6 rounded-full mr-3"
                    style={{ backgroundColor: calendarColor }}
                  />
                  <Text className="text-gray-800">Select Color</Text>
                  <MaterialIcons
                    name="arrow-drop-down"
                    size={24}
                    color="#6B7280"
                    style={{ marginLeft: "auto" }}
                  />
                </TouchableOpacity>
                <ColorPicker
                  isVisible={showColorPicker}
                  onClose={() => setShowColorPicker(false)}
                  onSelectColor={setCalendarColor}
                  selectedColor={calendarColor}
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row justify-end gap-3">
                <TouchableOpacity
                  onPress={onClose}
                  className="px-4 py-2.5 rounded-lg border border-gray-200"
                >
                  <Text className="text-gray-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSave}
                  className="bg-blue-500 px-4 py-2.5 rounded-lg"
                >
                  <Text className="text-white font-medium">
                    Create Calendar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
