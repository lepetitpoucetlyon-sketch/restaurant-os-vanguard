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
  SupportTicketSchema,
  SupportDraftSchema,
  SupportTicketStatusSchema,
  SupportTicketSourceSchema,
  type SupportTicket,
  type SupportDraft,
  type SupportTicketStatus,
  type SupportTicketSource,
} from '@/modules/intelligence';

// ── Compliance (audit, PII) — utilisé par AuditService + PiiVault ────────────
export {
  AuditEventSchema,
  AUDITED_COLLECTIONS,
  AuditActionSchema,
  type AuditAction,
  type AuditEvent,
  type AuditedCollection,
  type PiiFields,
  type PiiRecord,
} from '@/modules/compliance';
