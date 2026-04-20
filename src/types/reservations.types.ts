/**
 * RESERVATIONS & CRM TYPES
 */

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'no-show' | 'cancelled';

export interface Customer {
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
    createdAt: string;
}

export interface Reservation {
    id: string;
    customerId?: string;
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
    source?: 'phone' | 'website' | 'walk-in' | 'google' | 'thefork';
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
    customers: string[]; // Customer IDs
}
