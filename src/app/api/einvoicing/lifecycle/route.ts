import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { InboundInvoiceLifecycle } from '@/modules/finance';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { z } from 'zod';

const ActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('validate'),
    invoiceId: z.string().min(1),
  }),
  z.object({
    action: z.literal('approve'),
    invoiceId: z.string().min(1),
    deliveryNoteId: z.string().optional(),
  }),
  z.object({
    action: z.literal('reject'),
    invoiceId: z.string().min(1),
    reason: z.string().min(1, 'Motif de rejet requis'),
  }),
  z.object({
    action: z.literal('pay'),
    invoiceId: z.string().min(1),
    paymentReference: z.string().min(1, 'Référence de paiement requise'),
  }),
  z.object({
    action: z.literal('receive_goods'),
    invoiceId: z.string().min(1),
    items: z.array(z.object({
      productId: z.string().min(1),
      quantityReceived: z.number().min(0),
      quantityExpected: z.number().min(0),
      accepted: z.boolean(),
      rejectionReason: z.string().optional(),
    })).min(1),
  }),
]);

const ROLE_REQUIREMENTS = {
  validate: 'comptable',
  approve: 'directeur',
  reject: 'comptable',
  pay: 'directeur',
  receive_goods: 'chef_rang',
} as const;

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
        { status: 400 },
      );
    }

    const { action } = parsed.data;
    const minRole = ROLE_REQUIREMENTS[action];
    const caller = await requireTenantRole(req, minRole);
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId, uid } = caller;

    switch (parsed.data.action) {
      case 'validate': {
        await InboundInvoiceLifecycle.validate(tenantId, parsed.data.invoiceId, uid);
        return NextResponse.json({ ok: true, action: 'validated' });
      }

      case 'approve': {
        await InboundInvoiceLifecycle.approve(
          tenantId, parsed.data.invoiceId, uid, parsed.data.deliveryNoteId,
        );
        return NextResponse.json({ ok: true, action: 'approved' });
      }

      case 'reject': {
        await InboundInvoiceLifecycle.reject(
          tenantId, parsed.data.invoiceId, uid, parsed.data.reason,
        );
        return NextResponse.json({ ok: true, action: 'rejected' });
      }

      case 'pay': {
        await InboundInvoiceLifecycle.markPaid(
          tenantId, parsed.data.invoiceId, uid, parsed.data.paymentReference,
        );
        return NextResponse.json({ ok: true, action: 'paid' });
      }

      case 'receive_goods': {
        const dnId = `dn_${parsed.data.invoiceId}_${Date.now()}`;
        const allAccepted = parsed.data.items.every(i => i.accepted);

        await NexusEventBus.emitDurable('einvoice.goods_received', {
          v: 1,
          tenantId,
          invoiceId: parsed.data.invoiceId,
          deliveryNoteId: dnId,
          receivedBy: uid,
          items: parsed.data.items,
          allAccepted,
        });

        return NextResponse.json({ ok: true, action: 'goods_received', deliveryNoteId: dnId });
      }

      default:
        return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
    }
  } catch (err) {
    logger.error('[EInvoicing/lifecycle]', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    const status = message.includes('Transition invalide') ? 409 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const caller = await requireTenantRole(req, 'serveur');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const url = new URL(req.url);
    const invoiceId = url.searchParams.get('invoiceId');
    const status = url.searchParams.get('status');

    if (invoiceId) {
      const invoice = await InboundInvoiceLifecycle.getInvoice(tenantId, invoiceId);
      if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      return NextResponse.json(invoice);
    }

    const invoices = await InboundInvoiceLifecycle.listInvoices(
      tenantId,
      (status as 'received' | 'validated' | 'approved' | 'rejected' | 'paid' | 'disputed') ?? undefined,
    );

    return NextResponse.json({ invoices, count: invoices.length });
  } catch (err) {
    logger.error('[EInvoicing/lifecycle GET]', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
