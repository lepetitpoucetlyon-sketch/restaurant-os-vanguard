import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { GeneratedInvoice } from './InvoiceService';
import { INVOICE_COLLECTION, buildDualTaxDetail, getNextInvoiceNumber, computeInvoiceSeal } from './invoice-helpers';

export async function generateDeposit(
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
  const sequenceNumber = await getNextInvoiceNumber(tenantId, year);
  const invoiceNumber = `AC-${year}-${String(sequenceNumber).padStart(6, '0')}`;

  const baseMu = params.depositAmountHTInMicrounits;
  const taxMu = Math.round(baseMu * params.taxRate / 100);
  const totalMu = baseMu + taxMu;
  const taxDetail = buildDualTaxDetail(params.taxRate, baseMu, taxMu);

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
    taxDetails: [taxDetail],
    status: 'issued',
    issuedAt: now,
    seal: await computeInvoiceSeal(invoiceId, invoiceNumber, totalMu, [taxDetail], now),
  };

  await Nexus.adapter.set(`tenants/${tenantId}/${INVOICE_COLLECTION}/${invoiceId}`, deposit);

  empireAudit.log({
    module: 'finance',
    action: 'DEPOSIT_INVOICE_GENERATED',
    severity: 'low',
    timestamp: new Date(),
    details: { depositId: invoiceId, invoiceNumber, groupId: params.groupId, totalMu, customerName: params.customerName },
  });

  logger.info(`[InvoiceService] Acompte ${invoiceNumber} — groupe ${params.groupId} (${totalMu}µ)`);
  return deposit;
}

export async function convertQuoteToInvoice(
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
  const sequenceNumber = await getNextInvoiceNumber(tenantId, year);
  const invoiceNumber = `FACT-${year}-${String(sequenceNumber).padStart(6, '0')}`;

  const subTotalMu = Math.round(quote.total * 1_000_000);
  const taxMu = Math.round(subTotalMu * 0.2);
  const totalMu = subTotalMu + taxMu;
  const taxDetail = buildDualTaxDetail(20, subTotalMu, taxMu);

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
    taxDetails: [taxDetail],
    status: 'issued',
    issuedAt: now,
    seal: await computeInvoiceSeal(invoiceId, invoiceNumber, totalMu, [taxDetail], now),
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
    details: { invoiceId, invoiceNumber, quoteId, totalMu, customerName: quote.customerName },
  });

  logger.info(`[InvoiceService] Devis ${quoteId} → ${invoiceNumber} (${totalMu}µ)`);
  return invoice;
}
