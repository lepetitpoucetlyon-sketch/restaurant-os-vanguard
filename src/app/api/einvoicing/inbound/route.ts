import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { EInvoicingService } from '@/modules/finance/comptabilite/einvoicing';
import type { EInvoiceWebhookPayload } from '@/modules/finance/comptabilite/einvoicing';
import { parseEInvoiceXml } from '@/modules/finance/comptabilite/einvoicing';
import { Nexus } from '@/lib/nexus/NexusAdapter';

const WEBHOOK_SECRET = process.env.EINVOICING_WEBHOOK_SECRET ?? '';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const webhookPayload = body as EInvoiceWebhookPayload;

    if (!webhookPayload.signature || !webhookPayload.eventType || !webhookPayload.invoiceId) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    const provider = EInvoicingService.getProvider();

    if (!WEBHOOK_SECRET && provider.name !== 'mock') {
      logger.error('[EInvoicing/inbound] EINVOICING_WEBHOOK_SECRET non configuré');
      return NextResponse.json({ error: 'Configuration serveur manquante' }, { status: 500 });
    }

    const secret = WEBHOOK_SECRET || 'mock_secret';
    if (!provider.verifyWebhookSignature(webhookPayload, secret)) {
      logger.warn('[EInvoicing/inbound] Signature webhook invalide', {
        invoiceId: webhookPayload.invoiceId,
        eventType: webhookPayload.eventType,
      });
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    const tenantId = (body as Record<string, string>).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    if (webhookPayload.eventType === 'invoice.received') {
      const invoice = await provider.fetchInvoice(webhookPayload.invoiceId, tenantId);
      const invoiceId = await EInvoicingService.receiveInvoice(tenantId, invoice);
      logger.info(`[EInvoicing/inbound] Facture reçue ${invoiceId} pour tenant ${tenantId}`);
      return NextResponse.json({ ok: true, invoiceId });
    }

    if (webhookPayload.eventType === 'invoice.status_changed') {
      logger.info(`[EInvoicing/inbound] Status changed ${webhookPayload.invoiceId}`);
      return NextResponse.json({ ok: true, invoiceId: webhookPayload.invoiceId });
    }

    return NextResponse.json({ ok: true, ignored: true });
  } catch (err) {
    logger.error('[EInvoicing/inbound]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur serveur' },
      { status: 500 },
    );
  }
}

export async function PUT(req: Request): Promise<NextResponse> {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    let xmlContent: string | null = null;
    let tenantId: string | null = null;

    if (contentType.includes('application/xml') || contentType.includes('text/xml')) {
      xmlContent = await req.text();
      tenantId = req.headers.get('x-tenant-id');
    } else {
      const body = await req.json();
      xmlContent = (body as Record<string, string>).xml ?? null;
      tenantId = (body as Record<string, string>).tenantId ?? null;
    }

    if (!xmlContent || !tenantId) {
      return NextResponse.json({ error: 'xml et tenantId requis' }, { status: 400 });
    }

    const invoice = parseEInvoiceXml(xmlContent);
    const invoiceId = await EInvoicingService.receiveInvoice(tenantId, invoice);

    return NextResponse.json({ ok: true, invoiceId });
  } catch (err) {
    logger.error('[EInvoicing/inbound] XML parse', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur parsing' },
      { status: 400 },
    );
  }
}
