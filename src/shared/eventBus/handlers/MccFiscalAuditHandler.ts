import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

/** Logique métier extraite — testable directement sans mock du bus */
export async function handleMccFiscalAuditRequired(
  payload: Record<string, unknown>
) {
  const { tenantId, reason, urgency } = payload as {
    tenantId: string;
    reason: string;
    urgency: 'low' | 'high' | 'critical';
  };
  const auditId = SharedKernel.generateId('FISCAUDIT');

  await Nexus.adapter.set(`mcc/fiscalAudits/${auditId}`, {
    id: auditId,
    tenantId,
    reason,
    urgency,
    status: 'pending',
    requestedAt: new Date().toISOString(),
  });
}

export async function handleMccZSealConsolidated(
  payload: Record<string, unknown>
) {
  const { tenantId, date, totalInMicrounits } = payload as {
    tenantId: string;
    date: string;
    totalInMicrounits: number;
  };
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
}

export function registerMccFiscalAuditHandler() {
  const unsub1 = NexusEventBus.on(
    'mcc.fiscal_audit_required',
    handleMccFiscalAuditRequired as Parameters<typeof NexusEventBus.on>[1],
    { id: 'mcc-fiscal-audit-handler', priority: 'HIGH' }
  );

  const unsub2 = NexusEventBus.on(
    'finance.ticket_z_closed',
    handleMccZSealConsolidated as Parameters<typeof NexusEventBus.on>[1],
    { id: 'mcc-z-seal-consolidated', priority: 'BACKGROUND' }
  );

  return () => {
    unsub1();
    unsub2();
  };
}
