export interface Calendar {
    id: string;
    name: string;
    color: string;
    isVisible: boolean;
    userId: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Event {
    id: string;
    calendarId: string;
    title: string;
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
    isTask: boolean;
    completed: boolean;
    assignedTo?: string;
    isAutoScheduled: boolean;
    createdAt: Date;
    updatedAt?: Date;
    metadata?: Record<string, any>;
}