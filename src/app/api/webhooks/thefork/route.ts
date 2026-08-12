import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@orchestration/NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-thefork-key');
    if (process.env.THEFORK_WEBHOOK_SECRET && apiKey !== process.env.THEFORK_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Signature Webhook invalide' }, { status: 401 });
    }

    const payload = await request.json();
    const { tenantId, booking } = payload || {};

    if (!tenantId || !booking || !booking.id) {
      return NextResponse.json({ error: 'Payload Webhook TheFork invalide' }, { status: 400 });
    }

    const canonicalResId = `thefork_${booking.id}`;
    const resPath = `tenants/${tenantId}/reservations/${canonicalResId}`;

    const reservationData = {
      id: canonicalResId,
      externalId: booking.id,
      tenantId,
      source: 'thefork',
      customerName: `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim(),
      customerEmail: booking.customer?.email ?? null,
      customerPhone: booking.customer?.phone ?? null,
      covers: booking.pax ?? 2,
      date: booking.reservation_date,
      time: booking.reservation_time,
      status: booking.status === 'CONFIRMED' ? 'confirmed' : booking.status === 'CANCELLED' ? 'cancelled' : 'pending',
      notes: booking.special_request ?? '',
      specialOccasion: booking.special_occasion ?? null,
      yumsCode: booking.yums_code ?? null,
      updatedAt: new Date().toISOString(),
    };

    await Nexus.adapter.set(resPath, reservationData);

    const guestName = `${booking.customer?.first_name || ''} ${booking.customer?.last_name || ''}`.trim() || 'Client TheFork';
    const partySize = booking.pax ?? 2;
    const scheduledAt = new Date(`${booking.reservation_date}T${booking.reservation_time}`).getTime() || Date.now();

    await NexusEventBus.emitDurable('reservation.created', {
      v: 1,
      tenantId,
      reservationId: canonicalResId,
      guestName,
      partySize,
      scheduledAt,
      hasDeposit: false,
    });

    empireAudit.log({
      module: 'ops',
      action: 'THEFORK_WEBHOOK_RECEIVED',
      details: { bookingId: booking.id, tenantId, status: booking.status },
      severity: 'low',
      timestamp: new Date(),
    });

    logger.info(`[TheForkWebhook] Réservation ${canonicalResId} ingérée avec succès.`);

    return NextResponse.json({ success: true, reservationId: canonicalResId });
  } catch (err) {
    logger.error('[TheForkWebhook]', err);
    return NextResponse.json({ error: 'Erreur traitement webhook TheFork' }, { status: 500 });
  }
}
