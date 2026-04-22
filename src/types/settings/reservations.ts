export type ReservationChannel = 'phone' | 'website' | 'thefork' | 'google' | 'walkin';
export interface ReservationSlotsConfig {
    slotDuration: number;
    intervalBetweenSlots: number;
    maxCoversPerSlot: number;
    maxReservationsPerSlot?: number;
}

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
