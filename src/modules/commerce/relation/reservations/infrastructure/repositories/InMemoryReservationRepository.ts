import { IReservation } from '../../domain/entities/Reservation';

export class InMemoryReservationRepository {
  private reservations: Map<string, IReservation> = new Map();

  public async save(reservation: IReservation): Promise<void> {
    this.reservations.set(reservation.id, reservation);
    console.log(`[InMemoryReservationRepository] Saved reservation ${reservation.id} for tenant ${reservation.tenantId}`);
  }

  public async findById(id: string): Promise<IReservation | null> {
    return this.reservations.get(id) || null;
  }

  public async checkAvailability(tenantId: string, startTime: Date, partySize: number): Promise<boolean> {
    // Basic mock: randomly reject ~10% of bookings to simulate full capacity
    // In a real implementation, this would query the DB for existing reservations and table capacity
    const isAvailable = Math.random() > 0.1;
    console.log(`[InMemoryReservationRepository] Checked availability for ${partySize} pax at ${startTime.toISOString()}: ${isAvailable ? 'AVAILABLE' : 'FULL'}`);
    return isAvailable;
  }
}
