import { z } from 'zod';

export const LicenseTypeSchema = z.enum([
    'licence_iv',
    'licence_restaurant',
    'licence_debit_boissons',
    'erp_authorization',
    'food_safety_permit',
    'music_license',
    'terrace_permit',
    'alcohol_permit',
    'other',
]);

export const LicenseSchema = z.object({
    id: z.string(),
    tenantId: z.string(),
    type: LicenseTypeSchema,
    name: z.string(),
    number: z.string().optional(),
    issuedBy: z.string().optional(),
    issuedAt: z.string().optional(),
    expiresAt: z.string().optional(),
    renewalReminderDays: z.number().int().min(0).default(30),
    status: z.enum(['active', 'expiring_soon', 'expired', 'pending']).default('active'),
    documentUrl: z.string().optional(),
});

export type License = z.infer<typeof LicenseSchema>;
export type LicenseType = z.infer<typeof LicenseTypeSchema>;
