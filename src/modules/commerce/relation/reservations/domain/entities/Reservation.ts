export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW' | 'SEATED' | 'COMPLETED';

export interface IReservation {
  id: string;
  tenantId: string;
  source: 'WEB' | 'PHONE' | 'THEFORK' | 'GOOGLE_RESERVE' | 'IN_PERSON';
  
  // Customer Info
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  
  // Booking Details
  partySize: number;
  startTime: Date;
  durationMinutes: number;
  notes?: string;
  
  status: ReservationStatus;
  
  createdAt: Date;
  updatedAt: Date;
}
