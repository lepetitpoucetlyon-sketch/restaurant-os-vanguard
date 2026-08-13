import { z } from 'zod';

export const CRMAutomationConfigSchema = z.object({
  regularVisitThreshold: z.number().int().min(1).default(5),
  vipVisitThreshold: z.number().int().min(1).default(20),
  noShowThresholdDays: z.number().int().min(1).default(45),
  vipMinSpendInMicrounits: z.number().int().min(0).default(500_000_000),
  birthdayOfferDaysAhead: z.number().int().min(0).max(30).default(3),
  reactivationAfterDays: z.number().int().min(1).default(60),
});

export type CRMAutomationConfig = z.infer<typeof CRMAutomationConfigSchema>;

export const CRM_CONFIG_DEFAULTS: CRMAutomationConfig = CRMAutomationConfigSchema.parse({});

export const crmConfigPath = (tenantId: string) => `tenants/${tenantId}/config/crm`;
