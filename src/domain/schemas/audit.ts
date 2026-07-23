import { z } from 'zod';

/**
 * AuditEvent — append-only, hash-chained event log (NF525-grade).
 * Sensitive collections (finance, staff, settings, RBAC) emit an AuditEvent
 * on every write intercepted by NexusInterceptor.
 *
 * PII is excluded from payloads — use subjectId to link to PiiVault (C1.2).
 */

export const AuditActionSchema = z.enum([
    'create',
    'update',
    'delete',
    'override',      // PIN override (PinModal)
    'elevation',     // threshold elevation (C0.4)
    'sod_violation', // SoD blocked attempt
    'policy_change', // RBAC / policy mutation
    'login',
    'logout',
    'export',
]);
export type AuditAction = z.infer<typeof AuditActionSchema>;

export const AUDITED_COLLECTIONS = [
    'journalEntries',
    'fiscalSeals',
    'fiscalLedger',
    'staff',
    'settings',
    'roles',
    'policies',
    'orders',
    'cashSessions',
    'piiVault',
] as const;

export type AuditedCollection = (typeof AUDITED_COLLECTIONS)[number];

export const AuditEventSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    actorId: z.string(),
    actorRole: z.string(),
    action: AuditActionSchema,
    collection: z.string(),
    entityId: z.string().optional(),
    subjectId: z.string().optional(),
    before: z.record(z.string(), z.unknown()).optional(),
    after: z.record(z.string(), z.unknown()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    ts: z.number(),
    hash: z.string(),
    previousHash: z.string(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
