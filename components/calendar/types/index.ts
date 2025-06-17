export interface Calendar {
    id: string;
    user_id: string;
    name: string;
    color: string;
    is_primary: boolean;
    createdAt: Date;
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