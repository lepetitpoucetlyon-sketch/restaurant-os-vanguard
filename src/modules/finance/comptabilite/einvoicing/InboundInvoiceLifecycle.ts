import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { InboundInvoiceStatus } from './InboundInvoiceSchema';
import { EInvoicingService } from './EInvoicingService';

export interface InboundInvoiceRecord {
  id: string;
  tenantId: string;
  providerInvoiceId: string;
  invoiceNumber: string;
  status: InboundInvoiceStatus;
  seller: { name: string; siret: string };
  totalHTInMicrounits: number;
  totalVATInMicrounits: number;
  totalTTCInMicrounits: number;
  dueDate?: string;
  receivedAt: string;
  validatedAt?: string;
  validatedBy?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  paidAt?: string;
  paidBy?: string;
  paymentReference?: string;
  linkedDeliveryNoteId?: string;
  linkedPurchaseOrderId?: string;
  threeWayMatchStatus?: 'pending' | 'matched' | 'discrepancy';
}

const VALID_TRANSITIONS: Record<string, InboundInvoiceStatus[]> = {
  received: ['validated', 'rejected'],
  validated: ['approved', 'rejected'],
  approved: ['paid', 'disputed'],
  rejected: [],
  paid: ['disputed'],
  disputed: ['approved', 'rejected'],
};

function assertTransition(current: InboundInvoiceStatus, target: InboundInvoiceStatus): void {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed || !allowed.includes(target)) {
    throw new Error(`Transition invalide : ${current} → ${target}`);
  }
}

