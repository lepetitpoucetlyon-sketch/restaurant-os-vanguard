import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';

export function registerMccFiscalAuditHandler() {
  return NexusEventBus.on(
    'mcc.fiscal_audit_required',
    async (payload) => {
      const { tenantId, reason, urgency } = payload;
      const auditId = SharedKernel.generateId('FISCAUDIT');

      await Nexus.adapter.set(`mcc/fiscalAudits/${auditId}`, {
        id: auditId,
        tenantId,
        reason,
        urgency,
        status: 'pending',
        requestedAt: new Date().toISOString(),
      });
    },
    { id: 'mcc-fiscal-audit-handler', priority: 'HIGH' }
  );
}
