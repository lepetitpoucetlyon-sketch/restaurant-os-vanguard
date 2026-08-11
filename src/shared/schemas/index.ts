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

// ── Support tickets — utilisé par handlers + API routes MCC ───
export {
    SupportTicketSchema, SupportDraftSchema, SupportTicketStatusSchema,
    type SupportTicket, type SupportDraft, type SupportTicketStatus,
} from '@nexus/contracts';

// ── Compliance (audit, PII) — contrats depuis kernel ────────────
export {
    AuditEventSchema,
    AuditActionSchema,
    AUDITED_COLLECTIONS,
    type AuditEvent,
    type AuditAction,
    type AuditedCollection,
} from '@nexus/contracts';

export type { PiiFields, PiiRecord } from '@nexus/contracts';
