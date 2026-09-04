import { describe, it, expect } from 'vitest';
import { parsePaginationParams, paginateAfterId } from './pagination';

describe('pagination (audit S7)', () => {
    describe('parsePaginationParams', () => {
        it('applique les défauts si aucun paramètre', () => {
            const q = parsePaginationParams('https://x/y');
            expect(q.limit).toBe(50);
            expect(q.cursor).toBeUndefined();
        });

        it('parse limit + cursor', () => {
            const q = parsePaginationParams('https://x/y?limit=10&cursor=abc');
            expect(q.limit).toBe(10);
            expect(q.cursor).toBe('abc');
        });

        it('plafonne le limit à 500', () => {
            const q = parsePaginationParams('https://x/y?limit=99999');
            expect(q.limit).toBe(50); // safeParse échoue sur max(500) → fallback défaut
        });
    });

    describe('paginateAfterId', () => {
        const items = Array.from({ length: 10 }, (_, i) => ({ id: `id_${i}` }));

        it('première page : nextCursor = dernier id retourné', () => {
            const p = paginateAfterId(items, { limit: 3 });
            expect(p.items.map((i) => i.id)).toEqual(['id_0', 'id_1', 'id_2']);
            expect(p.nextCursor).toBe('id_2');
            expect(p.total).toBe(10);
        });

        it('page suivante depuis un cursor', () => {
            const p = paginateAfterId(items, { limit: 3, cursor: 'id_2' });
            expect(p.items.map((i) => i.id)).toEqual(['id_3', 'id_4', 'id_5']);
            expect(p.nextCursor).toBe('id_5');
        });

        it('dernière page : nextCursor = null', () => {
            const p = paginateAfterId(items, { limit: 3, cursor: 'id_6' });
            expect(p.items.map((i) => i.id)).toEqual(['id_7', 'id_8', 'id_9']);
            expect(p.nextCursor).toBeNull();
        });

        it('cursor inconnu → repart du début (comportement défensif)', () => {
            const p = paginateAfterId(items, { limit: 3, cursor: 'ghost' });
            expect(p.items.map((i) => i.id)).toEqual(['id_0', 'id_1', 'id_2']);
        });

        it('accepte un identifiant métier explicite autre que id', () => {
            const devices = [{ deviceId: 'device_a' }, { deviceId: 'device_b' }];
            const p = paginateAfterId(devices, { limit: 1 }, (device) => device.deviceId);

            expect(p.items).toEqual([{ deviceId: 'device_a' }]);
            expect(p.nextCursor).toBe('device_a');
        });
    });
});
