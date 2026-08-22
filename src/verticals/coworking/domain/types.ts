import { Microunits } from '@/shared/schemas/primitives';

// ─── BUREAUX & SALLES ─────────────────────────────────────────────────────────

export type DeskType = 'hot-desk' | 'fixed-desk' | 'private-office' | 'meeting-room';
export type BookingStatus = 'confirmed' | 'checked-in' | 'checked-out' | 'no-show' | 'cancelled';

export interface IDeskBooking {
  id: string;
  deskId: string;
  deskLabel: string;
  deskType: DeskType;
  memberId: string;
  memberName: string;
  startsAt: string;      // ISO 8601
  endsAt: string;        // ISO 8601
  status: BookingStatus;
}

export interface IOccupancyReport {
  periodStart: string;
  periodEnd: string;
  totalBookings: number;
  checkedInCount: number;
  noShowCount: number;
  occupancyRatePct: number;
}

// ─── FORFAITS ─────────────────────────────────────────────────────────────────

export type PassPlanKind = 'day-pass' | 'monthly' | 'annual' | 'enterprise';

export interface IPassPlan {
  id: string;
  memberId: string;
  memberName: string;
  kind: PassPlanKind;
  status: 'active' | 'expired' | 'cancelled';
  startedAt: string;
  expiresAt: string;
  priceInMicrounits: Microunits;
}
