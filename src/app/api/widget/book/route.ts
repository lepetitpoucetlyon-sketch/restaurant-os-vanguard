import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { getRateLimiter } from '@/lib/rate-limiter';

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
  stripePaymentMethodId: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  // inf-7: Rate limiter Redis/Upstash (anti-abus widget public)
  const ip      = request.headers.get('x-forwarded-for') ?? 'unknown';
  const limiter = getRateLimiter();
  const rl      = await limiter.check(`widget:book:${ip}`, 10, 60 * 60 * 1000); // 10/heure
  if (!rl.allowed) {
    return NextResponse.json({ success: false, error: 'Trop de requêtes — réessayez dans 1h.' }, { status: 429 });
  }

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
      stripePaymentMethodId,
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
      // Empreinte bancaire — populated when card imprint was collected
      stripePaymentMethodId: stripePaymentMethodId ?? undefined,
      cardImprintCollectedAt: stripePaymentMethodId ? Date.now() : undefined,
    };

    await Nexus.adapter.create(`reservations/${id}`, reservation, context);

    logger.info(`[widget/book] New reservation ${id} for tenant ${tenantId} — ${date} ${time} x${covers}`);

    // Fire-and-forget email confirmation
    try {
      await fetch(`${request.nextUrl.origin}/api/email/reservation-confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.INTERNAL_API_SECRET ?? '',
        },
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
