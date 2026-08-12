import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { CryptoService } from '@/lib/CryptoService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { toMicrounits } from '@/shared/schemas/primitives';
import type { Microunits } from '@/shared/schemas/primitives';
import type { JournalEntry, LegalInvoice } from '@nexus/contracts';
import type { SovereignData } from '@/shared/nexus-contract';
import { logger } from '@/lib/logger';

const INVOICE_THRESHOLD_HT_MU = 150_000_000 as Microunits;
const INVOICE_COLLECTION = 'invoices';

export interface InvoiceFromTicketParams {
  tenantId: string;
  journalEntry: JournalEntry;
  customerName?: string;
  customerAddress?: string;
  customerSiret?: string;
}

export interface GeneratedInvoice extends LegalInvoice {
  sourceJournalEntryId: string;
  customerAddress?: string;
  customerSiret?: string;
}

export const InvoiceService = {
  shouldAutoInvoice(totalHTInMicrounits: number): boolean {
    return totalHTInMicrounits >= INVOICE_THRESHOLD_HT_MU;
  },

  async generateFromTicket(params: InvoiceFromTicketParams): Promise<GeneratedInvoice> {
    const { tenantId, journalEntry, customerName, customerAddress, customerSiret } = params;

    const invoiceId = SharedKernel.generateId('INV');
    const now = new Date().toISOString();
    const year = new Date().getFullYear();

    const sequenceNumber = await this.getNextInvoiceNumber(tenantId, year);
    const invoiceNumber = `FACT-${year}-${String(sequenceNumber).padStart(6, '0')}`;

    const taxDetails = this.buildTaxDetails(journalEntry);
    const subTotalMu = taxDetails.reduce((s, d) => s + (d.baseInMicrounits ?? 0), 0);
    const taxTotalMu = taxDetails.reduce((s, d) => s + (d.amountInMicrounits ?? 0), 0);
    const totalMu = subTotalMu + taxTotalMu;

    const invoice: GeneratedInvoice = {
      id: invoiceId,
      createdAt: now,
      updatedAt: now,
      orderId: String(journalEntry.correlationId ?? journalEntry.id),
      sourceJournalEntryId: journalEntry.id,
      invoiceNumber,
      customerName: customerName ?? 'Client comptoir',
      customerAddress,
      customerSiret,
      subTotalInMicrounits: subTotalMu,
      subTotalInCents: Math.round(subTotalMu / 10_000),
      taxTotalInMicrounits: taxTotalMu,
      taxTotalInCents: Math.round(taxTotalMu / 10_000),
      totalInMicrounits: totalMu,
      totalInCents: Math.round(totalMu / 10_000),
      taxDetails,
      status: 'issued',
      issuedAt: now,
      seal: await this.computeSeal(invoiceId, invoiceNumber, totalMu, taxDetails, now),
    };

    const path = `tenants/${tenantId}/${INVOICE_COLLECTION}/${invoiceId}`;
    await Nexus.adapter.set(path, invoice);

    NexusEventBus.emitDurable('finance.invoice_generated', {
      tenantId,
      invoiceId,
      invoiceNumber,
      totalInMicrounits: totalMu,
      sourceJournalEntryId: journalEntry.id,
      customerName: invoice.customerName ?? 'Client comptoir',
    }).catch(() => {});

    empireAudit.log({
      module: 'finance',
      action: 'INVOICE_GENERATED',
      severity: 'low',
      timestamp: new Date(),
      details: {
        invoiceId,
        invoiceNumber,
        totalMu,
        sourceJournalEntryId: journalEntry.id,
        taxRateCount: taxDetails.length,
      },
    });

    logger.info(`[InvoiceService] ${invoiceNumber} generated from ${journalEntry.pieceNumber} (${totalMu}µ)`);

    return invoice;
  },

  buildTaxDetails(entry: JournalEntry): LegalInvoice['taxDetails'] {
    const rateMap = new Map<number, { baseMu: number; taxMu: number }>();

    for (const line of entry.lines ?? []) {
      const ratePct = line.taxRate != null ? parseFloat(String(line.taxRate)) * 100 : 20;
      const lineMu = Math.abs(
        (line.amountInMicrounits ?? (line.amountInCents ?? 0) * 10_000)
      );

      if (line.side === 'credit' && (line.accountCode ?? '').startsWith('7')) {
        const existing = rateMap.get(ratePct) ?? { baseMu: 0, taxMu: 0 };
        existing.baseMu += lineMu;
        rateMap.set(ratePct, existing);
      }
      if (line.side === 'credit' && (line.accountCode ?? '').startsWith('4457')) {
        const existing = rateMap.get(ratePct) ?? { baseMu: 0, taxMu: 0 };
        existing.taxMu += lineMu;
        rateMap.set(ratePct, existing);
      }
    }

    if (rateMap.size === 0) {
      const totalMu = entry.amountInMicrounits ?? toMicrounits((entry.amountInCents ?? 0) * 10_000);
      const taxMu = entry.taxAmountInMicrounits ?? toMicrounits(Math.round(Number(totalMu) * 0.2));
      const baseMu = Number(totalMu) - Number(taxMu);
      return [{
        rate: 20,
        baseInMicrounits: baseMu,
        baseInCents: Math.round(baseMu / 10_000),
        amountInMicrounits: Number(taxMu),
        amountInCents: Math.round(Number(taxMu) / 10_000),
      }];
    }

    return Array.from(rateMap.entries()).map(([rate, { baseMu, taxMu }]) => ({
      rate,
      baseInMicrounits: baseMu,
      baseInCents: Math.round(baseMu / 10_000),
      amountInMicrounits: taxMu,
      amountInCents: Math.round(taxMu / 10_000),
    }));
  },

  async getNextInvoiceNumber(tenantId: string, year: number): Promise<number> {
    const counterPath = `tenants/${tenantId}/counters/invoice_${year}`;
    const counter = await Nexus.adapter.get<{ value: number }>(counterPath);
    const next = (counter?.value ?? 0) + 1;
    await Nexus.adapter.set(counterPath, { value: next });
    return next;
  },

  async computeSeal(
    invoiceId: string,
    invoiceNumber: string,
    totalMu: number,
    taxDetails: LegalInvoice['taxDetails'],
    issuedAt: string,
  ): Promise<string> {
    const data = {
      invoiceId,
      invoiceNumber,
      totalMu,
      taxDetails: taxDetails.map(d => ({ rate: d.rate, base: d.baseInMicrounits, tax: d.amountInMicrounits })),
      issuedAt,
    } as unknown as SovereignData;
    return CryptoService.generateHash(CryptoService.canonicalStringify(data));
  },

  async getInvoice(tenantId: string, invoiceId: string): Promise<GeneratedInvoice | null> {
    return Nexus.adapter.get<GeneratedInvoice>(
      `tenants/${tenantId}/${INVOICE_COLLECTION}/${invoiceId}`
    );
  },

  async listInvoices(tenantId: string, opts?: { limit?: number; fromDate?: string }): Promise<GeneratedInvoice[]> {
    const where: Array<{ field: string; operator: string; value: unknown }> = [];
    if (opts?.fromDate) {
      where.push({ field: 'issuedAt', operator: '>=', value: opts.fromDate });
    }
    return Nexus.adapter.query<GeneratedInvoice>(
      `tenants/${tenantId}/${INVOICE_COLLECTION}`,
      {
        where: where as Parameters<typeof Nexus.adapter.query>[1] extends { where?: infer W } ? W : never,
        orderBy: { field: 'issuedAt', direction: 'desc' },
        limit: opts?.limit ?? 100,
      }
    );
  },
};
