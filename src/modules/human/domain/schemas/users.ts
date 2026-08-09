import { z } from 'zod';
import { SanitizedStringSchema, TimestampSchema, UUIDSchema, StatusSchema } from '@/shared/schemas/primitives';

export const UserPermissionsSchema = z.record(z.string(), z.array(z.string())).and(z.object({
    level: z.number().int().min(0).max(10),
    scope: z.array(z.string()),
    isSovereignAdmin: z.boolean().optional(),
    allowedModules: z.array(z.string()),
    restrictedPillars: z.array(z.string()).optional(),
}));

export const UserSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('user').default('user'),
  tenantId:          UUIDSchema.optional(),
  name:              z.string().min(1).max(100).pipe(SanitizedStringSchema),
  email:             z.string().email('Email invalide').toLowerCase().optional(),
  role:              z.string(),
  status:            StatusSchema.default('active'),
  pin:               z.string().regex(/^[0-9]{4}$/, 'Le PIN doit être composé de 4 chiffres').optional(),
  pinHash:           z.string().optional(),
  pinSalt:           z.string().optional(),
  avatar:            z.string().url().optional().nullable(),
  lastActive:        TimestampSchema.optional(),
  performanceScore:  z.number().min(0).max(100).optional(),
  accessLevel:       z.number().int().min(0).max(10).optional(),
  hourlyRateInMicrounits: z.number().int().min(0).optional(),
  permissions:       UserPermissionsSchema.optional(),
  schemaVersion:     z.literal(2).default(2),
  createdAt:         TimestampSchema.optional(),
  updatedAt:         TimestampSchema.default(() => Date.now()),
}).catchall(z.any());

export type User = z.infer<typeof UserSchema>;
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

export const UserPatchSchema = UserSchema.partial().omit({ id: true, tenantId: true });
export type UserPatch = z.infer<typeof UserPatchSchema>;
