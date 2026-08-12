import { describe, it, expect } from 'vitest';
import { compareValues } from '@/lib/hooks/useSorting';

describe('compareValues', () => {
    describe('égalité', () => {
        it('retourne 0 pour deux valeurs identiques (string)', () => {
            expect(compareValues<{ n: string }>('abc', 'abc', 'asc')).toBe(0);
        });
        it('retourne 0 pour deux valeurs identiques (number)', () => {
            expect(compareValues<{ n: number }>(42, 42, 'asc')).toBe(0);
        });
    });

    describe('null / undefined en fin de liste', () => {
        it('null va après toute valeur réelle', () => {
            expect(compareValues<{ n: string | null }>(null, 'a', 'asc')).toBe(1);
        });
        it('undefined va après toute valeur réelle', () => {
            expect(compareValues<{ n: string | undefined }>(undefined, 'a', 'asc')).toBe(1);
        });
        it('une valeur réelle passe avant null', () => {
            expect(compareValues<{ n: string | null }>('a', null, 'asc')).toBe(-1);
        });
    });

    describe('tri string', () => {
        it('asc : "a" < "b"', () => {
            expect(compareValues<{ n: string }>('a', 'b', 'asc')).toBeLessThan(0);
        });
        it('desc : "a" > "b" (ordre inversé)', () => {
            expect(compareValues<{ n: string }>('a', 'b', 'desc')).toBeGreaterThan(0);
        });
        it('asc : "b" > "a"', () => {
            expect(compareValues<{ n: string }>('b', 'a', 'asc')).toBeGreaterThan(0);
        });
    });

    describe('tri number', () => {
        it('asc : 1 < 10', () => {
            expect(compareValues<{ n: number }>(1, 10, 'asc')).toBeLessThan(0);
        });
        it('desc : 1 > 10 (ordre inversé)', () => {
            expect(compareValues<{ n: number }>(1, 10, 'desc')).toBeGreaterThan(0);
        });
        it('asc : négatif < positif', () => {
            expect(compareValues<{ n: number }>(-5, 3, 'asc')).toBeLessThan(0);
        });
    });

    describe('tri Date', () => {
        it('asc : date antérieure avant date postérieure', () => {
            const earlier = new Date('2024-01-01');
            const later   = new Date('2024-06-01');
            expect(compareValues<{ d: Date }>(earlier, later, 'asc')).toBeLessThan(0);
        });
        it('desc : date antérieure après date postérieure', () => {
            const earlier = new Date('2024-01-01');
            const later   = new Date('2024-06-01');
            expect(compareValues<{ d: Date }>(earlier, later, 'desc')).toBeGreaterThan(0);
        });
    });

    describe('fallback String()', () => {
        it('compare via toString pour types inconnus', () => {
            const a = true as unknown as string;
            const b = false as unknown as string;
            const result = compareValues<{ v: unknown }>(a, b, 'asc');
            expect(typeof result).toBe('number');
        });
    });
});
