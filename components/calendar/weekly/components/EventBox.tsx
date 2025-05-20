import { format } from "date-fns";
import { Text, TouchableOpacity, View } from "react-native";
import { Event } from "../../types/index";
interface EventBoxProps {
  event: Event;
  top: number;
  height: number;
  handleEventPress: (event: Event) => void;
}

export const EventBox: React.FC<EventBoxProps> = ({
  event,
  top,
  height,
  handleEventPress,
}) => {
  return (
    <TouchableOpacity
      key={`${event.title}-${event.startTime.toISOString()}`}
      onPress={() => handleEventPress(event)}
      style={{
        position: "absolute",
        left: 64,
        right: 0,
        top: top,
        height: height,
        zIndex: 100,
      }}
    >
      <View
        style={[
          {
            flex: 1,
            backgroundColor: `${event.color}20`,
            borderRadius: 8,
            borderLeftWidth: 3,
            borderLeftColor: event.color,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
            elevation: 5,
          },
        ]}
      >
        <View className="p-2">
          <Text className="text-sm font-medium">{event.title}</Text>
          <Text className="text-xs">
            {format(event.startTime, "HH:mm")} -{" "}
            {format(event.endTime, "HH:mm")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};
