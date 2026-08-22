import { Microunits } from '@/shared/schemas/primitives';

// ─── ABONNEMENTS ──────────────────────────────────────────────────────────────

export type MembershipStatus = 'active' | 'frozen' | 'expired' | 'cancelled';
export type MembershipPlan = 'basic' | 'premium' | 'crossfit';

export interface IMembership {
  id: string;
  memberId: string;
  memberName: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  startedAt: string;      // ISO 8601
  expiresAt: string;      // ISO 8601
  autoRenew: boolean;
  monthlyFeeInMicrounits: Microunits;
}

export interface IMembershipChurnReport {
  periodStart: string;
  periodEnd: string;
  activeCount: number;
  frozenCount: number;
  expiredCount: number;
  churnedCount: number;
  churnRatePct: number;
  monthlyRecurringRevenueInMicrounits: Microunits;
}

// ─── COURS COLLECTIFS ─────────────────────────────────────────────────────────

export interface IClassSession {
  id: string;
  className: string;
  coachName: string;
  startsAt: string;       // ISO 8601
  durationMinutes: number;
  capacity: number;
  bookedCount: number;
}
