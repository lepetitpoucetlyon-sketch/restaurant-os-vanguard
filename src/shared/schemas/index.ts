/**
 * 🏛️ SHARED SCHEMAS BARREL
 * N'exporte que les primitives transversales + les types tiers utilisés par
 * l'infrastructure partagée (handlers, vault, API routes).
 * Pour les types métier, importer directement depuis @/modules/<pilier>.
 *
 * NB : les `export * from '@/bootstrap/legacy';` larges sont interdits ici — chaque
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
 } from '@_modules/intelligence'; // @nexus-legacy;

// ── Compliance (audit, PII) — utilisé par AuditService + PiiVault ────────────
export { 
    AuditEventSchema, AUDITED_COLLECTIONS,
    type AuditAction, type AuditEvent, type AuditedCollection,
    AuditActionSchema,
 } from '@_modules/compliance'; // @nexus-legacy;
export type {  PiiFields, PiiRecord  } from '@_modules/compliance'; // @nexus-legacy;
