import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerMccFiscalAuditHandler() {
  const unsub1 = NexusEventBus.on(
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

  const unsub2 = NexusEventBus.on(
    'finance.ticket_z_closed',
    async (payload) => {
      const { tenantId, date, totalInMicrounits } = payload;
      const auditId = SharedKernel.generateId('MCCZSEAL');

      logger.info(`[MccFiscalAudit] Reçu ticket Z clôturé pour ${tenantId} au ${date} (Total: ${(totalInMicrounits / 1_000_000).toFixed(2)}€)`);

      await Nexus.adapter.set(`mcc/consolidatedZSeals/${auditId}`, {
        id: auditId,
        tenantId,
        date,
        totalInMicrounits,
        auditedAt: new Date().toISOString(),
        isChainValid: true,
      });

      empireAudit.log({
        module: 'accounting',
        action: 'MCC_Z_SEAL_CONSOLIDATED',
        details: { tenantId, date, auditId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'mcc-z-seal-consolidated', priority: 'BACKGROUND' }
  );

  return () => {
    unsub1();
    unsub2();
  };
}
