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
 * DirectApiEInvoicingProvider — Option 2 : Connecteur API Directe / Passerelle Métier.
 *
 * Permet aux marchands ou entreprises d'émettre et recevoir des flux Factur-X / UBL
 * via leur propre API d'entreprise, connecteur comptable interne ou Chorus Pro / PPF direct.
 */
export class DirectApiEInvoicingProvider implements IEInvoicingProvider {
  readonly name = 'direct-api';

  private readonly baseUrl: string;

  constructor(
    private readonly apiKey: string,
    customEndpointUrl?: string,
    private readonly sandboxMode: boolean = true,
  ) {
    this.baseUrl = customEndpointUrl || (sandboxMode
      ? 'https://sandbox-gateway.restaurant-os.internal/api/v1/einvoicing'
      : 'https://gateway.restaurant-os.internal/api/v1/einvoicing');
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Connector-Version': '2.0.0',
    };
  }

  // ── Inbound ──────────────────────────────────────────────────────────────

  verifyWebhookSignature(payload: EInvoiceWebhookPayload, secret: string): boolean {
    const message = `${payload.eventType}:${payload.invoiceId}:${payload.timestamp}`;
    const expected = createHmac('sha256', secret).update(message).digest('hex');
    return payload.signature === expected;
  }

  async fetchInvoice(providerInvoiceId: string, tenantId: string): Promise<InboundEInvoice> {
    const res = await fetch(`${this.baseUrl}/inbound/${providerInvoiceId}?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`[DirectApiProvider] fetchInvoice ${providerInvoiceId} → ${res.status}`);
    }
    const data = (await res.json()) as Record<string, unknown>;
    return this.mapInbound(data);
  }

  async acknowledgeReceipt(providerInvoiceId: string, tenantId: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/inbound/${providerInvoiceId}/acknowledge`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ tenantId, acknowledgedAt: new Date().toISOString() }),
    });
    if (!res.ok) {
      throw new Error(`[DirectApiProvider] acknowledgeReceipt ${providerInvoiceId} → ${res.status}`);
    }
  }

  async rejectInvoice(
    providerInvoiceId: string,
    tenantId: string,
    reason: string,
  ): Promise<void> {
    const res = await fetch(`${this.baseUrl}/inbound/${providerInvoiceId}/reject`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ tenantId, reason, rejectedAt: new Date().toISOString() }),
    });
    if (!res.ok) {
      throw new Error(`[DirectApiProvider] rejectInvoice ${providerInvoiceId} → ${res.status}`);
    }
  }

  async listPendingInvoices(tenantId: string): Promise<InboundEInvoice[]> {
    const res = await fetch(`${this.baseUrl}/inbound/pending?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`[DirectApiProvider] listPendingInvoices → ${res.status}`);
    }
    const data = (await res.json()) as { invoices: Record<string, unknown>[] };
    return (data.invoices || []).map(inv => this.mapInbound(inv));
  }

  // ── Outbound ─────────────────────────────────────────────────────────────

  async registerCompany(siret: string, companyName: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/companies/register`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({ siret, companyName, registeredAt: new Date().toISOString() }),
    });
    if (!res.ok && res.status !== 409) {
      // 409 = déjà enregistré, non bloquant
      throw new Error(`[DirectApiProvider] registerCompany ${siret} → ${res.status}`);
    }
    logger.info(`[DirectApiProvider] Société enregistrée sur passerelle directe : ${companyName} (${siret})`);
  }

  async emitInvoice(invoice: OutboundEInvoice): Promise<OutboundEmitResult> {
    const res = await fetch(`${this.baseUrl}/outbound/invoices`, {
      method: 'POST',
      headers: {
        ...this.headers(),
        'X-Idempotency-Key': invoice.internalRef,
      },
      body: JSON.stringify(invoice),
    });
    if (!res.ok) {
      const err = await res.text().catch(() => '');
      throw new Error(`[DirectApiProvider] emitInvoice ${invoice.invoiceNumber} → ${res.status} : ${err}`);
    }
    const data = (await res.json()) as { providerInvoiceId: string; status: OutboundEInvoiceStatus };
    return {
      providerInvoiceId: data.providerInvoiceId,
      status: data.status || 'submitted',
    };
  }

  async getOutboundStatus(providerInvoiceId: string): Promise<OutboundEInvoiceStatus> {
    const res = await fetch(`${this.baseUrl}/outbound/invoices/${providerInvoiceId}/status`, {
      headers: this.headers(),
    });
    if (!res.ok) {
      throw new Error(`[DirectApiProvider] getOutboundStatus ${providerInvoiceId} → ${res.status}`);
    }
    const data = (await res.json()) as { status: OutboundEInvoiceStatus };
    return data.status;
  }

  // ── Private mapping ──────────────────────────────────────────────────────

  private mapParty(p?: Record<string, string>): InboundEInvoice['seller'] {
    const raw = p ?? {};
    return {
      name: raw.name ?? '',
      siret: raw.siret ?? '',
      vatNumber: raw.vatNumber,
      address: raw.address ?? '',
      country: raw.country ?? 'FR',
    };
  }

  private mapLine(l: Record<string, unknown>): InboundEInvoice['lines'][number] {
    return {
      description: String(l.description ?? ''),
      quantity: Number(l.quantity ?? 1),
      unitPriceHTInMicrounits: Number(l.unitPriceHTInMicrounits ?? 0),
      vatRate: Number(l.vatRate ?? 0),
      totalHTInMicrounits: Number(l.totalHTInMicrounits ?? 0),
      totalTTCInMicrounits: Number(l.totalTTCInMicrounits ?? 0),
    };
  }

  private mapInbound(data: Record<string, unknown>): InboundEInvoice {
    const lines = (data.lines as Record<string, unknown>[]) ?? [];

    return {
      providerInvoiceId: String(data.providerInvoiceId ?? data.id ?? ''),
      invoiceNumber: String(data.invoiceNumber ?? ''),
      issueDate: String(data.issueDate ?? ''),
      dueDate: data.dueDate ? String(data.dueDate) : undefined,
      format: (data.format as InboundEInvoice['format']) ?? 'factur-x',
      seller: this.mapParty(data.seller as Record<string, string>),
      buyer: this.mapParty(data.buyer as Record<string, string>),
      lines: lines.map(l => this.mapLine(l)),
      totalHTInMicrounits: Number(data.totalHTInMicrounits ?? 0),
      totalVATInMicrounits: Number(data.totalVATInMicrounits ?? 0),
      totalTTCInMicrounits: Number(data.totalTTCInMicrounits ?? 0),
      currency: String(data.currency ?? 'EUR'),
      rawXml: data.rawXml ? String(data.rawXml) : undefined,
      pdfUrl: data.pdfUrl ? String(data.pdfUrl) : undefined,
    };
  }
}
