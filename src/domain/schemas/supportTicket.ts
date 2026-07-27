import { z } from 'zod';
import { TimestampSchema, UUIDSchema, sanitized } from './primitives';

// ── Ticket support MCC ──────────────────────────────────────────────────────
// Deux producteurs possibles pour un même ticket : soumission auto depuis
// la plateforme du tenant, ou saisie manuelle par un opérateur MCC.
export const SupportTicketSourceSchema = z.enum(['tenant_submission', 'mcc_manual']);
export type SupportTicketSource = z.infer<typeof SupportTicketSourceSchema>;

export const SupportTicketStatusSchema = z.enum([
  'new',
  'analyzing',
  'draft_ready',
  'analysis_failed',
  'approved',
  'rejected',
  'applied',
]);
export type SupportTicketStatus = z.infer<typeof SupportTicketStatusSchema>;

// ── Brouillon généré par l'agent IA ─────────────────────────────────────────
// L'IA ne propose jamais qu'un brouillon : seul un opérateur MCC (mcc_support)
// décide de l'approuver tel quel, de le corriger, ou de le refuser. Un
// 'config_patch' peut être auto-appliqué (si autoApplicable=true et que
// l'opérateur le demande explicitement) ; un 'code_fix'/'evolution_proposal'
// reste un brief transmis à un développeur, jamais appliqué automatiquement.
export const SupportDraftKindSchema = z.enum(['config_patch', 'code_fix', 'evolution_proposal']);
export type SupportDraftKind = z.infer<typeof SupportDraftKindSchema>;

export const SupportDraftSchema = z.object({
  kind:            SupportDraftKindSchema,
  title:            sanitized(3, 140),
  summary:          sanitized(10, 2000),
  rootCause:        sanitized(0, 2000).optional(),
  // Fragment de tenantConfig.overrides, mergeable via le même appel que
  // tenant-override/route.ts — uniquement pertinent pour kind:'config_patch'.
  proposedPatch:    z.record(z.string(), z.unknown()).optional(),
  codeBrief:        sanitized(0, 4000).optional(),
  riskLevel:        z.enum(['low', 'medium', 'high']),
  autoApplicable:   z.boolean(),
  confidence:       z.number().min(0).max(1),
});
export type SupportDraft = z.infer<typeof SupportDraftSchema>;

// ── Diagnostic manuel existant (flux MCC-opérateur historique) ─────────────
// Conservé tel quel pour compat avec support-ai/diagnose/route.ts.
export const SupportDiagnosticSchema = z.object({
  severity:         z.enum(['critical', 'high', 'medium', 'low']),
  category:         z.string(),
  probableCause:    z.string(),
  recommendedFix:   z.string(),
  escalate:         z.boolean(),
});
export type SupportDiagnostic = z.infer<typeof SupportDiagnosticSchema>;

// ── Ticket ───────────────────────────────────────────────────────────────
export const SupportTicketSchema = z.object({
  id:               UUIDSchema,
  tenantId:         z.string().min(1),
  source:           SupportTicketSourceSchema,
  description:      sanitized(1, 2000),
  screenshotUrl:    z.string().url().optional(),
  status:           SupportTicketStatusSchema,
  diagnostic:       SupportDiagnosticSchema.optional(),
  draft:            SupportDraftSchema.optional(),
  analysisError:    z.string().optional(),
  createdAt:        TimestampSchema,
  createdBy:        z.string().min(1),
  resolvedAt:       TimestampSchema.optional(),
  resolvedBy:       z.string().optional(),
  resolutionNote:   z.string().optional(),
  escalated:        z.boolean().default(false),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;
