/* eslint-disable no-restricted-imports -- internal use-cases, not in public barrel */
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ProcessGoogleBookingUseCase } from '@/modules/commerce/relation/reservations/application/use-cases/ProcessGoogleBooking';
import { InMemoryReservationRepository } from '@/modules/commerce/relation/reservations/infrastructure/repositories/InMemoryReservationRepository';
import { RwGCreateBookingRequest } from '@/modules/commerce/relation/reservations/domain/types/GoogleReserveTypes';

// Instantiate dependencies (in a real app, this would use a DI container)
const reservationRepository = new InMemoryReservationRepository();
const processGoogleBookingUseCase = new ProcessGoogleBookingUseCase(reservationRepository);

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as RwGCreateBookingRequest;

    // Validate payload shape basic requirements
    if (!payload || !payload.booking || !payload.booking.booking_id) {
      return NextResponse.json({ error: 'Invalid Google Reserve payload' }, { status: 400 });
    }

    // Hand off to the application use-case
    // Notice how the Next.js API route has ZERO business logic. It's just a proxy.
    const result = await processGoogleBookingUseCase.execute(payload.booking);

    if (result.success) {
      return NextResponse.json({ status: 'SUCCESS' }, { status: 200 });
    } else {
      // In the real RwG API, we would return specific error codes for "Fully booked" etc.
      return NextResponse.json({ error: result.message }, { status: 422 });
    }
  } catch (error) {
    logger.error('[GoogleReserveWebhook] Fatal Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
