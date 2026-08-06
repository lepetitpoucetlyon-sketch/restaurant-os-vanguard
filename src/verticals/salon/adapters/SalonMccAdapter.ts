import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export const SalonMccAdapter = {
  emitHealthPing(payload: { tenantId: string; status: 'healthy' | 'degraded'; chairsActive: number; appointmentsToday: number }) {
    NexusEventBus.emit('mcc.health_ping', { ...payload });
  },
  emitFiscalAuditRequired(payload: { tenantId: string; reason: string; urgency: 'low' | 'high' | 'critical' }) {
    NexusEventBus.emitDurable('mcc.fiscal_audit_required', payload);
  },
};
