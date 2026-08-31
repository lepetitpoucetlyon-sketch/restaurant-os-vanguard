import { z } from 'zod';

export const EInvoiceProviderIdSchema = z.enum(['super-pdp', 'b2brouter', 'mock']);
export type EInvoiceProviderId = z.infer<typeof EInvoiceProviderIdSchema>;

/**
 * Config PA stockée dans Nexus.
 *
 * Niveau plateforme : platform/settings/einvoice_config  (accès MCC uniquement)
 * Override par tenant : tenants/{tenantId}/config/einvoice_provider
 *
 * Résolution : override tenant > config plateforme > mock (dev)
 */
export const EInvoiceProviderConfigSchema = z.object({
  providerId: EInvoiceProviderIdSchema,
  apiKey: z.string().min(1, 'Clé API requise'),
  webhookSecret: z.string().min(1, 'Secret webhook requis'),
  siret: z.string().regex(/^\d{14}$/, 'SIRET invalide (14 chiffres)'),
  sandboxMode: z.boolean().default(false),
  registeredWithPdp: z.boolean().default(false),
  registeredAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime(),
});

export type EInvoiceProviderConfig = z.infer<typeof EInvoiceProviderConfigSchema>;

/**
 * Config plateforme étendue — utilisée pour émettre les factures SaaS (abonnements tenants)
 * et opérer en mode multi-entreprise (tous les tenants via un seul compte PA).
 */
export const PlatformEInvoiceConfigSchema = EInvoiceProviderConfigSchema.extend({
  platformName: z.string().min(1),
  platformVatNumber: z.string().regex(/^FR\d{11}$/, 'N° TVA FR invalide').optional(),
  platformAddress: z.string().min(1),
  platformCountry: z.string().length(2).default('FR'),
  multiCompanyMode: z.boolean().default(true),
});

export type PlatformEInvoiceConfig = z.infer<typeof PlatformEInvoiceConfigSchema>;

export const PLATFORM_EINVOICE_CONFIG_PATH = 'platform/settings/einvoice_config';
export const tenantEInvoiceConfigPath = (tenantId: string) =>
  `tenants/${tenantId}/config/einvoice_provider`;
