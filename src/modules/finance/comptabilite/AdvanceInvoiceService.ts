/**
 * L21 — Facture d'acompte avec TVA immédiate (Art. 268 ter CGI — réforme 2023).
 *
 * Avant 2023 : la TVA sur un acompte était différée à la livraison du service.
 * Depuis le 1er janvier 2023 : dès l'encaissement d'un acompte, une facture
 * d'acompte avec ventilation TVA doit être émise (justiciable Art. 1770 CGI
 * pour chaque mois de retard).
 *
 * Ce service crée la facture d'acompte et la scelle via Outbox FISCAL.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L21 (CRITIQUE).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';
import { AuditLogger } from '@/modules/compliance/securite/AuditLogger';

export interface AdvanceInvoiceLine {
  description: string;
  amountInMicrounits: number;
  taxRate: string;
}

export interface AdvanceInvoice {
  id: string;
  tenantId: string;
  orderId: string;
  invoiceNumber: string;
  issuedAt: number;
  issuedBy: string;
  lines: AdvanceInvoiceLine[];
  subtotalInMicrounits: number;
  tvaInMicrounits: number;
  totalInMicrounits: number;
  tvaBreakdown: Record<string, number>;
  legalRef: 'Art. 268 ter CGI';
}

function computeTotals(lines: AdvanceInvoiceLine[]): {
  subtotal: number; tva: number; total: number; breakdown: Record<string, number>;
} {
  let subtotal = 0;
  let tva = 0;
  const breakdown: Record<string, number> = {};
  for (const l of lines) {
    const rate = parseFloat(l.taxRate);
    const lineTva = Math.round(l.amountInMicrounits * rate);
    subtotal += l.amountInMicrounits;
    tva += lineTva;
    breakdown[l.taxRate] = (breakdown[l.taxRate] ?? 0) + lineTva;
  }
  return { subtotal, tva, total: subtotal + tva, breakdown };
}

export class AdvanceInvoiceService {
  private static path(tenantId: string, invoiceId: string): string {
    return `tenants/${tenantId}/advance_invoices/${invoiceId}`;
  }

  static async issueOnDeposit(input: {
    tenantId: string;
    orderId: string;
    issuedBy: string;
    lines: AdvanceInvoiceLine[];
    invoiceNumberSeq: number;
    now?: number;
  }): Promise<AdvanceInvoice> {
    if (input.lines.length === 0) throw new Error('AdvanceInvoice: au moins 1 ligne requise');
    const now = input.now ?? Date.now();
    const { subtotal, tva, total, breakdown } = computeTotals(input.lines);
    const invoiceId = `ainv_${input.orderId}_${now}`;
    const invoice: AdvanceInvoice = {
      id: invoiceId,
      tenantId: input.tenantId,
      orderId: input.orderId,
      invoiceNumber: `FA-${String(input.invoiceNumberSeq).padStart(6, '0')}`,
      issuedAt: now,
      issuedBy: input.issuedBy,
      lines: input.lines,
      subtotalInMicrounits: subtotal,
      tvaInMicrounits: tva,
      totalInMicrounits: total,
      tvaBreakdown: breakdown,
      legalRef: 'Art. 268 ter CGI',
    };

    await Nexus.adapter.set(this.path(input.tenantId, invoiceId), invoice);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/advance_invoices`,
      targetId: invoiceId,
      priority: OutboxPriority.FISCAL,
      payload: invoice as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.issuedBy,
      'ADVANCE_INVOICE_ISSUED',
      invoiceId,
      { orderId: input.orderId, total, tva, legalRef: 'Art. 268 ter CGI' },
    ).catch(() => null);

    await NexusEventBus.emit('finance.advance_invoice_issued', {
      v: 1,
      tenantId: input.tenantId,
      invoiceId,
      orderId: input.orderId,
      amountInMicrounits: subtotal,
      tvaInMicrounits: tva,
      issuedAt: now,
    });

    return invoice;
  }
}
