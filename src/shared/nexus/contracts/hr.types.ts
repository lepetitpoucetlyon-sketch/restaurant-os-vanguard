import { SovereignNode, SovereignData, SovereignField } from "../../nexus-contract";

/**
 * 👥 HUMAN RESOURCES DOMAIN - Shared Kernel
 * Version Grade X - Sovereign Alignment
 */

export type LeaveType = 'paid' | 'unpaid' | 'sick' | 'other' | 'paid_leave' | 'maternity' | 'paternity' | 'rtt' | 'sick_leave' | 'unpaid_leave';
export type DayPeriod = 'full_day' | 'morning' | 'afternoon';


export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'draft' | 'submitted' | 'pending_approval' | 'cancelled' | 'in_progress' | 'completed';

export type RejectionReason =
    | 'team_coverage'       // Couverture équipe insuffisante
    | 'blackout_period'     // Période bloquée
    | 'insufficient_notice' // Délai trop court
    | 'balance_insufficient' // Solde insuffisant
    | 'documentation'       // Justificatif manquant
    | 'business_needs'      // Contraintes activité
    | 'other';

export interface LeaveRequest extends SovereignNode {
    userId: string;
    userName: string;
    type: LeaveType;
    startDate: string;
    endDate: string;
    startPeriod?: DayPeriod;
    endPeriod?: DayPeriod;
    status: LeaveRequestStatus;
    reason?: string;
    approvedBy?: string;
    approvedAt?: string;
    submittedAt?: string;
    workingDays: number;
    rejectionReason?: RejectionReason;
    teamCoverage?: {
        percent: number;
        compliant: boolean;
    };
    employeeName?: string; // Legacy alias for UI components
}

export const LEAVE_STATUS_CONFIG: Record<LeaveRequestStatus, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'amber' },
    pending_approval: { label: 'En attente', color: 'amber' },
    approved: { label: 'Approuvé', color: 'emerald' },
    rejected: { label: 'Refusé', color: 'rose' },
    draft: { label: 'Brouillon', color: 'gray' },
    submitted: { label: 'Soumis', color: 'blue' },
    cancelled: { label: 'Annulé', color: 'gray' },
    in_progress: { label: 'En cours', color: 'blue' },
    completed: { label: 'Terminé', color: 'emerald' },
};

export interface LeaveBalance {
    userId: string;
    type: LeaveType;
    entitled: number;
    acquired: number;
    taken: number;
    pending: number;
    remaining: number;
    carriedOver: number;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
    paid: 'Congés Payés',
    paid_leave: 'Congés Payés',
    unpaid: 'Sans Solde',
    unpaid_leave: 'Sans Solde',
    sick: 'Maladie',
    sick_leave: 'Maladie',
    rtt: 'RTT',
    maternity: 'Maternité',
    paternity: 'Paternité',
    other: 'Autre',
};

export const LEAVE_TYPE_ICONS: Record<LeaveType, string> = {
    paid: '🏖️',
    paid_leave: '🏖️',
    unpaid: '💸',
    unpaid_leave: '💸',
    sick: '🤒',
    sick_leave: '🤒',
    rtt: '🕒',
    maternity: '🍼',
    paternity: '🍼',
    other: '📁',
};

/**
 * 🕒 SHIFT CONTRACT
 * Enforces SovereignNode compliance for scheduling.
 */
export interface Shift extends SovereignNode {
    userId: string;
    userName: string;
    date: string; // Grade X Suture: Required for calendar grouping
    startTime: string;
    endTime: string;
    position: string;
    status: 'scheduled' | 'published' | 'active' | 'completed' | 'cancelled';
    isBreak?: boolean;
    fiscalSeal?: {
        hash: string;
        timestamp: string;
    };
    metadata?: Record<string, SovereignField>;
}

export interface ShiftLog extends SovereignNode {
    shiftId: string;
    action: string;
    performedBy: string;
    timestamp: string;
    metadata?: SovereignData;
}

export interface HRMetrics {
    totalEmployees: number;
    activeShifts: number;
    openPositions: number;
    turnoverRate: number;
    laborCostInCents: number;
    laborCostInMicrounits?: number; // µ = cents × 10 000
}
