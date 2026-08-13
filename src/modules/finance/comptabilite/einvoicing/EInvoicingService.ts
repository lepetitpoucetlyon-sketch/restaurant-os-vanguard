import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { IEInvoicingProvider, InboundEInvoice } from './IEInvoicingProvider';
import type { InboundInvoiceStatus } from './InboundInvoiceSchema';
import { InboundInvoiceSchema } from './InboundInvoiceSchema';
import { MockEInvoicingProvider } from './MockEInvoicingProvider';

let provider: IEInvoicingProvider = new MockEInvoicingProvider();

export const EInvoicingService = {
  setProvider(p: IEInvoicingProvider): void {
    provider = p;
    logger.info(`[EInvoicing] Provider configuré : ${p.name}`);
  },

  getProvider(): IEInvoicingProvider {
    return provider;
  },

  async receiveInvoice(tenantId: string, invoice: InboundEInvoice): Promise<string> {
    const parsed = InboundInvoiceSchema.safeParse(invoice);
    if (!parsed.success) {
      logger.error('[EInvoicing] Facture entrante invalide', parsed.error.flatten());
      throw new Error(`Facture invalide : ${parsed.error.issues[0]?.message}`);
    }

    const invoiceId = invoice.providerInvoiceId;
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;

    const existing = await Nexus.adapter.get(path);
    if (existing) {
      logger.info(`[EInvoicing] Facture ${invoiceId} déjà reçue — idempotent`);
      return invoiceId;
    }

    const record = {
      ...parsed.data,
      id: invoiceId,
      tenantId,
      status: 'received' as InboundInvoiceStatus,
      receivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Nexus.adapter.set(path, record);

    await provider.acknowledgeReceipt(invoiceId, tenantId);

    await NexusEventBus.emitDurable('supplier.invoice_processed', {
      v: 1,
      tenantId,
      supplierId: invoice.seller.siret,
      invoiceId,
      lines: invoice.lines.map(l => ({
        stockItemId: l.description,
        unitCostInMicrounits: l.unitPriceHTInMicrounits,
      })),
      processedAt: Date.now(),
    });

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_RECEIVED',
      details: {
        tenantId,
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        seller: invoice.seller.name,
        totalTTC: invoice.totalTTCInMicrounits,
        format: invoice.format,
      },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(
      `[EInvoicing] Facture ${invoice.invoiceNumber} reçue de ${invoice.seller.name} — ` +
      `${(invoice.totalTTCInMicrounits / 1_000_000).toFixed(2)}€ TTC`
    );

    return invoiceId;
  },

  async updateStatus(
    tenantId: string,
    invoiceId: string,
    status: InboundInvoiceStatus,
    updatedBy: string,
    reason?: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    const existing = await Nexus.adapter.get(path);
    if (!existing) throw new Error(`Facture ${invoiceId} introuvable`);

    await Nexus.adapter.update(path, {
      status,
      updatedAt: new Date().toISOString(),
      updatedBy,
      ...(reason ? { statusReason: reason } : {}),
    });

    if (status === 'rejected') {
      await provider.rejectInvoice(invoiceId, tenantId, reason ?? 'Rejeté par le tenant');
    }

    empireAudit.log({
      module: 'finance',
      action: `EINVOICE_${status.toUpperCase()}`,
      details: { tenantId, invoiceId, updatedBy, reason },
      severity: status === 'rejected' ? 'medium' : 'low',
      timestamp: new Date(),
    });
  },

  async fetchFromProvider(tenantId: string, providerInvoiceId: string): Promise<InboundEInvoice> {
    return provider.fetchInvoice(providerInvoiceId, tenantId);
  },

  async syncPending(tenantId: string): Promise<number> {
    const pending = await provider.listPendingInvoices(tenantId);
    let count = 0;
    for (const invoice of pending) {
      try {
        await this.receiveInvoice(tenantId, invoice);
        count++;
      } catch (err) {
        logger.error(`[EInvoicing] Erreur réception ${invoice.invoiceNumber}`, err);
      }
    }
    logger.info(`[EInvoicing] Sync terminé : ${count}/${pending.length} factures reçues`);
    return count;
  },
};
