import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MigrationRunner, type Migration } from '@/lib/migrations/MigrationRunner';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { MockAdapter } from '@/lib/adapters/MockAdapter';

// Tests unitaires MigrationRunner — critique car chaque migration touche
// des dizaines de tenants. Provider-agnostique via MockAdapter.

describe('MigrationRunner', () => {
    let mockAdapter: MockAdapter;

    beforeEach(() => {
        mockAdapter = new MockAdapter();
        Nexus.adapter = mockAdapter;
        vi.restoreAllMocks();
    });

    const noop: Migration = {
        id: '20260101-noop',
        description: 'no-op',
        up: async () => {},
    };

    const stampV2: Migration = {
        id: '20260215-stamp-v2',
        description: 'stamp _schemaVersion=2 on tenantConfig',
        up: async (tenantId: string) => {
            const p = `tenants/${tenantId}/tenantConfig`;
            const cfg = ((await Nexus.adapter.get(p)) as Record<string, unknown>) ?? {};
            await Nexus.adapter.set(p, { ...cfg, _schemaVersion: 2 });
        },
    };

    describe('Tri chronologique', () => {
        it('trie les migrations par ID ascendant (chronologique)', async () => {
            const later: Migration = { id: '20260301-later', description: '', up: async () => {} };
            const earlier: Migration = { id: '20260101-earlier', description: '', up: async () => {} };
            const runner = new MigrationRunner([later, earlier]);
            const pending = await runner.getPendingMigrations('t1');
            expect(pending.map((m) => m.id)).toEqual([
                '20260101-earlier',
                '20260301-later',
            ]);
        });
    });

    describe('getAppliedMigrations()', () => {
        it('retourne Set vide si aucune migration appliquée', async () => {
            const runner = new MigrationRunner([noop]);
            const applied = await runner.getAppliedMigrations('t-fresh');
            expect(applied.size).toBe(0);
        });

        it('exclut les migrations en erreur (status=error)', async () => {
            // Semer un enregistrement failed
            await mockAdapter.set('tenants/t1/_meta/migrations', {
                '20260101-noop': {
                    id: '20260101-noop',
                    appliedAt: '2026-01-01T00:00:00Z',
                    status: 'error',
                    errorMessage: 'boom',
                    durationMs: 12,
                },
            });
            const runner = new MigrationRunner([noop]);
            const applied = await runner.getAppliedMigrations('t1');
            expect(applied.has('20260101-noop')).toBe(false);
        });
    });

    describe('runForTenant()', () => {
        it('applique une migration pending et l’enregistre en success', async () => {
            const runner = new MigrationRunner([stampV2]);
            await mockAdapter.set('tenants/t1/tenantConfig', { name: 'Chez Léo' });

            const results = await runner.runForTenant('t1');
            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                id: '20260215-stamp-v2',
                status: 'success',
            });
            expect(results[0].durationMs).toBeGreaterThanOrEqual(0);

            // Vérif effet réel
            const cfg = (await mockAdapter.get('tenants/t1/tenantConfig')) as Record<string, unknown>;
            expect(cfg._schemaVersion).toBe(2);
        });

        it('n’applique PAS deux fois une migration déjà success', async () => {
            const runner = new MigrationRunner([stampV2]);
            await mockAdapter.set('tenants/t1/tenantConfig', { name: 'Chez Léo' });

            const first = await runner.runForTenant('t1');
            expect(first).toHaveLength(1);

            const second = await runner.runForTenant('t1');
            expect(second).toHaveLength(0); // rien à faire
        });

        it('enregistre le status=error si la migration throw ET stoppe la suite', async () => {
            const failing: Migration = {
                id: '20260220-failing',
                description: 'broken',
                up: async () => {
                    throw new Error('rupture chaîne');
                },
            };
            const after: Migration = {
                id: '20260225-after',
                description: 'never runs',
                up: async () => {
                    throw new Error('should NOT run');
                },
            };
            const runner = new MigrationRunner([failing, after]);

            const results = await runner.runForTenant('t1');
            expect(results).toHaveLength(1);
            expect(results[0]).toMatchObject({
                id: '20260220-failing',
                status: 'error',
                errorMessage: 'rupture chaîne',
            });

            // Vérif : "after" n’a jamais tourné (sinon Error 'should NOT run' remonterait)
            // et n’a pas été enregistré
            const applied = await runner.getAppliedMigrations('t1');
            expect(applied.has('20260220-failing')).toBe(false);
            expect(applied.has('20260225-after')).toBe(false);
        });

        it('ne fait rien et log si zéro pending', async () => {
            const runner = new MigrationRunner([]);
            const results = await runner.runForTenant('t1');
            expect(results).toEqual([]);
        });
    });

    describe('getPendingMigrations()', () => {
        it('exclut les migrations déjà appliquées avec succès', async () => {
            const runner = new MigrationRunner([noop, stampV2]);
            await mockAdapter.set('tenants/t1/tenantConfig', {});
            await runner.runForTenant('t1');

            const pending = await runner.getPendingMigrations('t1');
            expect(pending).toHaveLength(0);
        });
    });

    describe('Idempotence des migrations up()', () => {
        it('la migration stamp-v2 est idempotente (rejeu = même résultat)', async () => {
            await mockAdapter.set('tenants/t1/tenantConfig', { name: 'Chez Léo' });

            await stampV2.up('t1');
            const after1 = (await mockAdapter.get('tenants/t1/tenantConfig')) as Record<string, unknown>;
            expect(after1._schemaVersion).toBe(2);

            await stampV2.up('t1');
            const after2 = (await mockAdapter.get('tenants/t1/tenantConfig')) as Record<string, unknown>;
            expect(after2._schemaVersion).toBe(2);
        });
    });
});
