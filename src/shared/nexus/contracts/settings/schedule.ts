export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
    day: DayOfWeek;
    isOpen: boolean;
    lunchOpen?: string;
    lunchClose?: string;
    dinnerOpen?: string;
    dinnerClose?: string;
    lastKitchenOrder?: string;
}

export interface ServiceSettings {
    avgMealDurationLunch: number;
    avgMealDurationDinner: number;
    lastArrivalBeforeClose: number;
}

export interface ReservationSlotSettings {
    slotDuration: number;
    intervalBetweenSlots: number;
    maxCoversPerSlot: number;
}

export interface ClosedPeriod {
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    isAnnual: boolean;
}
