/**
 * RESERVATIONS & CRM TYPES
 */

export type ReservationStatus = 'pending' | 'confirmed' | 'seated' | 'completed' | 'no-show' | 'cancelled';


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

