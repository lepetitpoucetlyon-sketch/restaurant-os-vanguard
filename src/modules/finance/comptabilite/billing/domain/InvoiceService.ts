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

export type InvoiceType = 'invoice' | 'credit_note' | 'deposit' | 'from_quote';

export interface GeneratedInvoice extends LegalInvoice {
  sourceJournalEntryId: string;
  customerAddress?: string;
  customerSiret?: string;
  invoiceType?: InvoiceType;
  originalInvoiceId?: string;
  originalInvoiceNumber?: string;
  depositGroupId?: string;
  quoteId?: string;
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

  async generateCreditNote(
    tenantId: string,
    originalInvoiceId: string,
    params: { reason: string; operatorId: string },
  ): Promise<GeneratedInvoice> {
    const original = await this.getInvoice(tenantId, originalInvoiceId);
    if (!original) throw new Error(`Invoice ${originalInvoiceId} not found`);
    if (original.status === 'cancelled') throw new Error(`Invoice ${originalInvoiceId} already cancelled`);

    const origSubMu = original.subTotalInMicrounits ?? (original.subTotalInCents ?? 0) * 10_000;
    const origTaxMu = original.taxTotalInMicrounits ?? (original.taxTotalInCents ?? 0) * 10_000;
    const origTotalMu = original.totalInMicrounits ?? (original.totalInCents ?? 0) * 10_000;

    const invoiceId = SharedKernel.generateId('AV');
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const sequenceNumber = await this.getNextInvoiceNumber(tenantId, year);
    const invoiceNumber = `AV-${year}-${String(sequenceNumber).padStart(6, '0')}`;

    const creditNote: GeneratedInvoice = {
      id: invoiceId,
      createdAt: now,
      updatedAt: now,
      orderId: original.orderId,
      sourceJournalEntryId: original.sourceJournalEntryId,
      invoiceNumber,
      invoiceType: 'credit_note',
      originalInvoiceId: original.id,
      originalInvoiceNumber: original.invoiceNumber,
      customerName: original.customerName,
      customerAddress: original.customerAddress,
      customerSiret: original.customerSiret,
      subTotalInMicrounits: -origSubMu,
      subTotalInCents: -Math.round(origSubMu / 10_000),
      taxTotalInMicrounits: -origTaxMu,
      taxTotalInCents: -Math.round(origTaxMu / 10_000),
      totalInMicrounits: -origTotalMu,
      totalInCents: -Math.round(origTotalMu / 10_000),
      taxDetails: original.taxDetails.map(d => ({
        rate: d.rate,
        baseInMicrounits: -(d.baseInMicrounits ?? 0),
        baseInCents: -(d.baseInCents ?? 0),
        amountInMicrounits: -(d.amountInMicrounits ?? 0),
        amountInCents: -(d.amountInCents ?? 0),
      })),
      status: 'issued',
      issuedAt: now,
      seal: await this.computeSeal(invoiceId, invoiceNumber, -origTotalMu, original.taxDetails, now),
    };

    await Nexus.adapter.set(`tenants/${tenantId}/${INVOICE_COLLECTION}/${invoiceId}`, creditNote);

    empireAudit.log({
      module: 'finance',
      action: 'CREDIT_NOTE_GENERATED',
      severity: 'medium',
      timestamp: new Date(),
      details: {
        creditNoteId: invoiceId,
        creditNoteNumber: invoiceNumber,
        originalInvoiceId: original.id,
        originalInvoiceNumber: original.invoiceNumber,
        totalMu: -origTotalMu,
        reason: params.reason,
        operatorId: params.operatorId,
      },
    });

    logger.info(`[InvoiceService] Avoir ${invoiceNumber} émis pour ${original.invoiceNumber}`);
    return creditNote;
  },

