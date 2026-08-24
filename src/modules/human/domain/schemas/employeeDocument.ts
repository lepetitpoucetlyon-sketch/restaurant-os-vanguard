import { z } from 'zod';

export const DocumentTypeSchema = z.enum([
    'identity',
    'work_permit',
    'health_certificate',
    'haccp_training',
    'food_safety',
    'first_aid',
    'contract',
    'amendment',
    'payslip',
    'other',
]);

export const EmployeeDocumentSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    userId: z.string(),
    type: DocumentTypeSchema,
    name: z.string(),
    url: z.string().optional(),
    sha256Hash: z.string().optional(),
    sealedAt: z.string().optional(),
    sealedBy: z.string().optional(),
    fileSizeBytes: z.number().optional(),
    mimeType: z.string().optional(),
    vaultArchiveEligible: z.boolean().default(true),
    expiresAt: z.string().optional(),
    issuedAt: z.string().optional(),
    uploadedAt: z.string(),
    verifiedBy: z.string().optional(),
    status: z.enum(['valid', 'expiring_soon', 'expired', 'pending_verification']).default('pending_verification'),
});

export type EmployeeDocument = z.infer<typeof EmployeeDocumentSchema>;
export type DocumentType = z.infer<typeof DocumentTypeSchema>;
