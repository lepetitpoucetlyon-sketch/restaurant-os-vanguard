export type ReservationChannel = 'phone' | 'website' | 'thefork' | 'google' | 'walkin';
export interface ReservationSlotsConfig {
    slotDuration: number;
    intervalBetweenSlots: number;
    maxCoversPerSlot: number;
    maxReservationsPerSlot?: number;
    [key: string]: unknown;
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
    // ── Empreinte bancaire (card imprint) ───────────────────────────────────
    cardImprintEnabled?: boolean;
    cardImprintCondition?: 'always' | 'group' | 'amount' | 'privatization';
    cardImprintGroupMin?: number;    // trigger when covers >= this
    cardImprintAmountMin?: number;   // trigger when deposit amount >= this (€)
    cardImprintPenaltyAmount?: number; // amount charged on no-show (€)
    cardImprintCancelHours?: number; // free cancellation window (hours before)
    // ── Notifications gérant ────────────────────────────────────────────────
    mgrNotifNewReservation?: boolean;
    mgrNotifCancellation?: boolean;
    mgrNotifNoShow?: boolean;
    mgrNotifModification?: boolean;
    mgrNotifChannels?: Array<'email' | 'sms' | 'push'>;
    mgrNotifEmail?: string;
    mgrNotifPhone?: string;
    // ── Notifications client ────────────────────────────────────────────────
    clientNotifConfirmation?: boolean;
    clientNotifReminder?: boolean;
    clientReminderHours?: number;
    clientNotifCancellation?: boolean;
    clientNotifChannels?: Array<'email' | 'sms'>;
    confirmationMessage: string;
    reminderMessage: string;
    cancellationMessage: string;
    cancellationPolicy: string;
    terms: string;
    [key: string]: unknown;
}
