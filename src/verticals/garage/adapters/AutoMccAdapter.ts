import { NexusEventBus } from '@orchestration/NexusEventBus';

export const AutoMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; liftsOperational: number; activeWorkOrders: number }) {
    NexusEventBus.emit('mcc.health_ping', payload);
  },
  emitFiscalAuditRequired(payload: { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' }) {
    NexusEventBus.emitDurable('mcc.fiscal_audit_required', payload);
  },
};
