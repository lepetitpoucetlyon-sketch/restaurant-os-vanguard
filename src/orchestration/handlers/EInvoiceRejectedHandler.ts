import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

export function registerEInvoiceRejectedHandler() {
  return NexusEventBus.on(
    'einvoice.rejected',
    async (payload) => {
      const {
        tenantId, invoiceId, invoiceNumber, totalTTCInMicrounits,
        supplierId, supplierName, rejectedBy, reason,
      } = payload;

      const forecastPath = `tenants/${tenantId}/cashflowProjections/einv_${invoiceId}`;
      assertHandlerTenant('einvoice-rejected-forecast', tenantId, forecastPath);

      const existing = await Nexus.adapter.get(forecastPath);
      if (existing) {
        await Nexus.adapter.update(forecastPath, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: rejectedBy,
          cancellationReason: reason,
        });
      }

      const apPath = `tenants/${tenantId}/accountsPayable/ap_einv_${invoiceId}`;
      assertHandlerTenant('einvoice-rejected-ap', tenantId, apPath);
      const apEntry = await Nexus.adapter.get(apPath);
      if (apEntry) {
        await Nexus.adapter.update(apPath, {
          status: 'cancelled',
          cancelledAt: new Date().toISOString(),
          cancelledBy: rejectedBy,
          cancellationReason: reason,
        });
      }

      const disputeId = `disp_${invoiceId}_${Date.now()}`;
      const disputePath = `tenants/${tenantId}/supplierDisputes/${disputeId}`;
      assertHandlerTenant('einvoice-rejected-dispute', tenantId, disputePath);

      await Nexus.adapter.set(disputePath, {
        id: disputeId,
        invoiceId,
        invoiceNumber,
        supplierId,
        supplierName,
        amountInMicrounits: totalTTCInMicrounits,
        reason,
        rejectedBy,
        status: 'open',
        createdAt: new Date().toISOString(),
      });

      logger.info(
        `[EInvoiceRejected] Facture ${invoiceNumber} rejetée — projection trésorerie annulée, ` +
        `litige ${disputeId} ouvert (${reason})`,
      );

      empireAudit.log({
        module: 'finance',
        action: 'EINVOICE_REJECTED_TREASURY_UPDATED',
        details: { tenantId, invoiceId, disputeId, reason, totalTTCInMicrounits },
        severity: 'high',
        timestamp: new Date(),
      });
    },
    { id: 'einvoice-rejected-handler', priority: 'HIGH' },
  );
}
