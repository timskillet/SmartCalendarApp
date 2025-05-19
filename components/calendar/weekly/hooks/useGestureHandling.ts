import { format } from "date-fns";
import {
    Gesture,
    Haptics,
} from "react-native-gesture-handler";
import { SCREEN_WIDTH } from "../../../constants";
import { HOUR_HEIGHT } from "../constants";


const longPressGesture = Gesture.LongPress()
    .minDuration(400)
    .onStart((event) => {
        // Check if we're touching an existing event
        const touchY = event.absoluteY - gridOffset.y + scrollY.value;
        const touchX = event.absoluteX;

        // Only create new event if we're not touching an existing event
        const isTouchingEvent = events.some((event) => {
        const { top, height } = calculateEventPosition(
            event.startTime,
            event.endTime
        );
        const eventLeft = 64; // Left position of events
        const eventRight = SCREEN_WIDTH; // Right edge of screen

        return (
            touchY >= top &&
            touchY <= top + height &&
            touchX >= eventLeft &&
            touchX <= eventRight
        );
        });

        if (!isTouchingEvent) {
        setIsCreatingEvent(true);
        const relativeY = touchY;
        const hour = Math.floor(relativeY / HOUR_HEIGHT);

        if (hour >= 0 && hour < 24) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Position box centered on touch point
            const snapIncrement = HOUR_HEIGHT / 4;
            const snappedY =
            Math.round(relativeY / snapIncrement) * snapIncrement;
            setSnappedPosition(snappedY);
            translateY.value = snappedY;

            // Update time while dragging
            const hour = Math.floor(snappedY / HOUR_HEIGHT);
            const minutes =
            Math.round((snappedY % HOUR_HEIGHT) / snapIncrement) * 15;
            const selectedTime = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate(),
            hour,
            minutes
            );
            setDraggableBoxTime(format(selectedTime, "HH:mm"));
            setEventStartTime(selectedTime);
        }
        }
    })
    .onTouchesUp(() => {
        if (isCreatingEvent) {
        const hour = Math.floor(snappedPosition / HOUR_HEIGHT);
        if (hour >= 0 && hour < 24) {
            setIsEventModalVisible(true);
            setIsCreatingEvent(false);
        }
        }
    })
    .runOnJS(true);

const dragGesture = Gesture.Pan()
.onUpdate((event) => {
    if (!isCreatingEvent) return;

    const relativeY = event.absoluteY - gridOffset.y + scrollY.value;
    const snapIncrement = HOUR_HEIGHT / 4;
    const snappedY = Math.round(relativeY / snapIncrement) * snapIncrement;
    translateY.value = snappedY;

    // Auto-scroll when near edges
    if (scrollViewRef.current) {
    const touchPosition = event.absoluteY - gridOffset.y;
    if (touchPosition < SCROLL_THRESHOLD) {
        scrollViewRef.current.scrollTo({
        y: Math.max(0, scrollY.value - 5),
        animated: false,
        });
    } else if (
        touchPosition >
        SCREEN_WIDTH - gridOffset.x - SCROLL_THRESHOLD
    ) {
        scrollViewRef.current.scrollTo({
        y: scrollY.value + 5,
        animated: false,
        });
    }
    }

    // Update time while dragging
    const hour = Math.floor(snappedY / HOUR_HEIGHT);
    const minutes = Math.round((snappedY % HOUR_HEIGHT) / snapIncrement) * 15;
    const selectedTime = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
    hour,
    minutes
    );
    setDraggableBoxTime(format(selectedTime, "HH:mm"));
    setEventStartTime(selectedTime);
    setSnappedPosition(snappedY);
})
.onEnd((event) => {
    if (isCreatingEvent) {
    const hour = Math.floor(snappedPosition / HOUR_HEIGHT);
    if (hour >= 0 && hour < 24) {
        setIsEventModalVisible(true);
        setIsCreatingEvent(false);
    }
    }
})
.runOnJS(true);

export const composedGesture = Gesture.Simultaneous(longPressGesture, dragGesture);

export const handleScroll = (scrollY: any, event: any) => {
    scrollY.value = event.nativeEvent.contentOffset.y;
  };