import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

export function registerEInvoiceApprovedHandler() {
  return NexusEventBus.on(
    'einvoice.approved',
    async (payload) => {
      const {
        tenantId, invoiceId, invoiceNumber, totalHTInMicrounits,
        totalTTCInMicrounits, dueDate, supplierId, supplierName, approvedBy,
      } = payload;

      const apEntryId = `ap_einv_${invoiceId}`;
      const apPath = `tenants/${tenantId}/accountsPayable/${apEntryId}`;
      assertHandlerTenant('einvoice-approved-ap', tenantId, apPath);

      await Nexus.adapter.set(apPath, {
        id: apEntryId,
        type: 'SUPPLIER_EINVOICE',
        invoiceId,
        invoiceNumber,
        supplierId,
        supplierName,
        amountHTInMicrounits: totalHTInMicrounits,
        amountTTCInMicrounits: totalTTCInMicrounits,
        dueDate: dueDate ?? null,
        status: 'awaiting_payment',
        approvedBy,
        approvedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const forecastPath = `tenants/${tenantId}/cashflowProjections/einv_${invoiceId}`;
      assertHandlerTenant('einvoice-approved-forecast', tenantId, forecastPath);

      await Nexus.adapter.set(forecastPath, {
        id: `einv_${invoiceId}`,
        type: 'outflow',
        category: 'supplier_einvoice',
        amountInMicrounits: totalTTCInMicrounits,
        dueDate: dueDate ?? null,
        description: `Facture ${invoiceNumber} — ${supplierName}`,
        invoiceId,
        supplierId,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });

      logger.info(
        `[EInvoiceApproved] AP entry ${apEntryId} créé — ${(totalTTCInMicrounits / 1_000_000).toFixed(2)}€ TTC, ` +
        `échéance ${dueDate ?? 'non précisée'}`,
      );

      empireAudit.log({
        module: 'finance',
        action: 'EINVOICE_AP_CREATED',
        details: { tenantId, invoiceId, apEntryId, totalTTCInMicrounits, dueDate },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'einvoice-approved-handler', priority: 'HIGH' },
  );
}
