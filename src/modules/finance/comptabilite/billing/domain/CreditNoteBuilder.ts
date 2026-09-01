import { Nexus } from '@/lib/nexus/NexusAdapter';
import { SharedKernel } from '@/lib/shared-kernel';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';
import type { GeneratedInvoice } from './types/invoice.types';
import { INVOICE_COLLECTION, getNextInvoiceNumber, computeInvoiceSeal } from './invoice-helpers';

export async function generateCreditNote(
  tenantId: string,
  originalInvoiceId: string,
  params: { reason: string; operatorId: string },
): Promise<GeneratedInvoice> {
  const original = await Nexus.adapter.get<GeneratedInvoice>(
    `tenants/${tenantId}/${INVOICE_COLLECTION}/${originalInvoiceId}`
  );
  if (!original) throw new Error(`Invoice ${originalInvoiceId} not found`);
  if (original.status === 'cancelled') throw new Error(`Invoice ${originalInvoiceId} already cancelled`);

  const origSubMu = original.subTotalInMicrounits ?? (original.subTotalInCents ?? 0) * 10_000;
  const origTaxMu = original.taxTotalInMicrounits ?? (original.taxTotalInCents ?? 0) * 10_000;
  const origTotalMu = original.totalInMicrounits ?? (original.totalInCents ?? 0) * 10_000;

  const invoiceId = SharedKernel.generateId('AV');
  const now = new Date().toISOString();
  const year = new Date().getFullYear();
  const sequenceNumber = await getNextInvoiceNumber(tenantId, year);
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
    seal: await computeInvoiceSeal(invoiceId, invoiceNumber, -origTotalMu, original.taxDetails, now),
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
}
