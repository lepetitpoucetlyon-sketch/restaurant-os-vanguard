export type ReservationChannel = 'phone' | 'website' | 'thefork' | 'google' | 'walkin';
export type ReservationStatus = 'pending' | 'confirmed' | 'arrived' | 'seated' | 'finished' | 'cancelled' | 'noshow';

export interface ReservationSettings {
    minAdvanceHours: number;
    maxAdvanceDays: number;
    defaultDuration: number;
    overbookingAllowed: boolean;
    overbookingPercent?: number;
    autoConfirm: boolean;
    requireDeposit: boolean;
    depositAmount?: number;
    depositType?: 'fixed' | 'percent';
    emailReminderHours: number;
    smsReminderHours?: number;
    noShowDelayMinutes: number;
    noShowPenalty?: number;
    confirmationMessage: string;
    reminderMessage: string;
    cancellationMessage: string;
    cancellationPolicy: string;
    terms: string;
}
