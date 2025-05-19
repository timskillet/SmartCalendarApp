export interface Event {
    id: string;
    title?: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    position: number;
    color: string;
    isAllDay: boolean;
    location?: string;
    attendees?: string[];
    recurring: boolean;
    timezone?: string;
    metadata?: Record<string, any>;
}