import { describe, it, expect } from 'vitest';
import { 
  ReservationPacingService, 
  type PacingConfig, 
  type ExistingReservationSlot 
} from './ReservationPacingService';

describe('ReservationPacingService', () => {
  const config: PacingConfig = {
    serviceStartTime: '19:00',
    serviceEndTime: '21:00',
    slotIntervalMinutes: 15,
    defaultMaxCoversPerSlot: 10,
    slotOverrides: {
      '20:00': 6, // Plus faible capacité à 20:00 (rush)
    },
  };

  it('generates 15-minute intervals between 19:00 and 21:00', () => {
    const slots = ReservationPacingService.generateTimeSlots('19:00', '21:00', 15);
    expect(slots).toEqual([
      '19:00', '19:15', '19:30', '19:45',
      '20:00', '20:15', '20:30', '20:45', '21:00'
    ]);
  });

  it('computes availability and locks saturated slots', () => {
    const existing: ExistingReservationSlot[] = [
      { id: '1', timeSlot: '19:30', partySize: 6 },
      { id: '2', timeSlot: '19:30', partySize: 4 }, // 10/10 booked -> 0 available
      { id: '3', timeSlot: '20:00', partySize: 4 }, // 4/6 booked -> 2 available
    ];

    const status = ReservationPacingService.computeSlotsStatus(config, existing);
    const slot1930 = status.find((s) => s.timeSlot === '19:30');
    const slot2000 = status.find((s) => s.timeSlot === '20:00');
    const slot1900 = status.find((s) => s.timeSlot === '19:00');

    expect(slot1930?.bookedCovers).toBe(10);
    expect(slot1930?.availableCovers).toBe(0);
    expect(slot1930?.isLocked).toBe(true);

    expect(slot2000?.bookedCovers).toBe(4);
    expect(slot2000?.availableCovers).toBe(2);
    expect(slot2000?.isLocked).toBe(false);

    expect(slot1900?.availableCovers).toBe(10);
  });

  it('evaluates booking requests and suggests alternatives when full', () => {
    const existing: ExistingReservationSlot[] = [
      { id: '1', timeSlot: '20:00', partySize: 6 }, // 6/6 full
    ];

    // Request for 4 people at 20:00 (full)
    const result = ReservationPacingService.evaluateBooking(config, existing, '20:00', 4);

    expect(result.canAccept).toBe(false);
    expect(result.reason).toBe('SLOT_FULL');
    expect(result.suggestedAlternativeSlots.length).toBeGreaterThan(0);
    expect(result.suggestedAlternativeSlots).toContain('19:45');
  });

  it('accepts booking when capacity is sufficient', () => {
    const existing: ExistingReservationSlot[] = [
      { id: '1', timeSlot: '19:15', partySize: 4 },
    ];

    const result = ReservationPacingService.evaluateBooking(config, existing, '19:15', 4);

    expect(result.canAccept).toBe(true);
    expect(result.availableOnSlot).toBe(6);
    expect(result.suggestedAlternativeSlots).toEqual([]);
  });
});
