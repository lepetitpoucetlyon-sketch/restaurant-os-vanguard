import { createHmac } from 'crypto';
import { logger } from '@/lib/logger';
import type {
  IEInvoicingProvider,
  InboundEInvoice,
  OutboundEInvoice,
  OutboundEmitResult,
  OutboundEInvoiceStatus,
  EInvoiceWebhookPayload,
} from './IEInvoicingProvider';

/**
 * SuperPdpProvider — Plateforme Agréée DGFiP (accréditation PA française).
 *
 * Endpoints sandbox : https://sandbox.superdp.fr/api/v1
 * Endpoints prod    : https://api.superdp.fr/api/v1
 *
 * Authentification : Bearer {apiKey} dans le header Authorization.
 * Idempotence : envoyer X-Idempotency-Key = internalRef sur POST /invoices.
 *
 * Pour obtenir les credentials :
 *   1. S'inscrire sur https://superdp.fr (compte développeur)
 *   2. Signer le contrat PA
 *   3. Récupérer apiKey + webhookSecret dans le tableau de bord
 *   4. Configurer via POST /api/einvoicing/configure (MCC admin uniquement)
 */
export class SuperPdpProvider implements IEInvoicingProvider {
  readonly name = 'super-pdp';

  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    private readonly sandboxMode: boolean = true,
  ) {
    this.baseUrl = sandboxMode
      ? 'https://sandbox.superdp.fr/api/v1'
      : 'https://api.superdp.fr/api/v1';
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  // ── Inbound ──────────────────────────────────────────────────────────────

  verifyWebhookSignature(payload: EInvoiceWebhookPayload, secret: string): boolean {
    const expected = createHmac('sha256', secret)
      .update(`${payload.eventType}:${payload.invoiceId}:${payload.timestamp}`)
      .digest('hex');
    return payload.signature === expected;
  }

  async fetchInvoice(providerInvoiceId: string): Promise<InboundEInvoice> {
    const res = await fetch(`${this.baseUrl}/invoices/${providerInvoiceId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`[SuperPDP] fetchInvoice ${providerInvoiceId} → ${res.status}`);
    }
    const data = await res.json() as Record<string, unknown>;
    return this.mapInbound(data);
  }

  async acknowledgeReceipt(providerInvoiceId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/invoices/${providerInvoiceId}/acknowledge`, {
      method: 'POST',
      headers: this.headers(),
    });
    if (!res.ok) {
      logger.warn(`[SuperPDP] acknowledgeReceipt ${providerInvoiceId} → ${res.status}`);
    }
  }

  async rejectInvoice(providerInvoiceId: string, _tenantId: string, reason: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/invoices/${providerInvoiceId}/reject`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) {
      throw new Error(`[SuperPDP] rejectInvoice ${providerInvoiceId} → ${res.status}`);
    }
  }

  async listPendingInvoices(_tenantId: string): Promise<InboundEInvoice[]> {
    const res = await fetch(`${this.baseUrl}/invoices?status=pending`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`[SuperPDP] listPendingInvoices → ${res.status}`);
    }
    const data = await res.json() as { invoices: Record<string, unknown>[] };
    return (data.invoices ?? []).map(i => this.mapInbound(i));
  }

  // ── Outbound ─────────────────────────────────────────────────────────────

  async registerCompany(siret: string, companyName: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/companies`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ siret, name: companyName, country: 'FR' }),
    });
    if (!res.ok && res.status !== 409) {
      // 409 = déjà enregistré → idempotent
      throw new Error(`[SuperPDP] registerCompany ${siret} → ${res.status}`);
    }
    logger.info(`[SuperPDP] Société ${siret} (${companyName}) enregistrée`);
  }

  async emitInvoice(invoice: OutboundEInvoice): Promise<OutboundEmitResult> {
    const res = await fetch(`${this.baseUrl}/invoices/outbound`, {
      method: 'POST',
      headers: {
        ...this.headers(),
        'X-Idempotency-Key': invoice.internalRef,
      },
      body: JSON.stringify(this.mapOutbound(invoice)),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`[SuperPDP] emitInvoice ${invoice.invoiceNumber} → ${res.status}: ${err}`);
    }
    const data = await res.json() as { id: string; status: string };
    logger.info(`[SuperPDP] Facture émise → provider ID ${data.id}`);
    return {
      providerInvoiceId: data.id,
      status: (data.status as OutboundEInvoiceStatus) ?? 'submitted',
    };
  }

  async getOutboundStatus(providerInvoiceId: string): Promise<OutboundEInvoiceStatus> {
    const res = await fetch(`${this.baseUrl}/invoices/outbound/${providerInvoiceId}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`[SuperPDP] getOutboundStatus ${providerInvoiceId} → ${res.status}`);
    }
    const data = await res.json() as { status: string };
    return (data.status as OutboundEInvoiceStatus) ?? 'submitted';
  }

  // ── Mappers ───────────────────────────────────────────────────────────────

  private mapInbound(raw: Record<string, unknown>): InboundEInvoice {
    // TODO: adapter aux champs réels de l'API Super PDP une fois la doc reçue
    return raw as unknown as InboundEInvoice;
  }

  private mapOutbound(invoice: OutboundEInvoice): Record<string, unknown> {
    return {
      reference: invoice.internalRef,
      number: invoice.invoiceNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      type: invoice.clientType === 'b2g' ? 'B2G' : 'B2B',
      seller: invoice.seller,
      buyer: invoice.buyer,
      lines: invoice.lines.map(l => ({
        description: l.description,
        quantity: l.quantity,
        unitPriceHt: l.unitPriceHTInMicrounits / 1_000_000,
        vatRate: l.vatRate,
        totalHt: l.totalHTInMicrounits / 1_000_000,
        totalTtc: l.totalTTCInMicrounits / 1_000_000,
      })),
      totalHt: invoice.totalHTInMicrounits / 1_000_000,
      totalVat: invoice.totalVATInMicrounits / 1_000_000,
      totalTtc: invoice.totalTTCInMicrounits / 1_000_000,
      currency: invoice.currency,
    };
  }
}
