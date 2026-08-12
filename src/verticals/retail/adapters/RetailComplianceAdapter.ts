import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RetailComplianceAdapter = {
  emitAuditLog(payload: { tenantId: string; patientId: string; action: string; performedBy: string; timestamp: string }) {
    NexusEventBus.emitDurable('health.hds_audit_log', payload);
  },
  emitRecallDeclared(payload: { tenantId: string; recallId: string; productIds: string[]; reason: string }) {
    NexusEventBus.emitDurable('recall.declared', { v: 1 as const, ...payload });
  },
};
