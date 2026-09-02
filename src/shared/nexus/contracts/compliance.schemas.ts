import { z } from 'zod';

// ─── Enums ──────────────────────────────────────────────────────────────────────

export interface ComplianceAlert {
    id: string;
    userName: string;
    message: string;
}

export const ComplianceDocumentTypeEnum = z.enum([
    'EMPLOYMENT_CONTRACT',
    'PAYSLIP',
    'IDENTITY_DOCUMENT',
    'EMPLOYEE_PROFILE',
    'DPAE',
    'HEALTH_CERT',
    'OTHER'
]);

export const SensitivityTierEnum = z.enum([
    'TIER_1', // PUBLIC/OPS
    'TIER_2', // INTERNAL
    'TIER_3', // PERSONAL (PII)
    'TIER_4'  // SENSITIVE (CRITICAL)
]);

export const LegalBasisEnum = z.enum([
    'CONTRACTUAL_NECESSITY',
    'LEGAL_OBLIGATION',
    'LEGITIMATE_INTEREST',
    'CONSENT',
    'UNDETERMINED'
]);

export const RbacRoleEnum = z.enum([
    'OWNER',
    'MANAGER',
    'ACCOUNTANT',
    'EMPLOYEE',
    'AUDITOR'
]);

export const PulseActionEnum = z.enum([
    'STRIP',
    'GENERALIZE',
    'BLOCK'
]);

export const ComplianceStatusEnum = z.enum([
    'COMPLIANT',
    'WARNING',
    'BREACH'
]);

export const ComplianceFlagEnum = z.enum([
    'LEGAL_BASIS_REVIEW_REQUIRED',
    'TIER4_WITHOUT_LEGAL_BASIS',
    'IDENTITY_DOCUMENT_STORAGE_RISK',
    'SPECIAL_CATEGORY_DATA_DETECTED',
    'RETENTION_PERIOD_UNDEFINED',
    'CONSENT_REQUIRED',
    'PII_LEAK_RISK'
]);

// ─── Sub-schemas ────────────────────────────────────────────────────────────────

export const DetectedFieldSchema = z.object({
    field: z.string(),
    tier: SensitivityTierEnum,
    raw_value: z.string().nullable(),
    masked_value: z.string(),
    legal_basis: LegalBasisEnum,
    retention_days: z.number().int().optional()
});

export const RolePermissionSchema = z.object({
    tiers_accessible: z.array(SensitivityTierEnum),
    write: z.boolean(),
    financial_tier4: z.boolean().optional(),
    own_only: z.boolean().optional()
});

export const AccessControlPolicySchema = z.object({
    vassal_id: z.string().optional(),
    permissions: z.record(RbacRoleEnum, RolePermissionSchema)
});

export const ComplianceAuditSchema = z.object({
    status: ComplianceStatusEnum,
    requires_watermark: z.boolean(),
    do_not_store: z.boolean(),
    pulse_action: PulseActionEnum
});

// ─── Top-level schema ───────────────────────────────────────────────────────────

export const IdentityExtractionSchema = z.object({
    document_metadata: z.object({
        type: ComplianceDocumentTypeEnum,
        document_type_detail: z.string().nullable().optional(),
        is_hcr_compliant: z.boolean().optional(),
        max_tier: SensitivityTierEnum,
        vassal_id: z.string().optional(),
        analysis_date: z.string().optional()
    }),
    extracted_data: z.array(DetectedFieldSchema),
    access_control_policy: AccessControlPolicySchema.optional(),
    compliance_audit: ComplianceAuditSchema,
    flags: z.array(ComplianceFlagEnum)
});

export const ComplianceExtractionErrorSchema = z.object({
    error: z.literal('NON_PROCESSABLE'),
    reason: z.string(),
    flags: z.array(ComplianceFlagEnum)
});

// ─── Types ──────────────────────────────────────────────────────────────────────

export type IdentityExtraction = z.infer<typeof IdentityExtractionSchema>;
export type ComplianceExtractionError = z.infer<typeof ComplianceExtractionErrorSchema>;
export type DetectedField = z.infer<typeof DetectedFieldSchema>;
export type SensitivityTier = z.infer<typeof SensitivityTierEnum>;
