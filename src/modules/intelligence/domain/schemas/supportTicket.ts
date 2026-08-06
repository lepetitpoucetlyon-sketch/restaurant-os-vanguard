import { z } from 'zod';
import { TimestampSchema, UUIDSchema, sanitized } from '@/domain/schemas/primitives';

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

export const SupportDraftKindSchema = z.enum(['config_patch', 'code_fix', 'evolution_proposal']);
export type SupportDraftKind = z.infer<typeof SupportDraftKindSchema>;

export const SupportDraftSchema = z.object({
    kind:           SupportDraftKindSchema,
    title:          sanitized(3, 140),
    summary:        sanitized(10, 2000),
    rootCause:      sanitized(0, 2000).optional(),
    proposedPatch:  z.record(z.string(), z.unknown()).optional(),
    codeBrief:      sanitized(0, 4000).optional(),
    riskLevel:      z.enum(['low', 'medium', 'high']),
    autoApplicable: z.boolean(),
    confidence:     z.number().min(0).max(1),
});
export type SupportDraft = z.infer<typeof SupportDraftSchema>;

export const SupportDiagnosticSchema = z.object({
    severity:      z.enum(['critical', 'high', 'medium', 'low']),
    category:      z.string(),
    probableCause: z.string(),
    recommendedFix: z.string(),
    escalate:      z.boolean(),
});
export type SupportDiagnostic = z.infer<typeof SupportDiagnosticSchema>;

export const SupportTicketSchema = z.object({
    id:             UUIDSchema,
    tenantId:       z.string().min(1),
    source:         SupportTicketSourceSchema,
    description:    sanitized(1, 2000),
    screenshotUrl:  z.string().url().optional(),
    status:         SupportTicketStatusSchema,
    diagnostic:     SupportDiagnosticSchema.optional(),
    draft:          SupportDraftSchema.optional(),
    analysisError:  z.string().optional(),
    createdAt:      TimestampSchema,
    createdBy:      z.string().min(1),
    resolvedAt:     TimestampSchema.optional(),
    resolvedBy:     z.string().optional(),
    resolutionNote: z.string().optional(),
    escalated:      z.boolean().default(false),
});
export type SupportTicket = z.infer<typeof SupportTicketSchema>;
