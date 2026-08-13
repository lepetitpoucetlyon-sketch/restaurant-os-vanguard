import { z } from 'zod';

export const LicenseTypeSchema = z.enum([
    // Food & beverage
    'licence_iv',
    'licence_restaurant',
    'licence_debit_boissons',
    'food_safety_permit',
    'alcohol_permit',
    // Automotive
    'vehicle_repair_permit',
    'controle_technique_agree',
    // Healthcare
    'healthcare_facility_license',
    'pharmacie_agree',
    // Beauty & wellness
    'cosmetology_license',
    'esthetics_permit',
    // Hospitality
    'hotel_classification',
    'tourism_license',
    // Universal
    'erp_authorization',
    'music_license',
    'terrace_permit',
    'data_protection_registration',
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
