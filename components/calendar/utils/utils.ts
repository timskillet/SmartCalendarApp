import {
  addHours,
  eachDayOfInterval,
  endOfWeek,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { HOUR_HEIGHT } from '../weekly/constants';

/* CALENDAR DATA */
export const getDays = (currentWeek: Date) => eachDayOfInterval({
    start: startOfWeek(currentWeek),
    end: endOfWeek(currentWeek),
  });

export const getHours = (selectedDate: Date) => Array.from({ length: 24 }, (_, i) =>
  addHours(startOfDay(selectedDate), i)
);

/* EVENTS */
export const calculateEventPosition = (startTime: Date, endTime: Date) => {
  const startHour = startTime.getHours();
  const startMinutes = startTime.getMinutes();
  const endHour = endTime.getHours();
  const endMinutes = endTime.getMinutes();

  // Calculate position based on start time
  const startPosition = (startHour + startMinutes / 60) * HOUR_HEIGHT;

  // Calculate height based on duration
  const durationHours = endHour - startHour + (endMinutes - startMinutes) / 60;
  const height = Math.max(durationHours * HOUR_HEIGHT, HOUR_HEIGHT / 2); // Minimum height of 30 minutes

  return { top: startPosition, height };
};