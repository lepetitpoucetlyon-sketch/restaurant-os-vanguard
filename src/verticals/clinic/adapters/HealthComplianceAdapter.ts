import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeComplianceAdapter } from '@/verticals/_shared/adapters';

/** Conformité clinique = socle universel + deltas journal HDS & consentement patient. */
export const HealthComplianceAdapter = {
  ...makeComplianceAdapter(),
  emitHdsAuditLog(payload: { tenantId: string; patientId: string; action: string; performedBy: string; timestamp: string }) {
    NexusEventBus.emitDurable('health.hds_audit_log', payload);
  },
  emitConsentRecorded(payload: { tenantId: string; patientId: string; consentType: string; grantedAt: string }) {
    NexusEventBus.emitDurable('health.consent_recorded', payload);
  },
};
