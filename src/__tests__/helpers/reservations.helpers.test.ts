 
 
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/modules/ops/providers', () => ({
    useReservations: vi.fn(), useTables: vi.fn(), useGroups: vi.fn(),
}));
vi.mock('@/modules/commerce', () => ({ useCRM: vi.fn() }));
vi.mock('@/shared/hooks/useActionPermission', () => ({ useActionPermission: vi.fn() }));
vi.mock('@/lib/nexus/NexusAdapter', () => ({ Nexus: { adapter: {}, getTenantPath: vi.fn() } }));
vi.mock('@/bootstrap/store/pillars/sovereign', () => ({ tenantIdAtom: {} }));
vi.mock('@/lib/client/authedFetch', () => ({ authedFetch: vi.fn() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('jotai', async () => {
    const actual = await vi.importActual<typeof import('jotai')>('jotai');
    return { ...actual, useAtomValue: vi.fn() };
});

import { addDays, addWeeks, subWeeks } from 'date-fns';
import {
    computeWeekAnchor,
    groupTablesByZone,
    mapTableToZoneTable,
    type ZoneTable,
} from '@/modules/commerce/relation/reservations/hooks/useReservationsPage';
import type { Table } from '@nexus/contracts';

const makeTable = (overrides: Partial<Table> = {}): Table => ({
    id: 't1',
    number: '1',
    seats: 4,
    status: 'free',
    zoneId: 'STANDARD',
    ...overrides,
} as Table);

describe('computeWeekAnchor', () => {
    const base = new Date('2025-03-10');

    it('retourne la base si weekOffset = 0', () => {
        expect(computeWeekAnchor(base, 0)).toEqual(base);
    });

    it('avance de N semaines si weekOffset > 0', () => {
        expect(computeWeekAnchor(base, 2)).toEqual(addWeeks(base, 2));
    });

    it('recule de N semaines si weekOffset < 0', () => {
        expect(computeWeekAnchor(base, -1)).toEqual(subWeeks(base, 1));
    });

    it('weekOffset = 1 → base + 7 jours', () => {
        const result = computeWeekAnchor(base, 1);
        expect(result).toEqual(addDays(base, 7));
    });
});

describe('mapTableToZoneTable', () => {
    it('mappe statut free → available', () => {
        const t = makeTable({ status: 'free' });
        expect(mapTableToZoneTable(t).status).toBe('available');
    });

    it('mappe statut seated → occupied', () => {
        const t = makeTable({ status: 'seated' as Table['status'] });
        expect(mapTableToZoneTable(t).status).toBe('occupied');
    });

    it('mappe tout autre statut → reserved', () => {
        const t = makeTable({ status: 'reserved' as Table['status'] });
        expect(mapTableToZoneTable(t).status).toBe('reserved');
    });

    it('détecte type vip depuis zoneId VIP', () => {
        const t = makeTable({ zoneId: 'VIP' });
        expect(mapTableToZoneTable(t).type).toBe('vip');
    });

    it('détecte type terrace depuis zoneId contenant "terrace"', () => {
        const t = makeTable({ zoneId: 'zone-terrasse' });
        expect(mapTableToZoneTable(t).type).toBe('terrace');
    });

    it('type standard par défaut', () => {
        const t = makeTable({ zoneId: 'STANDARD' });
        expect(mapTableToZoneTable(t).type).toBe('standard');
    });

    it('seats par défaut à 4 si absent', () => {
        const t = makeTable({ seats: undefined as unknown as number });
        expect(mapTableToZoneTable(t).seats).toBe(4);
    });
});

describe('groupTablesByZone', () => {
    it('groupe les tables par zoneId', () => {
        const tables = [
            makeTable({ id: 't1', number: '1', zoneId: 'VIP' }),
            makeTable({ id: 't2', number: '2', zoneId: 'STANDARD' }),
            makeTable({ id: 't3', number: '3', zoneId: 'VIP' }),
        ];
        const result = groupTablesByZone(tables);

        expect(result['VIP']).toHaveLength(2);
        expect(result['STANDARD']).toHaveLength(1);
    });

    it('utilise "STANDARD" comme zone par défaut si zoneId absent', () => {
        const t = makeTable({ zoneId: undefined });
        const result = groupTablesByZone([t]);
        expect(result['STANDARD']).toHaveLength(1);
    });

    it('retourne un objet vide pour un tableau vide', () => {
        expect(groupTablesByZone([])).toEqual({});
    });

    it('chaque table est convertie en ZoneTable', () => {
        const t = makeTable({ number: '5', zoneId: 'VIP', status: 'free', seats: 6 });
        const result = groupTablesByZone([t]);
        const zt = result['VIP'][0] as ZoneTable;
        expect(zt.number).toBe('5');
        expect(zt.seats).toBe(6);
        expect(zt.type).toBe('vip');
        expect(zt.status).toBe('available');
    });
});
