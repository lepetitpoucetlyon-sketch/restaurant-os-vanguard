import type { IReservation, ReservationStatus } from '../../domain/entities/Reservation';
import type { RwGBooking } from '../../domain/types/GoogleReserveTypes';

export class GoogleReserveAdapter {
  /**
   * Converts a Google Reserve RwGBooking to our internal IReservation entity
   */
  public static toDomain(googleBooking: RwGBooking, tenantId: string): IReservation {
    let status: ReservationStatus = 'PENDING';
    switch (googleBooking.status) {
      case 'CONFIRMED': status = 'CONFIRMED'; break;
      case 'CANCELED': status = 'CANCELLED'; break;
      case 'NO_SHOW': status = 'NO_SHOW'; break;
      case 'DECLINED': status = 'CANCELLED'; break;
    }

    return {
      id: googleBooking.booking_id,
      tenantId,
      source: 'GOOGLE_RESERVE',
      customerName: `${googleBooking.user_information.first_name} ${googleBooking.user_information.last_name}`.trim(),
      customerPhone: googleBooking.user_information.telephone,
      customerEmail: googleBooking.user_information.email,
      partySize: googleBooking.party_size,
      startTime: new Date(googleBooking.slot.start_time_sec * 1000),
      durationMinutes: Math.floor(googleBooking.slot.duration_sec / 60),
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
