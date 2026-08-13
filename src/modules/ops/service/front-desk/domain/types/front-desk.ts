export type GuestStatus = 'expected' | 'checked_in' | 'checked_out' | 'no_show' | 'cancelled';

export interface GuestRecord {
  id: string;
  tenantId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  /** Room, suite, unit, or space identifier */
  unitId?: string;
  unitName?: string;
  checkInAt: string;
  checkOutAt?: string;
  expectedCheckOutAt: string;
  status: GuestStatus;
  adults: number;
  children?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CheckInInput {
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  unitId?: string;
  unitName?: string;
  checkInAt: string;
  expectedCheckOutAt: string;
  adults: number;
  children?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}
