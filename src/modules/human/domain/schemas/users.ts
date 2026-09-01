import { z } from 'zod';
import { SanitizedStringSchema, TimestampSchema, UUIDSchema, StatusSchema } from '@/shared/schemas/primitives';

export const UserPermissionsSchema = z.record(z.string(), z.array(z.string())).and(z.object({
    level: z.number().int().min(0).max(10),
    scope: z.array(z.string()),
    isSovereignAdmin: z.boolean().optional(),
    allowedModules: z.array(z.string()),
    restrictedPillars: z.array(z.string()).optional(),
}));

export const ContractTypeSchema = z.enum([
  'cdi_35h',
  'cdi_39h',
  'cdd',
  'extra_cddu',
  'apprenti',
  'stage',
  'freelance',
  'interim'
]);
export type ContractType = z.infer<typeof ContractTypeSchema>;

export const EmploymentStatusSchema = z.enum(['employee', 'contractor', 'agency']);
export type EmploymentStatus = z.infer<typeof EmploymentStatusSchema>;

export const ContractorProfileSchema = z.object({
  siren: z.string().regex(/^[0-9]{9}$/, 'Le SIREN doit comporter 9 chiffres').optional(),
  siret: z.string().regex(/^[0-9]{14}$/, 'Le SIRET doit comporter 14 chiffres').optional(),
  companyName: z.string().min(1).max(120).optional(),
  vatRegime: z.enum(['franchise_art_293b', 'vat_standard_20', 'vat_exempt']).default('franchise_art_293b'),
  vatNumber: z.string().optional(),
  billingRateType: z.enum(['hourly', 'shift_flat_fee', 'per_cover']).default('hourly'),
  rateInMicrounits: z.number().int().min(0).optional(),
  selfBillingAgreed: z.boolean().default(false),
  vigilanceStatus: z.enum(['valid', 'missing', 'expired']).default('missing').optional(),
  urssafVigilanceCertificateUrl: z.string().optional(),
  urssafVigilanceValidUntil: z.string().optional(),
  iban: z.string().optional(),
  bic: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional()
});
export type ContractorProfile = z.infer<typeof ContractorProfileSchema>;

export const UserSchema = z.object({
  id:                UUIDSchema,
  type:              z.literal('user').default('user'),
  tenantId:          UUIDSchema.optional(),
  name:              z.string().min(1).max(100).pipe(SanitizedStringSchema),
  email:             z.string().email('Email invalide').toLowerCase().optional(),
  role:              z.string(),
  status:            StatusSchema.default('active'),
  contractType:      ContractTypeSchema.optional(),
  employmentStatus:  EmploymentStatusSchema.default('employee').optional(),
  contractorProfile: ContractorProfileSchema.optional(),
  pin:               z.string().regex(/^[0-9]{4}$/, 'Le PIN doit être composé de 4 chiffres').optional(),
  pinHash:           z.string().optional(),
  pinSalt:           z.string().optional(),
  avatar:            z.string().url().optional().nullable(),
  lastActive:        TimestampSchema.optional(),
  performanceScore:  z.number().min(0).max(100).optional(),
  accessLevel:       z.number().int().min(0).max(10).optional(),
  hourlyRateInMicrounits: z.number().int().min(0).optional(),
  permissions:       UserPermissionsSchema.optional(),
  schemaVersion:     z.literal(2).default(2),
  createdAt:         TimestampSchema.optional(),
  updatedAt:         TimestampSchema.default(() => Date.now()),
}).catchall(z.any());

export type User = z.infer<typeof UserSchema>;
export type UserPermissions = z.infer<typeof UserPermissionsSchema>;

export const UserPatchSchema = UserSchema.partial().omit({ id: true, tenantId: true });
export type UserPatch = z.infer<typeof UserPatchSchema>;
