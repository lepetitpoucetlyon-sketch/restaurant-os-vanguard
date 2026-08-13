import { z } from 'zod';

export const ExchangeScopeSchema = z.enum([
  'catalog',
  'pricing',
  'stock',
  'orders',
  'delivery_schedule',
]);

export type ExchangeScope = z.infer<typeof ExchangeScopeSchema>;

export const ExchangeGrantSchema = z.object({
  id: z.string().min(1),
  publisherId: z.string().min(1),
  granteeId: z.union([z.string().min(1), z.literal('*')]),
  scopes: z.array(ExchangeScopeSchema).min(1),
  active: z.boolean(),
  createdAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  createdBy: z.string().min(1),
  revokedAt: z.string().datetime().optional(),
  revokedBy: z.string().min(1).optional(),
});

export type ExchangeGrant = z.infer<typeof ExchangeGrantSchema>;

export const ExchangePublishedDataSchema = z.object({
  scope: ExchangeScopeSchema,
  publisherId: z.string().min(1),
  publishedAt: z.string().datetime(),
  version: z.number().int().positive(),
  data: z.record(z.unknown()),
  checksum: z.string().optional(),
});

export type ExchangePublishedData = z.infer<typeof ExchangePublishedDataSchema>;
