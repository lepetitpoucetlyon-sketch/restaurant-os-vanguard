import { z } from 'zod';
import { UUIDSchema, sanitized } from './primitives';

export const TenantIdSchema = sanitized(1, 50);
export const RolePermissionsSchema = z.array(z.string()).default([]);

export const PageSettingsSchema = z.record(z.string(), z.record(z.string(), z.any()));

export const AgentSessionsSchema = z.record(z.string(), z.object({
    id: UUIDSchema,
    lastActive: z.number(),
    context: z.any()
}));
