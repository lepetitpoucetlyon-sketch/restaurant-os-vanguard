import { z } from 'zod';

export const UserSchema_v1 = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  certifiedDevices: z.array(z.string()).optional(),
  email: z.string().email().optional(),
});

export const UserSchema_v2 = z.object({
  id: z.string(),
  name: z.string(),
  role: z.string(),
  certifiedDevices: z.array(z.string()).optional(),
  email: z.string().email().optional(),
  schemaVersion: z.literal(2).default(2),
  updatedAt: z.string().datetime().optional(),
  preferences2FA: z.object({
    email_enabled: z.boolean().default(false),
    sms_enabled: z.boolean().default(false)
  }).optional(),
});

export type ValidatedUser_v1 = z.infer<typeof UserSchema_v1>;
export type ValidatedUser_v2 = z.infer<typeof UserSchema_v2>;
export type ValidatedUser = ValidatedUser_v2;
