import { z } from 'zod';

export const ApiVersion = z.enum(['v1', 'v2']);

export const StandardResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => z.object({
  success: z.boolean(),
  data: dataSchema.optional(),
  error: z.string().optional(),
  metadata: z.object({
    version: ApiVersion,
    timestamp: z.string(),
    latency: z.number().optional()
  }).optional()
});

export const OrderResponseSchema = StandardResponseSchema(z.object({
  id: z.string(),
  totalInCents: z.number(),
  status: z.string()
}));

export const ProductResponseSchema = StandardResponseSchema(z.object({
  id: z.string(),
  name: z.string(),
  priceInCents: z.number()
}));
