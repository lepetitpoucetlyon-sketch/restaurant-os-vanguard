/* eslint-disable no-restricted-imports -- tolerated structural inversion */
/**
 * 🏛️ SHARED SCHEMAS BARREL
 * N'exporte que les primitives transversales + les types tiers utilisés par
 * l'infrastructure partagée (handlers, vault, API routes).
 * Pour les types métier, importer directement depuis @/modules/<pilier>.
 *
 * NB : les `export * from '@/modules/X'` larges sont interdits ici — chaque
 * pilier peut re-exporter des noms identiques, ce qui provoque des TS2308.
 */

// ── Primitives & UI transversaux ──────────────────────────────────────────────
export * from './primitives';
export * from './ui';

// ── Intelligence (support tickets) — utilisé par handlers + API routes MCC ───
export {
    SupportTicketSchema, type SupportTicket,
    SupportDraftSchema,  type SupportDraft,
    SupportTicketStatusSchema, type SupportTicketStatus,
    SupportTicketSourceSchema, type SupportTicketSource,
} from '@/modules/intelligence/domain/schemas/supportTicket';

// ── Compliance (audit, PII) — utilisé par AuditService + PiiVault ────────────
export {
    AuditEventSchema,
    AuditSeveritySchema,
    AuditModuleSchema,
    type AuditEvent,
    type AuditSeverity,
    type AuditModule,
    type PiiFields,
    type PiiRecord
} from '@/modules/compliance';
