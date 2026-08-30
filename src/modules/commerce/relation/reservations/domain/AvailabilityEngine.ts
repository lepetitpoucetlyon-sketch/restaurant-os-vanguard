import { AutomaticAssigner } from './AutomaticAssigner';
import { GlobalSettings } from '@nexus/contracts';
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
        settings,
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
        settings,
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
    settings: GlobalSettings,
    existingReservations: Reservation[],
    tables: Table[],
    date: Date,
    results: AvailableSlot[]
  ) {
    const slotSettings = settings.reservationSlots || { slotDuration: 15, intervalBetweenSlots: 15, maxCoversPerSlot: 20 };
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

      // Pacing calculation : arrival flow at this exact slot
      const arrivingCovers = existingReservations
        .filter(r => r.date === format(date, 'yyyy-MM-dd') && r.time === timeStr && r.status !== 'cancelled')
        .reduce((sum, r) => sum + (r.covers ?? 0), 0);

      const resCfg = settings.reservationConfig as { maxCoversPerPacingSlot?: number; pacingEnabled?: boolean } | undefined;
      const pacingLimit = resCfg?.maxCoversPerPacingSlot ?? 8;
      const pacingEnabled = resCfg?.pacingEnabled ?? true;

      const remainingCovers = totalCap - bookedCovers;
      const isPacingSaturated = pacingEnabled && arrivingCovers >= pacingLimit;

      results.push({
        time: timeStr,
        remainingCovers: isPacingSaturated ? 0 : remainingCovers,
        totalCapacity: totalCap,
        status: isPacingSaturated ? 'full' : remainingCovers > (totalCap * 0.2) ? 'available' : remainingCovers > 0 ? 'limited' : 'full'
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

    // Check Pacing arrival quota
    const resCfg = settings.reservationConfig as { maxCoversPerPacingSlot?: number; pacingEnabled?: boolean } | undefined;
    const pacingEnabled = resCfg?.pacingEnabled ?? true;
    const pacingLimit = resCfg?.maxCoversPerPacingSlot ?? 8;
    if (pacingEnabled) {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingArrivals = existingReservations
        .filter(r => r.date === dateStr && r.time === time && r.status !== 'cancelled')
        .reduce((sum, r) => sum + (r.covers ?? 0), 0);
      
      if (existingArrivals + covers > pacingLimit) {
        return false;
      }
    }

    // PLAN LOGIQUE MÉTIER LOT G (P2) — vraie vérification d'assignation :
    // chercher AU MOINS une table libre du bon calibre à ce créneau (via
    // AutomaticAssigner). Si aucune table simple ne convient, tenter une
    // combinaison de tables jusqu'à 3 (même zone).
    // AVANT : return true systématique, permettait d'accepter un groupe de
    // 8 dans un restaurant de 40 couverts n'ayant que des tables de 2.
    const dateStr = format(date, 'yyyy-MM-dd');
    const singleTableId = AutomaticAssigner.findBestTable(covers, dateStr, time, tables, existingReservations);
    if (singleTableId) return true;
    const combo = AutomaticAssigner.findTableCombo(covers, dateStr, time, tables, existingReservations);
    return combo !== null;
  }
}
