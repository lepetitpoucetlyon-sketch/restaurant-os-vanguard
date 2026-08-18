export type ShiftType = "lunch" | "evening" | "double";

export interface Shift {
    id: string;
    userId: string;
    date: Date;
    startTime: string;
    endTime: string;
    zoneId?: string;
    type: ShiftType;
    status: "published" | "draft";
}
