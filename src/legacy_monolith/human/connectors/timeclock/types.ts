export type ClockEventType = 'clock_in' | 'clock_out' | 'break_start' | 'break_end';

export interface ClockEntry {
    id: string;
    employeeId: string;
    type: ClockEventType;
    timestamp: string;   // ISO 8601
    source: string;      // 'manual' | 'nfc' | 'qrcode' | 'kelio' | 'skello' | ...
    metadata?: Record<string, unknown>;
}

export interface ITimeclockProvider {
    readonly id: string;
    fetchEntries(tenantId: string, date: Date): Promise<ClockEntry[]>;
    onWebhook(payload: unknown): ClockEntry;
}
