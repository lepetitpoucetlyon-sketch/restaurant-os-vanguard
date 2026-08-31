import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireTenantRole, isDenied } from '@/lib/server/adminAuthGuard';
import { EInvoicingService } from '@/modules/finance';
import { OutboundInvoiceSchema } from '@/modules/finance';
import { z } from 'zod';

const ListQuerySchema = z.object({
  status: z.enum([
    'draft', 'submitted', 'deposee', 'mise_a_disposition',
    'approuvee', 'refusee', 'encaissee', 'rejetee_dgfip',
  ]).optional(),
  internalRef: z.string().optional(),
});

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const caller = await requireTenantRole(req, 'directeur');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const body = await req.json();
    const parsed = OutboundInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Payload invalide' },
        { status: 400 },
      );
    }

    const providerInvoiceId = await EInvoicingService.emitInvoice(tenantId, parsed.data);
    return NextResponse.json({ ok: true, providerInvoiceId }, { status: 201 });
  } catch (err) {
    logger.error('[EInvoicing/outbound] POST', err);
    const message = err instanceof Error ? err.message : 'Erreur serveur';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const caller = await requireTenantRole(req, 'comptable');
    if (isDenied(caller)) return caller as NextResponse;
    const { tenantId } = caller;

    const url = new URL(req.url);
    const query = ListQuerySchema.safeParse({
      status: url.searchParams.get('status') ?? undefined,
      internalRef: url.searchParams.get('internalRef') ?? undefined,
    });
    if (!query.success) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    if (query.data.internalRef) {
      const invoice = await EInvoicingService.getOutboundInvoice(tenantId, query.data.internalRef);
      if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });
      return NextResponse.json(invoice);
    }

    const invoices = await EInvoicingService.listOutboundInvoices(tenantId, query.data.status);
    return NextResponse.json({ invoices, count: invoices.length });
  } catch (err) {
    logger.error('[EInvoicing/outbound] GET', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
