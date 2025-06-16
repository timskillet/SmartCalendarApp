export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  repeat: boolean;
  location: string;
  color: string;
  timezone: string;
  metadata: Record<string, any>;
  calendar_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
} 