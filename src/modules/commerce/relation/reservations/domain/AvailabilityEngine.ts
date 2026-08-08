import { ReservationSlotSettings, GlobalSettings } from '@nexus/contracts';
import { Reservation, Table } from '@nexus/contracts';
import { format, parse, addMinutes, isBefore, areIntervalsOverlapping } from 'date-fns';

export interface AvailableSlot {
  time: string;
  remainingCovers: number;
  totalCapacity: number;
  status: 'available' | 'limited' | 'full';
}

export class AvailabilityEngine {
  /**
   * Calculates all available time slots for a specific date
   */
  static getAvailableSlots(
    date: Date,
    settings: GlobalSettings,
    existingReservations: Reservation[],
    tables: Table[]
  ): AvailableSlot[] {
    const dayOfWeek = format(date, 'EEEE').toLowerCase() as import('@nexus/contracts').DayOfWeek;
    const schedule = settings.schedule.find(s => s.day === dayOfWeek);

    if (!schedule || !schedule.isOpen) return [];

    const slotSettings = settings.reservationSlots;
    const slots: AvailableSlot[] = [];

    // Calculate slots for Lunch
    if (schedule.lunchOpen && schedule.lunchClose) {
      this.generateSlots(
        schedule.lunchOpen,
        schedule.lunchClose,
        slotSettings,
        existingReservations,
        tables,
        date,
        slots
      );
    }

    // Calculate slots for Dinner
    if (schedule.dinnerOpen && schedule.dinnerClose) {
      this.generateSlots(
        schedule.dinnerOpen,
        schedule.dinnerClose,
        slotSettings,
        existingReservations,
        tables,
        date,
        slots
      );
    }

    return slots;
  }

  private static generateSlots(
    openTime: string,
    closeTime: string,
    slotSettings: ReservationSlotSettings,
    existingReservations: Reservation[],
    tables: Table[],
    date: Date,
    results: AvailableSlot[]
  ) {
    let current = parse(openTime, 'HH:mm', date);
    const end = parse(closeTime, 'HH:mm', date);
    const totalCap = tables.reduce((sum, t) => sum + t.seats, 0);

    while (isBefore(current, end)) {
      const timeStr = format(current, 'HH:mm');
      const slotStart = parse(`${format(date, 'yyyy-MM-dd')} ${timeStr}`, 'yyyy-MM-dd HH:mm', date);
      const slotEnd = addMinutes(slotStart, slotSettings.slotDuration || 15);

      const bookedCovers = existingReservations
        .filter(r => {
          if (r.date !== format(date, 'yyyy-MM-dd')) return false;
          const resStart = parse(`${r.date} ${r.time}`, 'yyyy-MM-dd HH:mm', date);
          const resEnd = addMinutes(resStart, Number(r.duration || 120));
          return areIntervalsOverlapping(
            { start: resStart, end: resEnd },
            { start: slotStart, end: slotEnd },
            { inclusive: false }
          );
        })
        .reduce((sum, r) => sum + (r.covers ?? 0), 0);

      const remainingCovers = totalCap - bookedCovers;

      results.push({
        time: timeStr,
        remainingCovers,
        totalCapacity: totalCap,
        status: remainingCovers > (totalCap * 0.2) ? 'available' : remainingCovers > 0 ? 'limited' : 'full'
      });

      current = addMinutes(current, slotSettings.intervalBetweenSlots || 15);
    }
  }

  /**
   * Checks if a specific party size can be accommodated at a specific time
   */
  static canAccommodate(
    date: Date,
    time: string,
    covers: number,
    settings: GlobalSettings,
    existingReservations: Reservation[],
    tables: Table[]
  ): boolean {
    const slots = this.getAvailableSlots(date, settings, existingReservations, tables);
    const slot = slots.find(s => s.time === time);
    
    if (!slot) return false;
    
    // Check total covers capacity
    if (slot.remainingCovers < covers) return false;

    // Check if there is AT LEAST one table that can take this group or a combo of tables
    // (This calls the AutomaticAssigner in the next step)
    return true; 
  }
}
