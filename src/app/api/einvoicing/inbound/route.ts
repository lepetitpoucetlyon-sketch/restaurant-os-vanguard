import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  EInvoicingService,
  EInvoiceProviderFactory,
} from '@/modules/finance/comptabilite/einvoicing';
import type { EInvoiceWebhookPayload } from '@/modules/finance/comptabilite/einvoicing';
import { parseEInvoiceXml } from '@/modules/finance/comptabilite/einvoicing';

export async function POST(req: Request): Promise<NextResponse> {
  try {
    const body = await req.json();
    const webhookPayload = body as EInvoiceWebhookPayload;

    if (!webhookPayload.signature || !webhookPayload.eventType || !webhookPayload.invoiceId) {
      return NextResponse.json({ error: 'Payload invalide' }, { status: 400 });
    }

    const tenantId = (body as Record<string, string>).tenantId;
    if (!tenantId) {
      return NextResponse.json({ error: 'tenantId requis' }, { status: 400 });
    }

    // Résolution du provider par tenant — config PA stockée dans Nexus
    const provider = await EInvoiceProviderFactory.forTenant(tenantId);

    // Le secret est lu depuis la config Nexus du tenant (ou plateforme en fallback).
    // Le mock utilise 'mock_secret' ; en production la config PA contient le vrai secret.
    const { Nexus } = await import('@/lib/nexus/NexusAdapter');
    const { tenantEInvoiceConfigPath, PLATFORM_EINVOICE_CONFIG_PATH } = await import('@/modules/finance/comptabilite/einvoicing');
    const tenantCfg = await Nexus.adapter.get<{ webhookSecret?: string }>(tenantEInvoiceConfigPath(tenantId));
    const platformCfg = await Nexus.adapter.get<{ webhookSecret?: string }>(PLATFORM_EINVOICE_CONFIG_PATH);
    const secret = tenantCfg?.webhookSecret ?? platformCfg?.webhookSecret ?? 'mock_secret';

    if (!provider.verifyWebhookSignature(webhookPayload, secret)) {
      logger.warn('[EInvoicing/inbound] Signature webhook invalide', {
        invoiceId: webhookPayload.invoiceId,
        eventType: webhookPayload.eventType,
        tenantId,
      });
      return NextResponse.json({ error: 'Signature invalide' }, { status: 401 });
    }

    if (webhookPayload.eventType === 'invoice.received') {
      const invoice = await provider.fetchInvoice(webhookPayload.invoiceId, tenantId);
      const invoiceId = await EInvoicingService.receiveInvoice(tenantId, invoice);
      logger.info(`[EInvoicing/inbound] Facture reçue ${invoiceId} pour tenant ${tenantId}`);
      return NextResponse.json({ ok: true, invoiceId });
    }

    if (webhookPayload.eventType === 'invoice.status_changed') {
      logger.info(`[EInvoicing/inbound] Status changed ${webhookPayload.invoiceId} tenant ${tenantId}`);
      return NextResponse.json({ ok: true, invoiceId: webhookPayload.invoiceId });
    }

    if (webhookPayload.eventType === 'outbound.status_changed' && webhookPayload.newStatus) {
      // Mise à jour statut facture émise (lifecycle côté emission)
      const internalRef = (body as Record<string, string>).internalRef;
      if (internalRef) {
        await EInvoicingService.updateOutboundStatus(
          tenantId, internalRef, webhookPayload.newStatus, 'webhook',
        );
      }
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
