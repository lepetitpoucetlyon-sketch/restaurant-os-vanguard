import { z } from 'zod';
export const FloorPlanSchema = z.object({ id: z.string().uuid() });
export type FloorPlan = z.infer<typeof FloorPlanSchema>;
