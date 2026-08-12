import { LegalInvoice, NexusInternalMapper } from '@nexus/contracts/nexus-internal-mapper';
import { SovereignNode } from '@nexus/contracts/nexus-contract';
import { JournalEntry, TaxRate } from '../../../types';
import { SovereignMath } from '@/lib/services/SovereignMath';
import { toMicrounits } from '@/shared/schemas/primitives';

/**
 * 🏛️ InvoiceEngine - NF525 Fiscal Intelligence
 * Responsible for transforming operational orders into legally sealed invoices.
 */
export class InvoiceEngine {
  private static DEFAULT_TAX_RATE: TaxRate = '0.20'; 

  /**
   * Transform a raw SovereignOrder into a LegalInvoice
   */
  static transform(rawOrder: SovereignNode): LegalInvoice {
    const order = NexusInternalMapper.mapToOrder(rawOrder);
    
    const subTotalMu = SovereignMath.orderTotalMicrounits(order);
    const taxRateValue = parseFloat(this.DEFAULT_TAX_RATE);
    const taxTotalMu = Math.round(subTotalMu * taxRateValue);
    const totalMu = subTotalMu + taxTotalMu;

    return {
      id: `inv_${order?.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderId: order?.id ?? 'UNKNOWN',
      invoiceNumber: `FACT-${new Date().getFullYear()}-${(order?.id ?? '').slice(-6).toUpperCase()}`,
      subTotalInMicrounits: subTotalMu,
      subTotalInCents: Math.round(subTotalMu / 10_000),
      taxTotalInMicrounits: taxTotalMu,
      taxTotalInCents: Math.round(taxTotalMu / 10_000),
      totalInMicrounits: totalMu,
      totalInCents: Math.round(totalMu / 10_000),
      taxDetails: [{
        rate: taxRateValue * 100,
        amountInMicrounits: taxTotalMu,
        amountInCents: Math.round(taxTotalMu / 10_000),
        baseInMicrounits: subTotalMu,
        baseInCents: Math.round(subTotalMu / 10_000),
      }],
      status: 'issued',
      issuedAt: new Date().toISOString()
    };
  }

  /**
   * Seal an invoice to the Fiscal Ledger format (JournalEntry)
   */
  static toJournalEntry(invoice: LegalInvoice, _tenantId: string): JournalEntry {
    const now = Date.now();
    
    return {
      id: invoice?.id?.startsWith('inv_') ? invoice.id.replace('inv_', '') : invoice?.id,
      receiptNumber: `${new Date().getFullYear()}-${invoice?.id?.slice(-6).padStart(6, '0')}`,
      hashPrecedent: "0".repeat(64), // Should be fetched from previous entry
      hash: "1".repeat(64),          // Should be calculated
      amountInMicrounits: toMicrounits(invoice.totalInMicrounits ?? (invoice.totalInCents ?? 0) * 10_000),
      taxRate: this.DEFAULT_TAX_RATE,
      taxAmountInMicrounits: toMicrounits(invoice.taxTotalInMicrounits ?? (invoice.taxTotalInCents ?? 0) * 10_000),
      operatorId: "SYSTEM",
      deviceId: "MAIN_POS",
      serverTimestamp: now,
      correlationId: invoice.orderId,
      type: 'revenue',
      status: 'validated',
      date: Date.now(),
      pieceNumber: invoice.invoiceNumber,
      description: `Facture client ${invoice.invoiceNumber}`,
      lines: [],
      isValidated: true,
      isSystemGenerated: true,
      updatedAt: Date.now(),
      cancellationRef: undefined
    };
  }
}

