import { NexusEventBus } from '@orchestration/NexusEventBus';

export const HotelMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; pmsOnline: boolean; occupancy: number }) {
    NexusEventBus.emit('mcc.health_ping', payload);
  },
  emitFiscalAuditRequired(payload: { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' }) {
    NexusEventBus.emitDurable('mcc.fiscal_audit_required', payload);
  },
};
