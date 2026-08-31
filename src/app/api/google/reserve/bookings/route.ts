/**
 * POST /api/google/reserve/bookings        — Google crée une réservation
 * DELETE /api/google/reserve/bookings?booking_id=X&merchant_id=Y — Google annule
 * GET /api/google/reserve/bookings?booking_id=X&merchant_id=Y    — Google vérifie
 *
 * Booking Server REST requis par Google Actions Center (Reserve with Google).
 * Auth : Bearer GOOGLE_RESERVE_SECRET
 *
 * La réservation est persistée dans Nexus comme une réservation normale,
 * avec source: 'google_reserve' pour traçabilité.
 *
 * ENV : GOOGLE_RESERVE_SECRET
 */
import 'server-only';
import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { randomBytes } from 'node:crypto';
import { logger } from '@/lib/logger';
import type { JsonObject } from "@/shared/types/json";

const RESERVE_SECRET = process.env.GOOGLE_RESERVE_SECRET;

export const dynamic = 'force-dynamic';

interface GoogleBookingBody {
  merchant_id: string;
  service_id: string;
  start_time: string;      // ISO 8601
  party_size: number;
  user_information: {
    user_id?: string;
    given_name?: string;
    family_name?: string;
    telephone?: string;
    email?: string;
  };
  payment_information?: unknown;
  additional_request?: string;
}

function authGuard(req: NextRequest): NextResponse | null {
  const auth = req.headers.get('authorization');
  if (!RESERVE_SECRET || auth !== `Bearer ${RESERVE_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const denied = authGuard(req);
  if (denied) return denied;

  const body = await req.json() as GoogleBookingBody;
  const { merchant_id, start_time, party_size, user_information, additional_request } = body;

  if (!merchant_id || !start_time || !party_size) {
    return NextResponse.json({ error: 'merchant_id, start_time, party_size requis' }, { status: 400 });
  }

  const startDate = new Date(start_time);
  if (isNaN(startDate.getTime())) {
    return NextResponse.json({ error: 'start_time invalide' }, { status: 400 });
  }

  const bookingId = `grv_${randomBytes(8).toString('hex')}`;
  const dateStr = startDate.toISOString().split('T')[0];
  const timeStr = startDate.toTimeString().slice(0, 5);

  const reservation = {
    id: bookingId,
    tenantId: merchant_id,
    date: dateStr,
    time: timeStr,
    covers: party_size,
    status: 'confirmed',
    source: 'google_reserve',
    customerName: `${user_information.given_name ?? ''} ${user_information.family_name ?? ''}`.trim() || 'Client Google',
    customerPhone: user_information.telephone ?? '',
    customerEmail: user_information.email ?? '',
    notes: additional_request ?? '',
    googleUserId: user_information.user_id ?? '',
    createdAt: Date.now(),
  };

  await Nexus.adapter.set(
    `tenants/${merchant_id}/reservations/${bookingId}`,
    reservation,
  );

  logger.info(`[Google Reserve] Réservation ${bookingId} créée — tenant ${merchant_id} (${dateStr} ${timeStr}, ${party_size} couverts)`);

  return NextResponse.json({
    booking_id: bookingId,
    status: 'CONFIRMED',
    start_time,
    party_size,
  }, { status: 201 });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const denied = authGuard(req);
  if (denied) return denied;

  const bookingId = req.nextUrl.searchParams.get('booking_id');
  const merchantId = req.nextUrl.searchParams.get('merchant_id');

  if (!bookingId || !merchantId) {
    return NextResponse.json({ error: 'booking_id, merchant_id requis' }, { status: 400 });
  }

  const reservation = await Nexus.adapter.get(`tenants/${merchantId}/reservations/${bookingId}`) as { status?: string } | null;

  if (!reservation) {
    return NextResponse.json({ error: 'Booking introuvable' }, { status: 404 });
  }

  return NextResponse.json({ booking_id: bookingId, status: (reservation.status ?? 'confirmed').toUpperCase() });
}

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  const denied = authGuard(req);
  if (denied) return denied;

  const bookingId = req.nextUrl.searchParams.get('booking_id');
  const merchantId = req.nextUrl.searchParams.get('merchant_id');

  if (!bookingId || !merchantId) {
    return NextResponse.json({ error: 'booking_id, merchant_id requis' }, { status: 400 });
  }

  const existing = await Nexus.adapter.get(`tenants/${merchantId}/reservations/${bookingId}`) as JsonObject | null;
  if (!existing) {
    return NextResponse.json({ error: 'Booking introuvable' }, { status: 404 });
  }

  await Nexus.adapter.set(
    `tenants/${merchantId}/reservations/${bookingId}`,
    { ...existing, status: 'cancelled', cancelledAt: Date.now(), cancelledBy: 'google_reserve' },
  );

  logger.info(`[Google Reserve] Réservation ${bookingId} annulée — tenant ${merchantId}`);
  return NextResponse.json({ booking_id: bookingId, status: 'CANCELLED' });
}
