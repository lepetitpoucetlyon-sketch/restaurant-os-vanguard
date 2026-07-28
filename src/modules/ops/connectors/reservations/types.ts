export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'seated' | 'completed' | 'noshow';

export interface Reservation {
    id: string;
    tenantId: string;
    guestName: string;
    guestEmail?: string;
    guestPhone?: string;
    partySize: number;
    date: string;           // YYYY-MM-DD
    time: string;           // HH:mm
    tableId?: string;
    status: ReservationStatus;
    source: string;         // provider id ('zenchef', 'thefork', 'widget', ...)
    notes?: string;
    externalId?: string;
}

export interface IReservationProvider {
    readonly id: string;
    listUpcoming(tenantId: string): Promise<Reservation[]>;
    onCreate(webhook: unknown): Reservation;
    confirmReservation(id: string): Promise<void>;
    cancelReservation(id: string, reason?: string): Promise<void>;
    /** Sync full state from provider — returns nb of records synced. */
    syncAll(tenantId: string): Promise<number>;
    /** Vérifie la signature HMAC du webhook entrant. Retourne false → 401. */
    verifySignature?(rawBody: string, headers: Headers): boolean;
}
