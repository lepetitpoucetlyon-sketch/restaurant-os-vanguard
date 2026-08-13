import { z } from 'zod';

export const ShiftPlanSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  employeeId: z.string(),
  role: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format YYYY-MM-DD requis'),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Format HH:MM requis'),
  station: z.string().optional(),
  notes: z.string().max(500).optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type ShiftPlan = z.infer<typeof ShiftPlanSchema>;

export const ShiftPlanInputSchema = ShiftPlanSchema.omit({ id: true, tenantId: true, createdAt: true, updatedAt: true });
export type ShiftPlanInput = z.infer<typeof ShiftPlanInputSchema>;

export const shiftPlansPath = (tenantId: string) => `tenants/${tenantId}/shiftPlans`;
