import { describe, it, expect } from 'vitest';
import { BusinessClock } from '@/kernel/time/BusinessClock';

describe('Lot 1 — BusinessClock & Fin du Bug UTC de Minuit', () => {
  const cfgParis5h = { timezone: 'Europe/Paris', cutoverHour: 5 };

  it('stampNow() produit un TemporalStamp complet et cohérent', () => {
    const stamp = BusinessClock.stampNow(cfgParis5h);
    expect(stamp.occurredAt).toBeDefined();
    expect(stamp.businessDay).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(stamp.recordedAt).toBeDefined();
    expect(new Date(stamp.occurredAt).getTime()).toBeLessThanOrEqual(new Date(stamp.recordedAt).getTime());
  });

  it('stampAt() préserve l instant d origine et calcule la bonne journée de service', () => {
    // Ticket encaissé à 01h30 du matin le 3 septembre 2026 (heure de Paris, UTC+2)
    // 01h30 Paris = 2026-09-02T23:30:00.000Z
    const occurredAt = '2026-09-02T23:30:00.000Z';
    const stamp = BusinessClock.stampAt(occurredAt, cfgParis5h);

    expect(stamp.occurredAt).toBe(occurredAt);
    // À 01h30 locale, on est avant la bascule de 05h00 -> journée du 2026-09-02 !
    expect(stamp.businessDay).toBe('2026-09-02');
  });

  it('Bascule de service à 05h00 (Heure de fermeture nocturne)', () => {
    // 1. Soirée : 22h00 locale le 15 Octobre (UTC+2) -> 20h00 UTC
    expect(BusinessClock.resolveServiceDay('2026-10-15T20:00:00.000Z', cfgParis5h)).toBe('2026-10-15');

    // 2. Nuit : 01h00 locale le 16 Octobre -> 23h00 UTC le 15
    expect(BusinessClock.resolveServiceDay('2026-10-15T23:00:00.000Z', cfgParis5h)).toBe('2026-10-15');

    // 3. Juste avant coupure : 04h59 locale le 16 Octobre -> 02h59 UTC
    expect(BusinessClock.resolveServiceDay('2026-10-16T02:59:00.000Z', cfgParis5h)).toBe('2026-10-15');

    // 4. À la minute de coupure : 05h00 locale le 16 Octobre -> 03h00 UTC
    // Nouvelle journée de service !
    expect(BusinessClock.resolveServiceDay('2026-10-16T03:00:00.000Z', cfgParis5h)).toBe('2026-10-16');

    // 5. Matin : 08h30 locale le 16 Octobre -> 06h30 UTC
    expect(BusinessClock.resolveServiceDay('2026-10-16T06:30:00.000Z', cfgParis5h)).toBe('2026-10-16');
  });

  it('lagHours() quantifie le retard de saisie ou de synchro hors-ligne', () => {
    const stamp = {
      occurredAt: '2026-09-01T12:00:00.000Z',
      recordedAt: '2026-09-01T15:30:00.000Z',
      businessDay: '2026-09-01',
    };
    expect(BusinessClock.lagHours(stamp)).toBe(3.5);

    // Même instant -> lag 0
    expect(BusinessClock.lagHours({
      occurredAt: '2026-09-01T12:00:00.000Z',
      recordedAt: '2026-09-01T12:00:00.000Z',
      businessDay: '2026-09-01',
    })).toBe(0);
  });

  it('serviceDayBounds() encadre fidèlement la fenêtre 05h-05h locale en UTC', () => {
    // 2026-07-15 en France (CEST = UTC+2)
    // 05h00 CEST = 03h00 UTC
    const bounds = BusinessClock.serviceDayBounds('2026-07-15', cfgParis5h);
    expect(bounds.fromIso).toBe('2026-07-15T03:00:00.000Z');
    expect(bounds.toIso).toBe('2026-07-16T03:00:00.000Z');

    const durationHours = (new Date(bounds.toIso).getTime() - new Date(bounds.fromIso).getTime()) / (1000 * 60 * 60);
    expect(durationHours).toBe(24);
  });
});
