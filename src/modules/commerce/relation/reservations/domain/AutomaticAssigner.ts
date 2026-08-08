import { Reservation, Table } from '@nexus/contracts';
import { parse, addMinutes, areIntervalsOverlapping } from 'date-fns';

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
        const resEnd = addMinutes(resStart, Number(res.duration || 120));
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

  static findTableCombo(
    covers: number,
    date: string,
    time: string,
    tables: Table[],
    existingReservations: Reservation[]
  ): string[] | null {
    const reservationStart = parse(`${date} ${time}`, 'yyyy-MM-dd HH:mm', new Date());
    const requestEnd = addMinutes(reservationStart, 120);

    const available = tables.filter(table =>
      !existingReservations.some(res => {
        if (res.tableId !== table.id || res.date !== date) return false;
        const resStart = parse(`${res.date} ${res.time}`, 'yyyy-MM-dd HH:mm', new Date());
        const resEnd = addMinutes(resStart, Number(res.duration || 120));
        return areIntervalsOverlapping(
          { start: resStart, end: resEnd },
          { start: reservationStart, end: requestEnd }
        );
      })
    );

    // Group tables by zoneId (only allow merging tables in the same zone)
    const tablesByZone = new Map<string, Table[]>();
    for (const t of available) {
      const zoneId = (t as { zoneId?: string }).zoneId || 'default';
      const list = tablesByZone.get(zoneId) || [];
      list.push(t);
      tablesByZone.set(zoneId, list);
    }

    for (const [, zoneTables] of tablesByZone.entries()) {
      const sorted = [...zoneTables].sort((a, b) => b.seats - a.seats);

      const findCombo = (remaining: number, pool: Table[], selected: Table[]): string[] | null => {
        if (remaining <= 0) return selected.map(t => t.id);
        if (pool.length === 0) return null;
        const [head, ...tail] = pool;
        return (
          findCombo(remaining - head.seats, tail, [...selected, head]) ??
          findCombo(remaining, tail, selected)
        );
      };

      const combo = findCombo(covers, sorted, []);
      if (combo && combo.length <= 3) {
        return combo;
      }
    }

    return null;
  }
}
