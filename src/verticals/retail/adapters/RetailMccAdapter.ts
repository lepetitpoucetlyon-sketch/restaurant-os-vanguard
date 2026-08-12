import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RetailMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; posOnline: boolean; stockAlertsCount: number }) {
    NexusEventBus.emit('mcc.health_ping', { ...payload });
  },
  emitFiscalAuditRequired(payload: { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' }) {
    NexusEventBus.emitDurable('mcc.fiscal_audit_required', payload);
  },
};
