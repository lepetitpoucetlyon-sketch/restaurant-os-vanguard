import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { checkFallbackWebhookSecret } from '@/lib/server/webhookVerify';

interface ReservationDoc {
  id: string;
  tenantId: string;
  status: string;
  customerPhone?: string;
  guestPhone?: string;
  customerName?: string;
  date: string;
  time: string;
  covers?: number;
}

async function parseSmsPayload(request: NextRequest): Promise<{ fromNumber: string; bodyText: string }> {
  try {
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await request.json();
      return {
        fromNumber: String(json.From || json.from || '').trim(),
        bodyText: String(json.Body || json.body || '').trim().toUpperCase(),
      };
    }
    const formData = await request.formData();
    return {
      fromNumber: String(formData.get('From') || '').trim(),
      bodyText: String(formData.get('Body') || '').trim().toUpperCase(),
    };
  } catch {
    return { fromNumber: '', bodyText: '' };
  }
}

async function findReservationByPhone(cleanPhone: string): Promise<{ reservation: ReservationDoc; tenantId: string } | null> {
  const tenants = await Nexus.adapter.query<{ id: string }>('tenants');
  for (const t of tenants) {
    if (!t.id) continue;
    const reservations = await Nexus.adapter.query<ReservationDoc>(`tenants/${t.id}/reservations`, {
      where: [{ field: 'status', operator: '==', value: 'confirmed' }],
    });

    const match = reservations.find(r => {
      const p1 = (r.customerPhone || '').replace(/\s+/g, '');
      const p2 = (r.guestPhone || '').replace(/\s+/g, '');
      return p1 === cleanPhone || p2 === cleanPhone || Boolean(p1 && cleanPhone.endsWith(p1.slice(-9)));
    });

    if (match) {
      return { reservation: match, tenantId: t.id };
    }
  }
  return null;
}

async function handleSmsAction(
  tenantId: string,
  reservation: ReservationDoc,
  fromNumber: string,
  bodyText: string
): Promise<string> {
  const isConfirm = ['1', 'OUI', 'O', 'YES', 'Y', 'CONFIRMER', 'CONFIRME'].includes(bodyText);
  const isCancel = ['2', 'NON', 'N', 'NO', 'ANNULER', 'ANNULE', 'CANCEL'].includes(bodyText);

  if (isConfirm) {
    await Nexus.adapter.update(`tenants/${tenantId}/reservations/${reservation.id}`, {
      reconfirmedByGuestAt: new Date().toISOString(),
      reconfirmationChannel: 'sms',
    });

    await NexusEventBus.emit('commerce.reservation_reconfirmed', {
      v: 1,
      tenantId,
      reservationId: reservation.id,
      customerPhone: fromNumber,
      date: reservation.date,
      time: reservation.time,
    });

    return 'Merci ! Votre table est bien confirmée. Nous nous réjouissons de vous accueillir.';
  }

  if (isCancel) {
    await Nexus.adapter.update(`tenants/${tenantId}/reservations/${reservation.id}`, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: 'sms_interactive_reply',
    });

    await NexusEventBus.emit('commerce.reservation_cancelled', {
      v: 1,
      tenantId,
      reservationId: reservation.id,
      customerPhone: fromNumber,
      date: reservation.date,
      time: reservation.time,
      covers: reservation.covers || 2,
    });

    return 'Votre réservation a bien été annulée. Merci de nous avoir prévenus !';
  }

  return 'Veuillez répondre 1 pour CONFIRMER votre venue, ou 2 pour LIBÉRER votre table.';
}

/**
 * 📲 Inbound SMS Webhook (Twilio / Webhook Bidirectionnel)
 * Gère les re-confirmations et annulations interactives par SMS.
 */
export async function POST(request: NextRequest) {
  const isVerified = checkFallbackWebhookSecret(request.headers, 'sms-inbound');
  if (!isVerified) {
    logger.warn('[SMS Inbound Webhook] Requête non autorisée');
    return new NextResponse('<Response><Message>Non autorisé</Message></Response>', {
      status: 401,
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  try {
    const { fromNumber, bodyText } = await parseSmsPayload(request);
    if (!fromNumber) {
      return new NextResponse('<Response><Message>Numéro expéditeur manquant</Message></Response>', {
        status: 400,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    logger.info(`[SMS Inbound Webhook] Reçu de ${fromNumber}: "${bodyText}"`);
    const cleanPhone = fromNumber.replace(/\s+/g, '');

    const found = await findReservationByPhone(cleanPhone);
    if (!found) {
      return new NextResponse(
        '<Response><Message>Aucune réservation active trouvée pour ce numéro.</Message></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const replyMsg = await handleSmsAction(found.tenantId, found.reservation, fromNumber, bodyText);
    const xmlResponse = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyMsg}</Message></Response>`;

    return new NextResponse(xmlResponse, {
      status: 200,
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (err) {
    logger.error('[SMS Inbound Webhook] Erreur traitement message', err);
    return new NextResponse(
      '<Response><Message>Erreur lors du traitement de votre réponse.</Message></Response>',
      { status: 500, headers: { 'Content-Type': 'text/xml' } }
    );
  }
}
