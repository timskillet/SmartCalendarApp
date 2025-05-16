import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import { Button, Modal, Platform, StyleSheet, View } from "react-native";

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onTimeSelected: (time: Date) => void;
}

const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onClose,
  onTimeSelected,
}) => {
  const [time, setTime] = useState<Date>(new Date());

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      onClose();
      if (event.type === "set" && selectedDate) {
        setTime(selectedDate);
        onTimeSelected(selectedDate);
      }
    } else {
      if (selectedDate) {
        setTime(selectedDate);
      }
    }
  };

  const handleConfirmIOS = () => {
    onTimeSelected(time);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <DateTimePicker
            value={time}
            mode="time"
            display="spinner"
            onChange={handleChange}
          />
          {Platform.OS === "ios" && (
            <Button title="Confirm" onPress={handleConfirmIOS} />
          )}
          <Button title="Cancel" onPress={onClose} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#00000099",
  },
  modalContent: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 10,
    padding: 20,
  },
});

export default TimePickerModal;