  async generateDeposit(
    tenantId: string,
    params: {
      customerName: string;
      customerSiret?: string;
      depositAmountHTInMicrounits: number;
      taxRate: number;
      groupId: string;
      description?: string;
    },
  ): Promise<GeneratedInvoice> {
    const invoiceId = SharedKernel.generateId('AC');
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const sequenceNumber = await this.getNextInvoiceNumber(tenantId, year);
    const invoiceNumber = `AC-${year}-${String(sequenceNumber).padStart(6, '0')}`;

    const baseMu = params.depositAmountHTInMicrounits;
    const taxMu = Math.round(baseMu * params.taxRate / 100);
    const totalMu = baseMu + taxMu;

    const deposit: GeneratedInvoice = {
      id: invoiceId,
      createdAt: now,
      updatedAt: now,
      orderId: params.groupId,
      sourceJournalEntryId: '',
      invoiceNumber,
      invoiceType: 'deposit',
      depositGroupId: params.groupId,
      customerName: params.customerName,
      customerSiret: params.customerSiret,
      subTotalInMicrounits: baseMu,
      subTotalInCents: Math.round(baseMu / 10_000),
      taxTotalInMicrounits: taxMu,
      taxTotalInCents: Math.round(taxMu / 10_000),
      totalInMicrounits: totalMu,
      totalInCents: Math.round(totalMu / 10_000),
      taxDetails: [{
        rate: params.taxRate,
        baseInMicrounits: baseMu,
        baseInCents: Math.round(baseMu / 10_000),
        amountInMicrounits: taxMu,
        amountInCents: Math.round(taxMu / 10_000),
      }],
      status: 'issued',
      issuedAt: now,
      seal: await this.computeSeal(invoiceId, invoiceNumber, totalMu, [{
        rate: params.taxRate,
        baseInMicrounits: baseMu,
        baseInCents: Math.round(baseMu / 10_000),
        amountInMicrounits: taxMu,
        amountInCents: Math.round(taxMu / 10_000),
      }], now),
    };

    await Nexus.adapter.set(`tenants/${tenantId}/${INVOICE_COLLECTION}/${invoiceId}`, deposit);

    empireAudit.log({
      module: 'finance',
      action: 'DEPOSIT_INVOICE_GENERATED',
      severity: 'low',
      timestamp: new Date(),
      details: {
        depositId: invoiceId,
        invoiceNumber,
        groupId: params.groupId,
        totalMu,
        customerName: params.customerName,
      },
    });

    logger.info(`[InvoiceService] Acompte ${invoiceNumber} — groupe ${params.groupId} (${totalMu}µ)`);
    return deposit;
  },

  async convertQuoteToInvoice(
    tenantId: string,
    quoteId: string,
    params?: { customerSiret?: string },
  ): Promise<GeneratedInvoice> {
    const quote = await Nexus.adapter.get<{
      id: string;
      customerId: string;
      customerName: string;
      items: Array<{ id: string; name: string; quantity: number; price: number }>;
      total: number;
      status: string;
    }>(`tenants/${tenantId}/quotes/${quoteId}`);

    if (!quote) throw new Error(`Quote ${quoteId} not found`);
    if (quote.status !== 'accepted') throw new Error(`Quote ${quoteId} is ${quote.status}, must be accepted`);

    const invoiceId = SharedKernel.generateId('INV');
    const now = new Date().toISOString();
    const year = new Date().getFullYear();
    const sequenceNumber = await this.getNextInvoiceNumber(tenantId, year);
    const invoiceNumber = `FACT-${year}-${String(sequenceNumber).padStart(6, '0')}`;

    const subTotalMu = Math.round(quote.total * 1_000_000);
    const taxMu = Math.round(subTotalMu * 0.2);
    const totalMu = subTotalMu + taxMu;

    const invoice: GeneratedInvoice = {
      id: invoiceId,
      createdAt: now,
      updatedAt: now,
      orderId: quoteId,
      sourceJournalEntryId: '',
      invoiceNumber,
      invoiceType: 'from_quote',
      quoteId,
      customerName: quote.customerName,
      customerSiret: params?.customerSiret,
      subTotalInMicrounits: subTotalMu,
      subTotalInCents: Math.round(subTotalMu / 10_000),
      taxTotalInMicrounits: taxMu,
      taxTotalInCents: Math.round(taxMu / 10_000),
      totalInMicrounits: totalMu,
      totalInCents: Math.round(totalMu / 10_000),
      taxDetails: [{
        rate: 20,
        baseInMicrounits: subTotalMu,
        baseInCents: Math.round(subTotalMu / 10_000),
        amountInMicrounits: taxMu,
        amountInCents: Math.round(taxMu / 10_000),
      }],
      status: 'issued',
      issuedAt: now,
      seal: await this.computeSeal(invoiceId, invoiceNumber, totalMu, [{
        rate: 20,
        baseInMicrounits: subTotalMu,
        baseInCents: Math.round(subTotalMu / 10_000),
        amountInMicrounits: taxMu,
        amountInCents: Math.round(taxMu / 10_000),
      }], now),
    };

    await Nexus.adapter.set(`tenants/${tenantId}/${INVOICE_COLLECTION}/${invoiceId}`, invoice);

    await Nexus.adapter.set(`tenants/${tenantId}/quotes/${quoteId}`, {
      status: 'invoiced',
      invoiceId,
      invoiceNumber,
      invoicedAt: now,
    }, { merge: true } as Parameters<typeof Nexus.adapter.set>[2]);

    empireAudit.log({
      module: 'finance',
      action: 'QUOTE_CONVERTED_TO_INVOICE',
      severity: 'low',
      timestamp: new Date(),
      details: {
        invoiceId,
        invoiceNumber,
        quoteId,
        totalMu,
        customerName: quote.customerName,
      },
    });

    logger.info(`[InvoiceService] Devis ${quoteId} → ${invoiceNumber} (${totalMu}µ)`);
    return invoice;
  },
};
