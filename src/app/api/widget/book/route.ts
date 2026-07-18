import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

const BookSchema = z.object({
  tenantId: z.string().min(1).max(80),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide'),
  time: z.string().regex(/^\d{2}:\d{2}$/, 'Format horaire invalide'),
  covers: z.number().int().min(1).max(100),
  firstName: z.string().min(1).max(80).trim(),
  lastName: z.string().min(1).max(80).trim(),
  email: z.string().email().max(254),
  phone: z.string().max(30).optional().default(''),
  notes: z.string().max(500).optional().default(''),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = BookSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Donnees invalides', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      tenantId,
      date,
      time,
      covers,
      firstName,
      lastName,
      email,
      phone,
      notes,
    } = parsed.data;

    const context = { vassalId: tenantId, actorId: 'widget' };

    const id = Nexus.adapter.generateId('reservations');

    const reservation = {
      id,
      type: 'reservation' as const,
      customerId: 'widget-guest',
      customerName: `${firstName} ${lastName}`,
      date,
      time,
      partySize: covers,
      covers,
      status: 'pending' as const,
      notes: notes || undefined,
      schemaVersion: 2 as const,
      updatedAt: Date.now(),
      // Widget-specific metadata
      source: 'widget',
      guestEmail: email,
      guestPhone: phone || undefined,
      guestFirstName: firstName,
      guestLastName: lastName,
    };

    await Nexus.adapter.create(`reservations/${id}`, reservation, context);

    logger.info(`[widget/book] New reservation ${id} for tenant ${tenantId} — ${date} ${time} x${covers}`);

    // Fire-and-forget email confirmation
    try {
      await fetch(`${request.nextUrl.origin}/api/email/reservation-confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          bookingRef: id,
          firstName,
          lastName,
          email,
          date,
          time,
          covers,
          notes,
        }),
      });
    } catch (emailErr) {
      // Non-blocking: email failure must never block the booking
      logger.warn('[widget/book] Email confirmation failed (non-blocking)', String(emailErr));
    }

    return NextResponse.json({ success: true, bookingRef: id }, { status: 201 });
  } catch (err) {
    logger.error('[widget/book]', err);
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
