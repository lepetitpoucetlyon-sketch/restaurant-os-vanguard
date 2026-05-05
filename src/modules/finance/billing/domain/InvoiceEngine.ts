import { Order, LegalInvoice, NexusInternalMapper } from '@nexus/contracts/nexus-internal-mapper';
import { SovereignNode } from '@/shared/nexus-contract';
import { JournalEntry, TaxRate } from '@modules/finance';
import { SovereignMath } from '@/shared/services/SovereignMath';
import { toMicrounits } from '@/domain/schemas/primitives';

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
    
    const subTotalInCents = order?.totalInCents ?? 0;
    const taxRateValue = parseFloat(this.DEFAULT_TAX_RATE);
    const taxTotalInCents = Math.round(subTotalInCents * taxRateValue);
    const totalInCents = subTotalInCents + taxTotalInCents;

    return {
      id: `inv_${order?.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      orderId: order?.id ?? 'UNKNOWN',
      invoiceNumber: `FACT-${new Date().getFullYear()}-${(order?.id ?? '').slice(-6).toUpperCase()}`,
      subTotalInCents,
      taxTotalInCents,
      totalInCents,
      taxDetails: [{
        rate: taxRateValue * 100,
        amountInCents: taxTotalInCents,
        baseInCents: subTotalInCents
      }],
      status: 'issued',
      issuedAt: new Date().toISOString()
    };
  }

  /**
   * Seal an invoice to the Fiscal Ledger format (JournalEntry)
   */
  static toJournalEntry(invoice: LegalInvoice, tenantId: string): JournalEntry {
    const now = Date.now();
    
    return {
      id: invoice?.id?.startsWith('inv_') ? invoice.id.replace('inv_', '') : invoice?.id,
      receiptNumber: `${new Date().getFullYear()}-${invoice?.id?.slice(-6).padStart(6, '0')}`,
      hashPrecedent: "0".repeat(64), // Should be fetched from previous entry
      hash: "1".repeat(64),          // Should be calculated
      amountInMicrounits: toMicrounits(SovereignMath.fromCents(invoice.totalInCents)),
      taxRate: this.DEFAULT_TAX_RATE,
      taxAmountInMicrounits: toMicrounits(SovereignMath.fromCents(invoice.taxTotalInCents)),
      operatorId: "SYSTEM",
      deviceId: "MAIN_POS",
      serverTimestamp: now,
      correlationId: invoice.orderId,
      type: 'revenue',
      status: 'validated',
      cancellationRef: null
    };
  }
}

