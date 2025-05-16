import TimePickerModal from "@/components/calendar/TimePicker";
import React, { useState } from "react";
import { Button, SafeAreaView, StyleSheet, Text, View } from "react-native";

const ScheduleScreen: React.FC = () => {
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const handleTimeSelected = (time: Date) => {
    setSelectedTime(time);
  };

  return (
    <SafeAreaView className="flex-1">
      <View style={styles.container}>
        <Button title="Pick Time" onPress={() => setModalVisible(true)} />
        <Text style={styles.timeText}>
          Selected Time:{" "}
          {selectedTime?.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }) || "None"}
        </Text>

        <TimePickerModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onTimeSelected={handleTimeSelected}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  timeText: {
    marginTop: 20,
    fontSize: 16,
  },
});

export default ScheduleScreen;
