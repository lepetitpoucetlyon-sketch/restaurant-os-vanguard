import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { JsonObject } from "@/shared/types/json";

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

/**
 * 📲 Inbound SMS Webhook (Twilio / Webhook Bidirectionnel)
 * Gère les re-confirmations et annulations interactives par SMS.
 * Client répond '1' ou 'OUI' -> Re-confirmation enregistrée.
 * Client répond '2' ou 'NON' -> Annulation immédiate & libération pour la Waitlist.
 */
export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let fromNumber = '';
    let bodyText = '';

    try {
      if (contentType.includes('application/json')) {
        const json = await request.json();
        fromNumber = (json.From || json.from || '').trim();
        bodyText = (json.Body || json.body || '').trim().toUpperCase();
      } else {
        const formData = await request.formData();
        fromNumber = (formData.get('From') as string || '').trim();
        bodyText = (formData.get('Body') as string || '').trim().toUpperCase();
      }
    } catch {
      try {
        const json = await request.json();
        fromNumber = (json.From || json.from || '').trim();
        bodyText = (json.Body || json.body || '').trim().toUpperCase();
      } catch {
        // Ignored
      }
    }

    if (!fromNumber) {
      return new NextResponse('<Response><Message>Numéro expéditeur manquant</Message></Response>', {
        status: 400,
        headers: { 'Content-Type': 'text/xml' },
      });
    }

    logger.info(`[SMS Inbound Webhook] Reçu de ${fromNumber}: "${bodyText}"`);

    // Normaliser le numéro pour la recherche
    const cleanPhone = fromNumber.replace(/\s+/g, '');

    // Rechercher les réservations associées sur tous les tenants actifs
    const tenants = await Nexus.adapter.query<{ id: string }>('tenants');
    let targetReservation: ReservationDoc | null = null;
    let targetTenantId: string = '';

    for (const t of tenants) {
      if (!t.id) continue;
      const reservations = await Nexus.adapter.query<ReservationDoc>(`tenants/${t.id}/reservations`, {
        where: [{ field: 'status', operator: '==', value: 'confirmed' }],
      });

      const match = reservations.find(r => {
        const p1 = (r.customerPhone || '').replace(/\s+/g, '');
        const p2 = (r.guestPhone || '').replace(/\s+/g, '');
        return p1 === cleanPhone || p2 === cleanPhone || (p1 && cleanPhone.endsWith(p1.slice(-9)));
      });

      if (match) {
        targetReservation = match;
        targetTenantId = t.id;
        break;
      }
    }

    if (!targetReservation) {
      return new NextResponse(
        '<Response><Message>Aucune réservation active trouvée pour ce numéro.</Message></Response>',
        { status: 200, headers: { 'Content-Type': 'text/xml' } }
      );
    }

    const isConfirm = ['1', 'OUI', 'O', 'YES', 'Y', 'CONFIRMER', 'CONFIRME'].includes(bodyText);
    const isCancel = ['2', 'NON', 'N', 'NO', 'ANNULER', 'ANNULE', 'CANCEL'].includes(bodyText);

    let replyMsg = '';

    if (isConfirm) {
      await Nexus.adapter.update(`tenants/${targetTenantId}/reservations/${targetReservation.id}`, {
        reconfirmedByGuestAt: new Date().toISOString(),
        reconfirmationChannel: 'sms',
      });

      await NexusEventBus.emit('commerce.reservation_reconfirmed', {
        v: 1,
        tenantId: targetTenantId,
        reservationId: targetReservation.id,
        customerPhone: fromNumber,
        date: targetReservation.date,
        time: targetReservation.time,
      });

      replyMsg = 'Merci ! Votre table est bien confirmée. Nous nous réjouissons de vous accueillir.';
    } else if (isCancel) {
      await Nexus.adapter.update(`tenants/${targetTenantId}/reservations/${targetReservation.id}`, {
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
        cancellationReason: 'sms_interactive_reply',
      });

      await NexusEventBus.emit('commerce.reservation_cancelled', {
        v: 1,
        tenantId: targetTenantId,
        reservationId: targetReservation.id,
        customerPhone: fromNumber,
        date: targetReservation.date,
        time: targetReservation.time,
        covers: targetReservation.covers || 2,
      });

      replyMsg = 'Votre réservation a bien été annulée. Merci de nous avoir prévenus !';
    } else {
      replyMsg = 'Veuillez répondre 1 pour CONFIRMER votre venue, ou 2 pour LIBÉRER votre table.';
    }

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
