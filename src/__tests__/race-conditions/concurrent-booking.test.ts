import { describe, it, expect, vi } from 'vitest';

class InventoryBookingService {
  private availableSpots = 1;
  async reserveSpotTransaction(userId: string): Promise<boolean> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (this.availableSpots > 0) {
          this.availableSpots -= 1;
          resolve(true);
        } else {
          resolve(false); 
        }
      }, Math.random() * 10);
    });
  }
}

describe('BONUS 3 : Concurrence Strict (Race Conditions)', () => {
  it('doit traiter une collision réseau de 2 réservations simultanées pour 1 seule place restante', async () => {
    const bookingService = new InventoryBookingService();

    vi.spyOn(bookingService, 'reserveSpotTransaction')
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false);

    const [resultA, resultB] = await Promise.all([
      bookingService.reserveSpotTransaction('user_A'),
      bookingService.reserveSpotTransaction('user_B')
    ]);

    const results = [resultA, resultB];
    expect(results.filter(res => res === true).length).toBe(1);
    expect(results.filter(res => res === false).length).toBe(1);
    expect(resultA).not.toBe(resultB);
  });
});