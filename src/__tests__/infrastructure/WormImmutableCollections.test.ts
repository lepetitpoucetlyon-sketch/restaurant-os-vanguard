import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusInterceptor } from '@/lib/nexus/NexusInterceptor';
import { SovereignGuard } from '@/shared/nexus/guards/SovereignGuard';
import type { INexusAdapter, NexusContext } from '@/lib/nexus/types';

// Verrou anti-régression WORM — provider-agnostique par construction
// (utilise un MockAdapter, la garde s'exécute au niveau NexusInterceptor
// donc s'applique identiquement à Firestore / Simulacra / SQLite souverain).
//
// Si quelqu'un retire une collection de IMMUTABLE_COLLECTIONS, ce test casse.

const buildMockAdapter = (): INexusAdapter => ({
    get: vi.fn().mockResolvedValue(null),
    query: vi.fn().mockResolvedValue([]),
    onSnapshot: vi.fn(() => () => {}),
    batch: vi.fn(() => ({
        set: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        increment: vi.fn(),
        commit: vi.fn().mockResolvedValue(undefined),
    })),
    set: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    runTransaction: vi.fn(),
    increment: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue('id_new'),
    delete: vi.fn().mockResolvedValue(undefined),
    generateId: vi.fn(() => 'id_gen'),
    serverTimestamp: vi.fn(() => 'ts'),
});

describe('WORM — IMMUTABLE_COLLECTIONS matrix (NF525)', () => {
    const ctx: NexusContext = { vassalId: 'tenant_worm', actorId: 'user_worm' };
    let adapter: INexusAdapter;
    let interceptor: NexusInterceptor;

    beforeEach(() => {
        adapter = buildMockAdapter();
        interceptor = new NexusInterceptor(adapter, SovereignGuard, () => 'tenant_worm');
    });

    const immutable = Array.from(SovereignGuard.IMMUTABLE_COLLECTIONS);

    it('déclare au moins les collections fiscales sacrées', () => {
        expect(immutable).toEqual(
            expect.arrayContaining([
                'journalEntries',
                'fiscalSeals',
                'fiscalLedger',
                'wormArchives',
                'fiscalArchives',
                'grandTotals',
                'haccpLogs',
                'auditTrails',
            ]),
        );
    });

    describe.each(immutable)('collection immuable "%s"', (collection) => {
        const docPath = `${collection}/doc_1`;

        it('canDelete() renvoie false', () => {
            expect(SovereignGuard.canDelete(docPath)).toBe(false);
        });

        it('canUpdate() renvoie false', () => {
            expect(SovereignGuard.canUpdate(docPath)).toBe(false);
        });

        it('DELETE direct throw NF525_VIOLATION', async () => {
            await expect(interceptor.delete(docPath, ctx)).rejects.toThrow(/NF525/);
            expect(adapter.delete).not.toHaveBeenCalled();
        });

        it('UPDATE direct throw NF525_VIOLATION', async () => {
            await expect(
                interceptor.update(docPath, { tampered: true }, ctx),
            ).rejects.toThrow(/NF525/);
            expect(adapter.update).not.toHaveBeenCalled();
        });

        it('DELETE en batch throw NF525_VIOLATION', () => {
            const batch = interceptor.batch();
            expect(() => batch.delete(docPath)).toThrow(/NF525/);
        });

        it('UPDATE en batch throw NF525_VIOLATION', () => {
            const batch = interceptor.batch();
            expect(() => batch.update(docPath, { tampered: true })).toThrow(/NF525/);
        });
    });

    describe('validateAccessGradeX — matrice UPDATE/DELETE', () => {
        it.each(immutable)('refuse DELETE sur %s', async (collection) => {
            const result = await SovereignGuard.validateAccessGradeX(
                'DELETE',
                `tenants/tenant_worm/${collection}/doc_1`,
                { vassalId: 'tenant_worm', actorId: 'user_worm' },
            );
            expect(result.granted).toBe(false);
            expect(result.reason).toBe('NF525_DELETE_IMMUTABLE_FORBIDDEN');
        });

        it.each(immutable)('refuse UPDATE sur %s', async (collection) => {
            const result = await SovereignGuard.validateAccessGradeX(
                'UPDATE',
                `tenants/tenant_worm/${collection}/doc_1`,
                { vassalId: 'tenant_worm', actorId: 'user_worm' },
            );
            expect(result.granted).toBe(false);
            expect(result.reason).toBe('NF525_UPDATE_IMMUTABLE_FORBIDDEN');
        });
    });

    it('autorise UPDATE/DELETE sur collections mutables (contre-preuve)', () => {
        expect(SovereignGuard.canDelete('orders/doc_1')).toBe(true);
        expect(SovereignGuard.canUpdate('orders/doc_1')).toBe(true);
        expect(SovereignGuard.canDelete('products/doc_1')).toBe(true);
        expect(SovereignGuard.canUpdate('products/doc_1')).toBe(true);
    });
});
