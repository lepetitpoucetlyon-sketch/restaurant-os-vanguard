import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProcessGoogleBookingUseCase } from '@/modules/commerce/relation/reservations/application/use-cases/ProcessGoogleBooking';
import { InMemoryReservationRepository } from '@/modules/commerce/relation/reservations/infrastructure/repositories/InMemoryReservationRepository';
import { RwGBooking } from '@/modules/commerce/relation/reservations/domain/types/GoogleReserveTypes';

describe('Google Reserve Integration (Level 6 Architecture)', () => {
  let repository: InMemoryReservationRepository;
  let useCase: ProcessGoogleBookingUseCase;

  beforeEach(() => {
    repository = new InMemoryReservationRepository();
    useCase = new ProcessGoogleBookingUseCase(repository);
  });

  it('should successfully map and save a valid Google Reserve booking', async () => {
    // 1. Arrange: Create a mock payload as received by the Next.js Webhook
    const mockGoogleBooking: RwGBooking = {
      booking_id: 'g-res-12345',
      status: 'CONFIRMED',
      party_size: 4,
      user_information: {
        first_name: 'Jean',
        last_name: 'Dupont',
        telephone: '+33612345678',
        email: 'jean.dupont@example.com'
      },
      slot: {
        merchant_id: 'resto-789',
        service_id: 'dinner',
        // 1735671600 = Dec 31 2024 19:00:00 GMT
        start_time_sec: 1735671600,
        // 7200 sec = 120 minutes (2 hours)
        duration_sec: 7200
      }
    };

    // Override the availability check to always return true for this test
    vi.spyOn(repository, 'checkAvailability').mockResolvedValue(true);

    // 2. Act: Execute the use case (simulating the webhook passing the payload)
    const result = await useCase.execute(mockGoogleBooking);

    // 3. Assert
    expect(result.success).toBe(true);
    
    // Verify it was correctly mapped and stored in the repository
    const savedReservation = await repository.findById('g-res-12345');
    
    expect(savedReservation).toBeDefined();
    expect(savedReservation?.tenantId).toBe('tenant_resto-789');
    expect(savedReservation?.source).toBe('GOOGLE_RESERVE');
    expect(savedReservation?.customerName).toBe('Jean Dupont');
    expect(savedReservation?.partySize).toBe(4);
    expect(savedReservation?.durationMinutes).toBe(120);
    expect(savedReservation?.status).toBe('CONFIRMED');
    
    // Check if timestamp mapping worked (1735671600 * 1000 = 1735671600000 ms)
    expect(savedReservation?.startTime.getTime()).toBe(1735671600000);
  });
});
