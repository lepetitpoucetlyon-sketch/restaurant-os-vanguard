import { z } from 'zod';
import { TimestampSchema } from './primitives';

export const ModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
  schemaVersion: z.literal(2).default(2),
  updatedAt: TimestampSchema.optional(),
});

export type ValidatedModule = z.infer<typeof ModuleSchema>;
