import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { SovereignSignatureEngine, type DocuSealWebhookPayload } from '@/modules/compliance';
import { logger } from '@/lib/logger';

/**
 * 🦭 Webhook Récepteur DocuSeal — HMAC-vérifié
 *
 * Reçoit les événements de cycle de vie documentaire :
 * - submission.created
 * - submission.opened
 * - submission.completed (contrat signé et scellé)
 *
 * Sécurité : vérifie la signature HMAC-SHA256 du payload avec
 * DOCUSEAL_WEBHOOK_SECRET pour empêcher toute forgerie externe.
 * Header attendu : X-Docuseal-Signature (hex).
 */

function verifyDocuSealSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.DOCUSEAL_WEBHOOK_SECRET;

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      logger.error('[DocuSeal Webhook] DOCUSEAL_WEBHOOK_SECRET absent en production — rejet');
      return false;
    }
    logger.warn('[DocuSeal Webhook] DOCUSEAL_WEBHOOK_SECRET absent (dev/sandbox) — signature ignorée');
    return true;
  }

  if (!signatureHeader) {
    logger.warn('[DocuSeal Webhook] Header X-Docuseal-Signature manquant');
    return false;
  }

  const expected = crypto.createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const provided = signatureHeader.trim().toLowerCase();
  const expectedBuf = Buffer.from(expected, 'hex');
  const providedBuf = Buffer.from(provided, 'hex');

  if (expectedBuf.length !== providedBuf.length) return false;

  try {
    return crypto.timingSafeEqual(expectedBuf, providedBuf);
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-docuseal-signature');

  if (!verifyDocuSealSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Signature webhook invalide' }, { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody) as DocuSealWebhookPayload;

    if (!payload?.event_type || !payload?.data?.id) {
      return NextResponse.json({ error: 'Payload DocuSeal invalide' }, { status: 400 });
    }

    logger.info(`[DocuSeal Webhook] Événement reçu: ${payload.event_type} pour soumission ${payload.data.id}`);

    const contract = await SovereignSignatureEngine.handleDocuSealWebhook(payload);

    return NextResponse.json({
      success: true,
      eventType: payload.event_type,
      submissionId: payload.data.id,
      contractId: contract?.id || null,
      status: contract?.status || 'UNKNOWN',
    });
  } catch (err) {
    logger.error('[DocuSeal Webhook] Erreur lors du traitement', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erreur interne de traitement' },
      { status: 500 }
    );
  }
}
