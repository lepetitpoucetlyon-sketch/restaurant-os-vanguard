import { logger } from '@/lib/logger';
import type { IReservation } from '../../domain/entities/Reservation';

export class InMemoryReservationRepository {
  private reservations: Map<string, IReservation> = new Map();

  public async save(reservation: IReservation): Promise<void> {
    this.reservations.set(reservation.id, reservation);
    logger.info(`[InMemoryReservationRepository] Saved reservation ${reservation.id} for tenant ${reservation.tenantId}`);
  }

  public async findById(id: string): Promise<IReservation | null> {
    return this.reservations.get(id) || null;
  }

  public async checkAvailability(tenantId: string, startTime: Date, partySize: number): Promise<boolean> {
    const isAvailable = Math.random() > 0.1;
    logger.debug(`[InMemoryReservationRepository] Availability check tenant=${tenantId} pax=${partySize} at=${startTime.toISOString()} → ${isAvailable ? 'AVAILABLE' : 'FULL'}`);
    return isAvailable;
  }
}
