import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface PurchaseOrderRecord {
  id: string;
  supplierId: string;
  totalAmountInMicrounits: number;
  status: string;
}

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
        severity: 'medium',
        timestamp: new Date(),
      });

      // ── Item R5: Matching Automatique PO ↔ Facture ─────────────────────────
      try {
        const purchaseOrders = await Nexus.adapter.query<PurchaseOrderRecord>(
          `tenants/${tenantId}/purchaseOrders`,
          { where: [{ field: 'supplierId', operator: '==', value: supplierId }] }
        ) || [];

        // Recherche d'un PO non clôturé avec montant similaire (tolérance ±5%)
        const matchingPO = purchaseOrders.find(po => {
          if (po.status === 'reconciled' || po.status === 'cancelled') return false;
          const delta = Math.abs(po.totalAmountInMicrounits - amountInMicrounits);
          const tolerance = po.totalAmountInMicrounits * 0.05;
          return delta <= tolerance;
        });

        if (matchingPO) {
          const deltaInMicrounits = amountInMicrounits - matchingPO.totalAmountInMicrounits;

          if (Math.abs(deltaInMicrounits) === 0) {
            logger.info(`[SupplierInvoiceLedger] Match exact PO ${matchingPO.id} avec facture ${invoiceId}`);
            await NexusEventBus.emit('finance.reconciliation_completed', {
              v: 1,
              tenantId,
              reconciliationId: `rec_${invoiceId}`,
              bankTransactionId: invoiceId,
              matchedEntityId: invoiceId,
              matchedEntityType: 'invoice',
              reconciledBy: approvedBy ?? 'system_matching',
            });
          } else {
            logger.warn(`[SupplierInvoiceLedger] Écart détecté (${deltaInMicrounits / 1_000_000}€) entre PO ${matchingPO.id} et facture ${invoiceId}`);
            await NexusEventBus.emit('procurement.mismatch_detected', {
              v: 1,
              tenantId,
              purchaseOrderId: matchingPO.id,
              invoiceId,
              discrepancies: [`Écart de montant de ${(deltaInMicrounits / 1_000_000).toFixed(2)}€`],
            });
          }
        }
      } catch (err) {
        logger.error(`[SupplierInvoiceLedger] Erreur lors du matching PO auto`, err);
        throw err;
      }
    },
    { id: 'supplier-invoice-ledger', priority: 'HIGH' }
  );
}
