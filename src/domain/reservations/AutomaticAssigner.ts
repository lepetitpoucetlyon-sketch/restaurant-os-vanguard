import { Reservation, Table } from '@/types';
import { format, parse, addMinutes, isBefore, isAfter, areIntervalsOverlapping } from 'date-fns';

export class AutomaticAssigner {
  /**
   * Finds the most efficient table for a given reservation request
   */
  static findBestTable(
    covers: number,
    date: string,
    time: string,
    tables: Table[],
    existingReservations: Reservation[]
  ): string | null {
    const reservationStart = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    
    // 1. Get available tables at this specific time
    const availableTables = tables.filter(table => {
      // Table must have enough seats
      if (table.seats < covers) return false;
      
      // Table must not be blocked by another reservation
      const isBlocked = existingReservations.some(res => {
        if (res.tableId !== table.id || res.date !== date) return false;
        
        const resStart = parse(`${res.date} ${res.time}`, 'yyyy-MM-dd HH:mm', new Date());
        const resEnd = addMinutes(resStart, res.duration || 120);
        const reqEnd = addMinutes(reservationStart, 120); // Default 2h duration for check

        return areIntervalsOverlapping(
          { start: resStart, end: resEnd },
          { start: reservationStart, end: reqEnd }
        );
      });

      return !isBlocked;
    });

    if (availableTables.length === 0) return null;

    // 2. Sort by efficiency (smallest table that fits the group)
    // We want to keep big tables for big groups.
    const sortedTables = availableTables.sort((a, b) => a.seats - b.seats);

    return sortedTables[0].id;
  }

  /**
   * Suggests table combining for large groups if no single table fits
   */
  static findTableCombo(
    covers: number,
    date: string,
    time: string,
    tables: Table[],
    existingReservations: Reservation[]
  ): string[] | null {
    // Phase 2: Implementation of table merging logic
    // For now, we only support single tables
    return null;
  }
}
