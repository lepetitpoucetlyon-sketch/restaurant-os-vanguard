import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { makeComplianceAdapter } from '@/verticals/_shared/adapters';

/** Conformité retail = socle universel (HACCP/RGPD) + deltas journal d'audit & rappel produit. */
export const RetailComplianceAdapter = {
  ...makeComplianceAdapter(),
  emitAuditLog(payload: { tenantId: string; patientId: string; action: string; performedBy: string; timestamp: string }) {
    NexusEventBus.emitDurable('health.hds_audit_log', payload);
  },
  emitRecallDeclared(payload: { tenantId: string; recallId: string; productIds: string[]; reason: string }) {
    NexusEventBus.emitDurable('recall.declared', { v: 1 as const, ...payload });
  },
};