export const InboundInvoiceLifecycle = {

  async validate(
    tenantId: string,
    invoiceId: string,
    validatedBy: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    const invoice = await Nexus.adapter.get<InboundInvoiceRecord>(path);
    if (!invoice) throw new Error(`Facture ${invoiceId} introuvable`);
    assertTransition(invoice.status, 'validated');

    await Nexus.adapter.update(path, {
      status: 'validated' as InboundInvoiceStatus,
      validatedAt: new Date().toISOString(),
      validatedBy,
      updatedAt: new Date().toISOString(),
    });

    await NexusEventBus.emitDurable('einvoice.validated', {
      v: 1,
      tenantId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      totalTTCInMicrounits: invoice.totalTTCInMicrounits,
      validatedBy,
    });

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_VALIDATED',
      details: { tenantId, invoiceId, validatedBy },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[EInvoiceLifecycle] Facture ${invoiceId} validée par ${validatedBy}`);
  },

  async approve(
    tenantId: string,
    invoiceId: string,
    approvedBy: string,
    deliveryNoteId?: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    const invoice = await Nexus.adapter.get<InboundInvoiceRecord>(path);
    if (!invoice) throw new Error(`Facture ${invoiceId} introuvable`);
    assertTransition(invoice.status, 'approved');

    await Nexus.adapter.update(path, {
      status: 'approved' as InboundInvoiceStatus,
      approvedAt: new Date().toISOString(),
      approvedBy,
      ...(deliveryNoteId ? { linkedDeliveryNoteId: deliveryNoteId } : {}),
      updatedAt: new Date().toISOString(),
    });

    await NexusEventBus.emitDurable('finance.invoice_approved', {
      v: 1,
      tenantId,
      invoiceId,
      supplierId: invoice.seller.siret,
      amountInMicrounits: invoice.totalTTCInMicrounits,
      approvedBy,
    });

    await NexusEventBus.emitDurable('einvoice.approved', {
      v: 1,
      tenantId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      totalHTInMicrounits: invoice.totalHTInMicrounits,
      totalTTCInMicrounits: invoice.totalTTCInMicrounits,
      dueDate: invoice.dueDate,
      supplierId: invoice.seller.siret,
      supplierName: invoice.seller.name,
      approvedBy,
    });

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_APPROVED',
      details: { tenantId, invoiceId, approvedBy, deliveryNoteId },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(`[EInvoiceLifecycle] Facture ${invoiceId} approuvée par ${approvedBy}`);
  },

  async reject(
    tenantId: string,
    invoiceId: string,
    rejectedBy: string,
    reason: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    const invoice = await Nexus.adapter.get<InboundInvoiceRecord>(path);
    if (!invoice) throw new Error(`Facture ${invoiceId} introuvable`);
    assertTransition(invoice.status, 'rejected');

    await Nexus.adapter.update(path, {
      status: 'rejected' as InboundInvoiceStatus,
      rejectedAt: new Date().toISOString(),
      rejectedBy,
      rejectionReason: reason,
      updatedAt: new Date().toISOString(),
    });

    const provider = EInvoicingService.getProvider();
    await provider.rejectInvoice(invoice.providerInvoiceId, tenantId, reason);

    await NexusEventBus.emitDurable('einvoice.rejected', {
      v: 1,
      tenantId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      totalTTCInMicrounits: invoice.totalTTCInMicrounits,
      dueDate: invoice.dueDate,
      supplierId: invoice.seller.siret,
      supplierName: invoice.seller.name,
      rejectedBy,
      reason,
    });

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_REJECTED',
      details: { tenantId, invoiceId, rejectedBy, reason },
      severity: 'medium',
      timestamp: new Date(),
    });

    logger.info(`[EInvoiceLifecycle] Facture ${invoiceId} rejetée par ${rejectedBy} : ${reason}`);
  },

  async markPaid(
    tenantId: string,
    invoiceId: string,
    paidBy: string,
    paymentReference: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    const invoice = await Nexus.adapter.get<InboundInvoiceRecord>(path);
    if (!invoice) throw new Error(`Facture ${invoiceId} introuvable`);
    assertTransition(invoice.status, 'paid');

    await Nexus.adapter.update(path, {
      status: 'paid' as InboundInvoiceStatus,
      paidAt: new Date().toISOString(),
      paidBy,
      paymentReference,
      updatedAt: new Date().toISOString(),
    });

    await NexusEventBus.emitDurable('einvoice.paid', {
      v: 1,
      tenantId,
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      totalTTCInMicrounits: invoice.totalTTCInMicrounits,
      supplierId: invoice.seller.siret,
      paidBy,
      paymentReference,
    });

    empireAudit.log({
      module: 'finance',
      action: 'EINVOICE_PAID',
      details: { tenantId, invoiceId, paidBy, paymentReference },
      severity: 'medium',
      timestamp: new Date(),
    });
  },

  async linkDeliveryNote(
    tenantId: string,
    invoiceId: string,
    deliveryNoteId: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    await Nexus.adapter.update(path, {
      linkedDeliveryNoteId: deliveryNoteId,
      updatedAt: new Date().toISOString(),
    });
  },

  async linkPurchaseOrder(
    tenantId: string,
    invoiceId: string,
    purchaseOrderId: string,
  ): Promise<void> {
    const path = `tenants/${tenantId}/inboundInvoices/${invoiceId}`;
    await Nexus.adapter.update(path, {
      linkedPurchaseOrderId: purchaseOrderId,
      updatedAt: new Date().toISOString(),
    });
  },

  async getInvoice(
    tenantId: string,
    invoiceId: string,
  ): Promise<InboundInvoiceRecord | null> {
    return Nexus.adapter.get<InboundInvoiceRecord>(
      `tenants/${tenantId}/inboundInvoices/${invoiceId}`,
    );
  },

  async listInvoices(
    tenantId: string,
    status?: InboundInvoiceStatus,
  ): Promise<InboundInvoiceRecord[]> {
    const path = `tenants/${tenantId}/inboundInvoices`;
    if (status) {
      return Nexus.adapter.query<InboundInvoiceRecord>(path, {
        where: [{ field: 'status', operator: '==', value: status }],
      });
    }
    return Nexus.adapter.query<InboundInvoiceRecord>(path);
  },
};
