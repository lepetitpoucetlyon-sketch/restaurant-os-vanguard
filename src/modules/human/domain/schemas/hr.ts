import { z } from 'zod';

/**
 * 🛂 HR & Payroll Schemas - Restaurant OS
 * Industrial-grade validation for shift and employee activity.
 */

export const ShiftEntryTypeSchema = z.enum([
  'CLOCK_IN',
  'CLOCK_OUT',
  'BREAK_START',
  'BREAK_END'
]);

export const ShiftEntrySchema = z.object({
  id: z.string().optional(),
  userId: z.string().min(1, "L'identifiant de l'employé est requis"),
  userName: z.string().min(1, "Le nom de l'employé est requis"),
  type: ShiftEntryTypeSchema,
  timestamp: z.string(),
  
  // Location & Context
  location: z.object({
    terminalId: z.string(),
    coords: z.object({
      lat: z.number().optional(),
      lng: z.number().optional()
    }).optional()
  }),

  // Fiscal/Industrial Sealing
  fiscalSeal: z.object({
    hash: z.string(),
    previousHash: z.string(),
    sequence: z.number(),
    signedPayload: z.string()
  }).optional(),

  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
});

export type ShiftEntry = z.infer<typeof ShiftEntrySchema>;

/**
 * Payroll Aggregation Schema
 */
export const PayrollPeriodSchema = z.object({
  employeeId: z.string(),
  month: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  totalHours: z.number().positive(),
  hourlyRate: z.number().positive(),
  grossAmount: z.number(),
  netAmount: z.number(),
  chargesSociales: z.number()
});

export interface PayrollCalculation {
  totalHours: number;
  hourlyRate: number;
  grossAmount: number;
  netAmount: number;
  chargesSociales: number;
  /** @see taux indicatifs 2024 — utiliser DSN réelle en production */
  employerCost: number;
  period: string;
}

export interface ShiftStats {
  totalHours: number;
  overtime: number;
  breakTime: number;
  punctualityScore: number;
  period: string;
}

export type TipPoolingMethod = 'equal' | 'weighted-hours' | 'weighted-covers' | 'custom';

export interface ITipParticipant {
  employeeId: string;
  name: string;
  hoursWorked?: number;
  coversServed?: number;
  sharePercent: number;
  amountInMicrounits: number;
}

export interface ITipPool {
  id: string;
  date: string;
  totalTipsInMicrounits: number;
  method: TipPoolingMethod;
  participants: ITipParticipant[];
}

