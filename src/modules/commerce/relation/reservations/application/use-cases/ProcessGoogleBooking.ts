import { GoogleReserveAdapter } from '../../infrastructure/adapters/GoogleReserveAdapter';
import { InMemoryReservationRepository } from '../../infrastructure/repositories/InMemoryReservationRepository';
import { RwGBooking } from '../../domain/types/GoogleReserveTypes';

export class ProcessGoogleBookingUseCase {
  private repository: InMemoryReservationRepository;

  constructor(repository: InMemoryReservationRepository) {
    this.repository = repository;
  }

  /**
   * Processes an incoming booking from Google Reserve Webhooks
   */
  public async execute(googleBooking: RwGBooking): Promise<{ success: boolean; message: string }> {
    try {
      // 1. The tenantId would typically be derived from the Google merchant_id via a mapping table
      // For this implementation, we simulate fetching the tenantId
      const tenantId = `tenant_${googleBooking.slot.merchant_id}`;

      // 2. Translate the Google format to our Domain format using the Adapter
      const reservation = GoogleReserveAdapter.toDomain(googleBooking, tenantId);

      // 3. Verify availability before confirming
      // Even if Google says it's confirmed, we double-check our system
      if (reservation.status === 'CONFIRMED') {
        const isAvailable = await this.repository.checkAvailability(
          reservation.tenantId,
          reservation.startTime,
          reservation.partySize
        );

        if (!isAvailable) {
          // If our system is full, we must decline the booking
          reservation.status = 'CANCELLED';
          await this.repository.save(reservation);
          return { success: false, message: 'Restaurant is fully booked for this time slot.' };
        }
      }

      // 4. Save the reservation
      await this.repository.save(reservation);

      return { success: true, message: 'Booking processed successfully.' };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[ProcessGoogleBookingUseCase] Error:', msg);
      return { success: false, message: 'Internal server error while processing booking.' };
    }
  }
}
