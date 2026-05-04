import { z } from 'zod';

export const ModuleSchema_v1 = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const ModuleSchema_v2 = z.object({
  id: z.string(),
  name: z.string(),
  isActive: z.boolean(),
  config: z.record(z.string(), z.unknown()).optional(),
  schemaVersion: z.literal(2).default(2),
  updatedAt: z.string().datetime().optional(),
});

export type ValidatedModule_v1 = z.infer<typeof ModuleSchema_v1>;
export type ValidatedModule_v2 = z.infer<typeof ModuleSchema_v2>;
export type ValidatedModule = ValidatedModule_v2;
