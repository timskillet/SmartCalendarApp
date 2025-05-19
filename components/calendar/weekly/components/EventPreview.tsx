import { Text, View } from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { HOUR_HEIGHT } from "../constants";

interface EventPreviewProps {
  draggableBoxTime: string;
  translateY: SharedValue<number>;
}

export const EventPreview = ({ draggableBoxTime }: EventPreviewProps) => {
  const translateY = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    height: HOUR_HEIGHT,
  }));

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          left: 64,
          right: 0,
          height: HOUR_HEIGHT / 2,
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          borderRadius: 8,
          borderLeftWidth: 3,
          borderLeftColor: "#3B82F6",
          zIndex: 100,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 4,
          elevation: 5,
        },
        animatedStyle,
      ]}
    >
      <View className="p-2">
        <Text className="text-sm font-medium text-blue-800">New Event</Text>
        <Text className="text-xs text-blue-600">{draggableBoxTime}</Text>
      </View>
    </Animated.View>
  );
};
