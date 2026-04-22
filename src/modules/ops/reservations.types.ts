/**
 * RESERVATIONS & CRM TYPES
 */

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'no-show' | 'cancelled';

export interface CRM {
    id: string;
    firstName: string;
    lastName: string;
    name?: string; // Full name alias used in some views
    email?: string;
    phone: string;
    birthDate?: string;
    segment?: string; // CRM Segment (e.g., 'vip', 'regular', 'new')
    preferences: string[];
    tags: string[];
    notes?: string;
    visitCount: number;
    totalSpentInCents: number;
    totalSpent: number;
    averageSpendInCents: number;
    lastVisit?: string;
    lastVisitDate?: string; // Grade X Alias for lastVisit
    createdAt: string;
}

export interface Reservation {
    id: string;
    crmId?: string;
    crmName: string;
    customerName: string;

    email?: string;
    phone: string;
    date: string;
    time: string;
    covers: number;
    tableId: string;
    status: ReservationStatus;
    tags: string[];
    notes?: string;
    isVip?: boolean;
    visitCount?: number;
    duration: number;
    source?: 'phone' | 'website' | 'walk-in' | 'google' | 'thefork' | 'instagram' | 'facebook' | 'tripadvisor' | 'direct';
    name?: string; // fallback alias
    guests?: number; // alias for covers
    createdAt: string;
    updatedAt: string;
}

// GroupEvent moved to groups.types.ts
export interface CRMGroup {
    id: string;
    name: string;
    description?: string;
    crms: string[]; // CRM IDs
}
