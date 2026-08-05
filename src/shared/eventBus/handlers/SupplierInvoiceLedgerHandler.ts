import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

export function registerSupplierInvoiceLedgerHandler() {
  return NexusEventBus.on(
    'finance.invoice_approved',
    async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, invoiceId, supplierId, amountInMicrounits, approvedBy } = payload;
      
      logger.info(`[SupplierInvoiceLedger] Facture fournisseur ${invoiceId} approuvée par ${approvedBy}. Inscription au Grand Livre (AP).`);

      // Écriture au Ledger (Accounts Payable)
      const ledgerEntryId = `ap_entry_${invoiceId}`;
      await Nexus.adapter.set(`tenants/${tenantId}/fiscalLedger/${ledgerEntryId}`, {
        id: ledgerEntryId,
        type: 'ACCOUNTS_PAYABLE',
        referenceId: invoiceId,
        supplierId,
        amountInMicrounits,
        status: 'awaiting_payment',
        recordedAt: Date.now()
      });

      empireAudit.log({
        module: 'finance',
        action: 'SUPPLIER_INVOICE_LEDGERED',
        details: { invoiceId, supplierId, amountInMicrounits },
        severity: 'medium', // Impact comptable
        timestamp: new Date(),
      });
    },
    { id: 'supplier-invoice-ledger', priority: 'HIGH' }
  );
}
