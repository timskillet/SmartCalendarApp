import React from "react";
import {
  Modal,
  StyleSheet,
  Text,
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

interface ColorPickerProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectColor: (colorName: string, colorValue: string) => void;
  selectedColor: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  isVisible,
  onClose,
  onSelectColor,
  selectedColor,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-xl p-4">
              <Text className="text-lg font-semibold mb-4">Select Color</Text>
              <View className="flex-row flex-wrap justify-between">
                {colorOptions.map((color) => (
                  <TouchableOpacity
                    key={color.name}
                    onPress={() => {
                      onSelectColor(color.name, color.color);
                      onClose();
                    }}
                    className="items-center mb-4"
                    style={{ width: "30%" }}
                  >
                    <View
                      className="w-12 h-12 rounded-full mb-1"
                      style={[
                        { backgroundColor: color.color },
                        selectedColor === color.color && styles.selectedColor,
                      ]}
                    />
                    <Text className="text-gray-600">{color.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  selectedColor: {
    borderWidth: 3,
    borderColor: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
});
