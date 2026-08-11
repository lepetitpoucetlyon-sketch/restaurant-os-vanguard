export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DaySchedule {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    day: DayOfWeek;
    isOpen: boolean;
    lunchOpen?: string;
    lunchClose?: string;
    dinnerOpen?: string;
    dinnerClose?: string;
    lastKitchenOrder?: string;
}

export interface ServiceSettings {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    avgMealDurationLunch: number;
    avgMealDurationDinner: number;
    lastArrivalBeforeClose: number;
}

export interface ReservationSlotSettings {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    slotDuration: number;
    intervalBetweenSlots: number;
    maxCoversPerSlot: number;
}

export interface ClosedPeriod {
    [key: string]: import('@/shared/nexus-contract').SovereignField | undefined;
    id: string;
    startDate: string;
    endDate: string;
    reason: string;
    isAnnual: boolean;
}
