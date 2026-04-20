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
  timestamp: z.date().or(z.string()),
  
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

  metadata: z.record(z.any()).optional()
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
  period: string;
}

export interface ShiftStats {
  totalHours: number;
  overtime: number;
  breakTime: number;
  punctualityScore: number;
  period: string;
}
