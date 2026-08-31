import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { IEInvoicingProvider, InboundEInvoice, OutboundEInvoice } from './IEInvoicingProvider';
import type { InboundInvoiceStatus } from './InboundInvoiceSchema';
import { InboundInvoiceSchema } from './InboundInvoiceSchema';
import { OutboundInvoiceSchema } from './OutboundInvoiceSchema';
import type { OutboundInvoiceRecord } from './OutboundInvoiceSchema';
import { MockEInvoicingProvider } from './MockEInvoicingProvider';
import { EInvoiceProviderFactory } from './EInvoiceProviderFactory';
import type { EInvoiceProviderConfig, PlatformEInvoiceConfig } from './EInvoiceProviderConfig';
import {
  EInvoiceProviderConfigSchema,
  PlatformEInvoiceConfigSchema,
  PLATFORM_EINVOICE_CONFIG_PATH,
  tenantEInvoiceConfigPath,
} from './EInvoiceProviderConfig';

// Singleton fallback pour l'inbound webhook (avant résolution par tenant)
let _fallbackProvider: IEInvoicingProvider = new MockEInvoicingProvider();

export const EInvoicingService = {
  /** @deprecated Préférer EInvoiceProviderFactory.forTenant() — ce setter reste pour compatibilité tests. */
  setProvider(p: IEInvoicingProvider): void {
    _fallbackProvider = p;
    logger.info(`[EInvoicing] Provider fallback : ${p.name}`);
  },

  /** @deprecated Préférer EInvoiceProviderFactory.forTenant() */
  getProvider(): IEInvoicingProvider {
    return _fallbackProvider;
  },

  // ── Config PA (admin MCC) ─────────────────────────────────────────────────

  /**
   * Enregistre la config PA pour un tenant (override individuel).
   * Déclare automatiquement le SIRET auprès de la PA si première fois.
   */
  async configureForTenant(
    tenantId: string,
    config: EInvoiceProviderConfig,
    companyName: string,
  ): Promise<void> {
    const parsed = EInvoiceProviderConfigSchema.safeParse({
      ...config,
      updatedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      throw new Error(`Config e-invoicing invalide : ${parsed.error.issues[0]?.message}`);
    }
    await Nexus.adapter.set(tenantEInvoiceConfigPath(tenantId), parsed.data);

    if (!parsed.data.registeredWithPdp) {
      const p = await EInvoiceProviderFactory.forTenant(tenantId);
      await p.registerCompany(parsed.data.siret, companyName);
      await Nexus.adapter.update(tenantEInvoiceConfigPath(tenantId), {
        registeredWithPdp: true,
        registeredAt: new Date().toISOString(),
      });
    }

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_PROVIDER_CONFIGURED',
      details: { tenantId, providerId: parsed.data.providerId, siret: parsed.data.siret },
      severity: 'medium',
      timestamp: new Date(),
    });
    logger.info(`[EInvoicing] Provider ${parsed.data.providerId} configuré pour tenant ${tenantId}`);
  },

  /**
   * Enregistre la config PA pour la plateforme (facturation SaaS + mode multi-entreprise).
   * Accès réservé MCC.
   */
  async configurePlatform(config: PlatformEInvoiceConfig): Promise<void> {
    const parsed = PlatformEInvoiceConfigSchema.safeParse({
      ...config,
      updatedAt: new Date().toISOString(),
    });
    if (!parsed.success) {
      throw new Error(`Config plateforme invalide : ${parsed.error.issues[0]?.message}`);
    }
    await Nexus.adapter.set(PLATFORM_EINVOICE_CONFIG_PATH, parsed.data);

    if (!parsed.data.registeredWithPdp) {
      const p = await EInvoiceProviderFactory.forPlatform();
      await p.registerCompany(parsed.data.siret, parsed.data.platformName);
      await Nexus.adapter.update(PLATFORM_EINVOICE_CONFIG_PATH, {
        registeredWithPdp: true,
        registeredAt: new Date().toISOString(),
      });
    }

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_PLATFORM_CONFIGURED',
      details: { providerId: parsed.data.providerId, siret: parsed.data.siret },
      severity: 'high',
      timestamp: new Date(),
    });
    logger.info(`[EInvoicing] Config plateforme ${parsed.data.providerId} enregistrée`);
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

    const p0 = await EInvoiceProviderFactory.forTenant(tenantId);
    await p0.acknowledgeReceipt(invoiceId, tenantId);

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
      const p1 = await EInvoiceProviderFactory.forTenant(tenantId);
      await p1.rejectInvoice(invoiceId, tenantId, reason ?? 'Rejeté par le tenant');
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
    const p2 = await EInvoiceProviderFactory.forTenant(tenantId);
    return p2.fetchInvoice(providerInvoiceId, tenantId);
  },

  async syncPending(tenantId: string): Promise<number> {
    const p = await EInvoiceProviderFactory.forTenant(tenantId);
    const pending = await p.listPendingInvoices(tenantId);
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

  // ── Outbound (émission) ──────────────────────────────────────────────────

  /**
   * Émet une facture B2B ou B2G via la PA configurée pour ce tenant.
   *
   * Cas d'usage :
   *  - Ticket POS > 150€ HT vers un client professionnel
   *  - Facture d'acompte, avoir, etc.
   *
   * Idempotent sur `internalRef` (réponse immédiate si déjà émise).
   */
  async emitInvoice(tenantId: string, invoice: OutboundEInvoice): Promise<string> {
    const parsed = OutboundInvoiceSchema.safeParse(invoice);
    if (!parsed.success) {
      throw new Error(`Facture émise invalide : ${parsed.error.issues[0]?.message}`);
    }

    // Idempotence sur internalRef
    const existingPath = `tenants/${tenantId}/outboundInvoices/${invoice.internalRef}`;
    const existing = await Nexus.adapter.get<OutboundInvoiceRecord>(existingPath);
    if (existing) {
      logger.info(`[EInvoicing] Émission idempotente ${invoice.internalRef} — déjà émise`);
      return existing.providerInvoiceId;
    }

    const p = await EInvoiceProviderFactory.forTenant(tenantId);
    const { providerInvoiceId, status } = await p.emitInvoice(parsed.data);

    const record: OutboundInvoiceRecord = {
      id: invoice.internalRef,
      tenantId,
      providerInvoiceId,
      internalRef: invoice.internalRef,
      invoiceNumber: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      clientType: invoice.clientType,
      buyerSiret: invoice.buyer.siret,
      buyerName: invoice.buyer.name,
      totalHTInMicrounits: invoice.totalHTInMicrounits,
      totalVATInMicrounits: invoice.totalVATInMicrounits,
      totalTTCInMicrounits: invoice.totalTTCInMicrounits,
      status,
      statusHistory: [{ status, at: new Date().toISOString(), source: 'webhook' }],
      emittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await Nexus.adapter.set(existingPath, record);

    await NexusEventBus.emitDurable('einvoice.outbound_emitted', {
      v: 1,
      tenantId,
      internalRef: invoice.internalRef,
      providerInvoiceId,
      invoiceNumber: invoice.invoiceNumber,
      buyerSiret: invoice.buyer.siret,
      totalHTInMicrounits: invoice.totalHTInMicrounits,
      totalTTCInMicrounits: invoice.totalTTCInMicrounits,
      clientType: invoice.clientType,
    });

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_EMITTED',
      details: {
        tenantId,
        internalRef: invoice.internalRef,
        providerInvoiceId,
        buyer: invoice.buyer.name,
        totalHT: invoice.totalHTInMicrounits,
        clientType: invoice.clientType,
      },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(
      `[EInvoicing] Facture ${invoice.invoiceNumber} émise → PA ${providerInvoiceId} [${status}]`
    );

    return providerInvoiceId;
  },

  /**
   * Met à jour le statut d'une facture émise (appelé par le webhook outbound).
   * Append-only sur statusHistory (pas de delete/update de l'historique).
   */
  async updateOutboundStatus(
    tenantId: string,
    internalRef: string,
    newStatus: OutboundInvoiceRecord['status'],
    source: 'webhook' | 'poll',
  ): Promise<void> {
    const path = `tenants/${tenantId}/outboundInvoices/${internalRef}`;
    const record = await Nexus.adapter.get<OutboundInvoiceRecord>(path);
    if (!record) {
      logger.warn(`[EInvoicing] updateOutboundStatus — facture ${internalRef} introuvable`);
      return;
    }

    const history = [
      ...(record.statusHistory ?? []),
      { status: newStatus, at: new Date().toISOString(), source },
    ];

    await Nexus.adapter.update(path, {
      status: newStatus,
      statusHistory: history,
      updatedAt: new Date().toISOString(),
    });

    await NexusEventBus.emitDurable('einvoice.outbound_status_updated', {
      v: 1,
      tenantId,
      internalRef,
      providerInvoiceId: record.providerInvoiceId,
      invoiceNumber: record.invoiceNumber,
      newStatus,
      totalTTCInMicrounits: record.totalTTCInMicrounits,
    });

    logger.info(`[EInvoicing] Facture émise ${internalRef} → ${newStatus}`);
  },

  async getOutboundInvoice(
    tenantId: string,
    internalRef: string,
  ): Promise<OutboundInvoiceRecord | null> {
    return Nexus.adapter.get<OutboundInvoiceRecord>(
      `tenants/${tenantId}/outboundInvoices/${internalRef}`,
    );
  },

  async listOutboundInvoices(
    tenantId: string,
    status?: OutboundInvoiceRecord['status'],
  ): Promise<OutboundInvoiceRecord[]> {
    const path = `tenants/${tenantId}/outboundInvoices`;
    if (status) {
      return Nexus.adapter.query<OutboundInvoiceRecord>(path, {
        where: [{ field: 'status', operator: '==', value: status }],
      });
    }
    return Nexus.adapter.query<OutboundInvoiceRecord>(path);
  },
};
