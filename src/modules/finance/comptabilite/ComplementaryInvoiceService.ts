/**
 * L23 — Facture complémentaire nominative à J+3.
 *
 * Art. 289 CGI + BOI-TVA-DECLA-30-10-20 :
 * Lorsqu'un client professionnel demande une facture nominative après
 * un paiement au ticket (B2C→B2B), le restaurateur a 3 jours ouvrés
 * pour l'émettre. Au-delà, il y a risque de redressement TVA (la TVA
 * est due dès l'encaissement même sans facture).
 *
 * Ce service crée la facture complémentaire et enregistre la deadline J+3.
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L23.
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';
import { OutboxService, OutboxPriority } from '@/lib/offline/OutboxService';

export interface ComplementaryInvoiceRequest {
  tenantId: string;
  originalOrderId: string;
  originalSealId: string;
  customerSiret?: string;
  customerName: string;
  customerVatNumber?: string;
  customerAddress: string;
  requestedBy: string;
  now?: number;
}

export interface ComplementaryInvoice {
  id: string;
  tenantId: string;
  originalOrderId: string;
  originalSealId: string;
  customerName: string;
  customerSiret?: string;
  customerVatNumber?: string;
  customerAddress: string;
  invoiceNumber: string;
  issuedAt: number;
  deadlineAt: number;
  legalRef: 'Art. 289 CGI';
  status: 'pending' | 'sent' | 'overdue';
}

function addWorkingDays(fromMs: number, days: number): number {
  let d = new Date(fromMs);
  let added = 0;
  while (added < days) {
    d = new Date(d.getTime() + 86400_000);
    if (d.getDay() !== 0 && d.getDay() !== 6) added++;
  }
  return d.getTime();
}

export class ComplementaryInvoiceService {
  private static path(tenantId: string, id: string): string {
    return `tenants/${tenantId}/complementary_invoices/${id}`;
  }

  static async create(input: ComplementaryInvoiceRequest): Promise<ComplementaryInvoice> {
    const now = input.now ?? Date.now();
    const seq = Math.floor(now / 1000) % 1_000_000;
    const id = `CI-${input.originalOrderId}-${now}`;
    const deadlineAt = addWorkingDays(now, 3);

    const invoice: ComplementaryInvoice = {
      id,
      tenantId: input.tenantId,
      originalOrderId: input.originalOrderId,
      originalSealId: input.originalSealId,
      customerName: input.customerName,
      customerSiret: input.customerSiret,
      customerVatNumber: input.customerVatNumber,
      customerAddress: input.customerAddress,
      invoiceNumber: `FC-${String(seq).padStart(6, '0')}`,
      issuedAt: now,
      deadlineAt,
      legalRef: 'Art. 289 CGI',
      status: 'pending',
    };

    await Nexus.adapter.set(this.path(input.tenantId, id), invoice);
    await OutboxService.enqueue({
      action: 'CREATE',
      collection: `tenants/${input.tenantId}/complementary_invoices`,
      targetId: id,
      priority: OutboxPriority.FISCAL,
      payload: invoice as unknown as Record<string, unknown>,
    }).catch(() => 0);

    await AuditLogger.logAction(
      input.requestedBy,
      'ADVANCE_INVOICE_ISSUED',
      input.originalOrderId,
      { invoiceId: id, customerName: input.customerName, deadlineAt },
    ).catch(() => null);

    await NexusEventBus.emit('finance.complementary_invoice_created', {
      v: 1,
      tenantId: input.tenantId,
      invoiceId: id,
      originalOrderId: input.originalOrderId,
      customerName: input.customerName,
      deadlineAt,
      createdAt: now,
    }).catch(() => null);

    return invoice;
  }

  static async checkOverdue(tenantId: string, now?: number): Promise<{ overdueIds: string[] }> {
    const ts = now ?? Date.now();
    const all = await Nexus.adapter.query<ComplementaryInvoice>(
      `tenants/${tenantId}/complementary_invoices`,
    );
    const overdue = all.filter(i => i.status === 'pending' && i.deadlineAt < ts);
    for (const inv of overdue) {
      await Nexus.adapter.set(this.path(tenantId, inv.id), { ...inv, status: 'overdue' });
    }
    return { overdueIds: overdue.map(i => i.id) };
  }
}
