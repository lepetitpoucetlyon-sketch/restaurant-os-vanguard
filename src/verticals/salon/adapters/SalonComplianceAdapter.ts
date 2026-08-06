import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const SalonComplianceAdapter = {
  emitProductSafetyCheck(payload: { tenantId: string; checkId: string; operatorId: string; timestamp: number }) {
    NexusEventBus.emitDurable('haccp.check.saved', { v: 1 as const, ...payload });
  },
  emitRgpdConsent(payload: { tenantId: string; patientId: string; consentType: string; grantedAt: string }) {
    NexusEventBus.emitDurable('health.consent_recorded', payload);
  },
};
