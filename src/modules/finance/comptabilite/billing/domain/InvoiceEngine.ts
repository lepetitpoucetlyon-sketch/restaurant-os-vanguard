import { LegalInvoice, NexusInternalMapper } from '@nexus/contracts/nexus-internal-mapper';
import { SovereignNode } from '@/shared/nexus-contract';
import { JournalEntry, TaxRate } from '@modules/finance/types';
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
    
    // Canonical Order total (Microunits Protocol) → cents for the LegalInvoice boundary. Value-preserving for legacy orders.
    const subTotalInCents = SovereignMath.toCents(BigInt(SovereignMath.orderTotalMicrounits(order)));
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
      subTotalInMicrounits: subTotalInCents * 10_000,
      taxTotalInCents,
      taxTotalInMicrounits: taxTotalInCents * 10_000,
      totalInCents,
      totalInMicrounits: totalInCents * 10_000,
      taxDetails: [{
        rate: taxRateValue * 100,
        amountInCents: taxTotalInCents,
        amountInMicrounits: taxTotalInCents * 10_000,
        baseInCents: subTotalInCents,
        baseInMicrounits: subTotalInCents * 10_000,
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
      amountInMicrounits: toMicrounits(SovereignMath.fromCents(invoice.totalInCents)),
      taxRate: this.DEFAULT_TAX_RATE,
      taxAmountInMicrounits: toMicrounits(SovereignMath.fromCents(invoice.taxTotalInCents)),
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

