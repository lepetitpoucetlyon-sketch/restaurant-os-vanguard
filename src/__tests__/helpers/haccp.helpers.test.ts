 
 
import { describe, it, expect, vi } from 'vitest';

vi.mock('next/navigation', () => ({ useSearchParams: vi.fn(() => ({ get: vi.fn(() => null) })) }));
vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }));
vi.mock('@/lib/push/pushClient', () => ({ pushToRole: vi.fn() }));
vi.mock('@/shared/hooks', () => ({ useTenant: vi.fn(() => ({ tenantId: 'test-tenant' })) }));
vi.mock('@/verticals/restaurant/compliance/haccp/services/PlanMaitriseSanitaire', () => ({
    PlanMaitriseSanitaire: { getTemperatureLogs: vi.fn() },
}));
vi.mock('lucide-react', () => ({
    ClipboardCheck: vi.fn(), FileText: vi.fn(), CalendarCheck: vi.fn(),
    ShieldAlert: vi.fn(), Package: vi.fn(),
}));

import {
    resolveInitialTab,
    buildTempAlertFromLog,
    type HaccpTab,
    type TempAlert,
} from '@/verticals/restaurant/compliance/haccp/hooks/useHaccpPage';

const ONE_HOUR_MS = 60 * 60 * 1000;

describe('resolveInitialTab', () => {
    it("retourne haccp par defaut si tabParam est null", () => {
        expect(resolveInitialTab(null)).toBe('haccp');
    });

    it("accepte un tab valide", () => {
        const tabs: HaccpTab[] = ['haccp', 'quality', 'planning', 'compliance', 'lots'];
        for (const tab of tabs) {
            expect(resolveInitialTab(tab)).toBe(tab);
        }
    });

    it("retourne haccp pour une valeur invalide", () => {
        expect(resolveInitialTab('inexistant' as HaccpTab)).toBe('haccp');
    });
});

describe('buildTempAlertFromLog', () => {
    const nowMs = Date.now();
    const recentTs = new Date(nowMs - 10 * 60 * 1000).toISOString();
    const oldTs    = new Date(nowMs - 2 * ONE_HOUR_MS).toISOString();

    describe("cas null - pas d'alerte", () => {
        it("retourne null si timestamp absent", () => {
            const log = { id: 'l1', temperature: 15 };
            expect(buildTempAlertFromLog(log, nowMs)).toBeNull();
        });

        it("retourne null si log plus vieux qu'1h", () => {
            const log = { id: 'l1', temperature: 15, measuredAt: oldTs };
            expect(buildTempAlertFromLog(log, nowMs)).toBeNull();
        });

        it("retourne null si temperature froide dans la norme (max 8 degres)", () => {
            const log = { id: 'l1', temperature: 5, measuredAt: recentTs };
            expect(buildTempAlertFromLog(log, nowMs)).toBeNull();
        });

        it("retourne null si temperature chaude dans la norme (min 63 degres)", () => {
            const log = { id: 'l1', temperature: 75, type: 'hot' as const, measuredAt: recentTs };
            expect(buildTempAlertFromLog(log, nowMs)).toBeNull();
        });
    });

    describe("alerte froide", () => {
        it("genere alerte type cold si temp > 8 sans type hot", () => {
            const log = { id: 'l1', zone: 'Frigo 1', temperature: 12, measuredAt: recentTs };
            const alert = buildTempAlertFromLog(log, nowMs) as TempAlert;
            expect(alert).not.toBeNull();
            expect(alert.type).toBe('cold');
            expect(alert.temperature).toBe(12);
            expect(alert.zone).toBe('Frigo 1');
        });

        it("utilise storageLocationId si zone absent", () => {
            const log = { id: 'l2', storageLocationId: 'frigo_1', temperature: 10, measuredAt: recentTs };
            const alert = buildTempAlertFromLog(log, nowMs) as TempAlert;
            expect(alert?.zone).toBe('frigo_1');
        });

        it("zone Zone inconnue si aucun champ de zone", () => {
            const log = { id: 'l3', temperature: 10, measuredAt: recentTs };
            const alert = buildTempAlertFromLog(log, nowMs) as TempAlert;
            expect(alert?.zone).toBe('Zone inconnue');
        });
    });

    describe("alerte chaude", () => {
        it("genere alerte type hot si type=hot et temp < 63", () => {
            const log = { id: 'l4', zone: 'Bain-Marie', temperature: 55, type: 'hot' as const, measuredAt: recentTs };
            const alert = buildTempAlertFromLog(log, nowMs) as TempAlert;
            expect(alert).not.toBeNull();
            expect(alert.type).toBe('hot');
            expect(alert.temperature).toBe(55);
        });
    });

    describe("fallback recordedAt", () => {
        it("utilise recordedAt si measuredAt absent", () => {
            const log = { id: 'l5', temperature: 12, recordedAt: recentTs };
            const alert = buildTempAlertFromLog(log, nowMs);
            expect(alert).not.toBeNull();
        });
    });
});
