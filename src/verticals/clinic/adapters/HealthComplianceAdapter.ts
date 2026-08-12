import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HealthComplianceAdapter = {
  emitHdsAuditLog(payload: { tenantId: string; patientId: string; action: string; performedBy: string; timestamp: string }) {
    NexusEventBus.emitDurable('health.hds_audit_log', payload);
  },
  emitConsentRecorded(payload: { tenantId: string; patientId: string; consentType: string; grantedAt: string }) {
    NexusEventBus.emitDurable('health.consent_recorded', payload);
  },
};
