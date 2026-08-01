/**
 * STAFF & HR TYPES - Leave Management, Compliance
 */

// ============================================
// LEAVE MANAGEMENT (CONGÉS)
// ============================================

import { 
    LeaveType as GlobalLeaveType,
    DayPeriod as GlobalDayPeriod,
    LeaveRequest as GlobalLeaveRequest,
    Shift as GlobalShift,
    ShiftLog as GlobalShiftLog,
    LeaveBalance as GlobalLeaveBalance
} from '@nexus/contracts';

export type LeaveType = GlobalLeaveType;
export type DayPeriod = GlobalDayPeriod;
export type LeaveRequest = GlobalLeaveRequest;
export type Shift = GlobalShift;
export type ShiftLog = GlobalShiftLog;
export type LeaveBalance = GlobalLeaveBalance;



// ============================================
// HR COMPLIANCE
// ============================================

export interface ComplianceAlert {
    id: string;
    userId: string;
    userName: string;
    type: 'daily_rest' | 'weekly_rest' | 'max_daily_hours' | 'mandatory_break';
    severity: 'info' | 'warning' | 'blocking';
    message: string;
    affectedShiftId?: string;
}

export interface StaffPerformance {
    userId: string;
    userName: string;
    totalSalesInCents: number;
    totalSalesInMicrounits?: number; // µ = cents × 10 000
    totalSales: number; // UI compatibility
    orderCount: number;
    averageCheckInCents: number;
    averageCheckInMicrounits?: number;
    averageCheck: number; // UI compatibility
    upsellRate: number; // % of orders with modifiers/drinks
    kudos: number;
}

// ============================================
// GRADE X BLUEPRINTS
// ============================================

/** 
 * 📄 PayrollCalculation - Blueprint Grade X 
 * TODO: À lier au module de comptabilité sociale
 */
export interface PayrollCalculation {
    id: string;
    staffId: string;
    period: { start: string; end: string };
    grossAmountCents: number;
    netAmountCents: number;
    taxAmountCents: number;
    status: 'draft' | 'published' | 'on-going' | 'completed';
    createdAt?: string;
    updatedAt?: string;
    fiscalSeal?: unknown;
    metadata?: import('@/shared/nexus-contract').SovereignData;
}


/** 
 * 📊 ShiftStats - Blueprint Grade X 
 * TODO: À alimenter via le moteur d'analyse de performance
 */
/** 
 * 🔍 AuditLog - Grade X
 */
export interface AuditLog {
    id: string;
    userId?: string;
    userName: string;
    action: string;
    timestamp: number | string | Date;
    metadata?: import('@/shared/nexus-contract').SovereignData;
}


export interface ShiftStats {
    shiftId: string;
    durationMinutes: number;
    salesGeneratedCents: number;
    laborCostCents: number;
    efficiencyRatio: number; // ex: 0.85 pour 85%
    coversServed: number;
}
