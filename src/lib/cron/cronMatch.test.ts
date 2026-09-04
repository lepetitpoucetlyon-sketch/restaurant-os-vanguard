import { describe, it, expect } from 'vitest';
import { matchesCron, isCronDueWithin } from './cronMatch';

const utc = (y: number, mo: number, d: number, h: number, mi: number) =>
    new Date(Date.UTC(y, mo - 1, d, h, mi, 0));

describe('cronMatch — évaluateur cron 5 champs (audit S1)', () => {
    it('ZReportAutoJob "59 23 * * *" ne matche qu à 23:59 UTC', () => {
        expect(matchesCron('59 23 * * *', utc(2026, 9, 3, 23, 59))).toBe(true);
        expect(matchesCron('59 23 * * *', utc(2026, 9, 3, 23, 58))).toBe(false);
        expect(matchesCron('59 23 * * *', utc(2026, 9, 3, 22, 59))).toBe(false);
    });

    it('SaaSBillingJob "0 3 1 * *" ne matche que le 1er à 03:00', () => {
        expect(matchesCron('0 3 1 * *', utc(2026, 9, 1, 3, 0))).toBe(true);
        expect(matchesCron('0 3 1 * *', utc(2026, 9, 2, 3, 0))).toBe(false);
        expect(matchesCron('0 3 1 * *', utc(2026, 9, 1, 4, 0))).toBe(false);
    });

    it('"*/5 * * * *" matche les minutes multiples de 5', () => {
        expect(matchesCron('*/5 * * * *', utc(2026, 9, 3, 12, 5))).toBe(true);
        expect(matchesCron('*/5 * * * *', utc(2026, 9, 3, 12, 0))).toBe(true);
        expect(matchesCron('*/5 * * * *', utc(2026, 9, 3, 12, 7))).toBe(false);
    });

    it('"0 * * * *" matche le début de chaque heure', () => {
        expect(matchesCron('0 * * * *', utc(2026, 9, 3, 14, 0))).toBe(true);
        expect(matchesCron('0 * * * *', utc(2026, 9, 3, 14, 30))).toBe(false);
    });

    it('isCronDueWithin rattrape une minute planifiée dans la fenêtre du tick', () => {
        // Tick à 00:02, fenêtre 5 min → couvre 23:59 la veille → le Z est rattrapé.
        expect(isCronDueWithin('59 23 * * *', utc(2026, 9, 4, 0, 2), 5)).toBe(true);
        // Hors fenêtre : tick à 00:10 ne rattrape plus 23:59.
        expect(isCronDueWithin('59 23 * * *', utc(2026, 9, 4, 0, 10), 5)).toBe(false);
    });
});
