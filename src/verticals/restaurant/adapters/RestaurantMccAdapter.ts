import { NexusEventBus } from '@orchestration/NexusEventBus';

export const RestaurantMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; posOnline: boolean; kdsOnline: boolean; printerOnline: boolean }) {
    NexusEventBus.emit('mcc.health_ping', payload);
  },
  emitFiscalAuditRequired(payload: { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' }) {
    NexusEventBus.emitDurable('mcc.fiscal_audit_required', payload);
  },
};
