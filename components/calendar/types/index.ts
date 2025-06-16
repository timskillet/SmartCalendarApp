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
    type: string;
    startTime: Date;
    endTime: Date;
    completed: boolean;
    color: string;
    description?: string;
    location?: string;
    invitees?: string[];
    repeat: boolean;
    position: number;
    createdAt: Date;
    updatedAt?: Date;
}