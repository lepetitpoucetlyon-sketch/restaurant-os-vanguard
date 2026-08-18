import { NextRequest, NextResponse } from 'next/server';
import { SovereignSignatureEngine, type DocuSealWebhookPayload } from '@/modules/compliance';
import { logger } from '@/lib/logger';

/**
 * 🦭 Webhook Récepteur DocuSeal
 * Reçoit les événements de cycle de vie documentaire :
 * - submission.created
 * - submission.opened
 * - submission.completed (Contrat signé et scellé)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as DocuSealWebhookPayload;

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
