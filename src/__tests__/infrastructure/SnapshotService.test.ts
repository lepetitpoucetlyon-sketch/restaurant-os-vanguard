import { describe, it, expect, beforeEach } from 'vitest';
import {
    serializeSnapshot,
    restoreSnapshot,
    NF525_IMMUTABLE_COLLECTIONS,
} from '@/infrastructure/services/backup/SnapshotService';
import { MockAdapter } from '@/lib/adapters/MockAdapter';
import {
    LocalFSBackupProvider,
} from '@/infrastructure/services/backup/BackupProvider';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Provider-agnostique par construction : le service passe par INexusAdapter.
// Le test le prouve en utilisant MockAdapter — la même logique fonctionnerait
// telle quelle avec Firestore / SqliteMemoryAdapter / futur PostgreSQL.

async function seedTenant(adapter: MockAdapter, tenantId: string) {
    // Données mutables (seront restaurées à l'identique)
    await adapter.set(`tenants/${tenantId}/products/p1`, {
        id: 'p1',
        name: 'Pizza Margherita',
        priceInMicrounits: 12_000_000,
    });
    await adapter.set(`tenants/${tenantId}/products/p2`, {
        id: 'p2',
        name: 'Salade César',
        priceInMicrounits: 8_500_000,
    });
    await adapter.set(`tenants/${tenantId}/ops_flows/o1`, {
        id: 'o1',
        totalMu: 20_500_000,
        status: 'PAID',
    });
    await adapter.set(`tenants/${tenantId}/users/u1`, {
        id: 'u1',
        email: 'chef@resto.fr',
        role: 'admin',
    });

    // Données NF525 immuables (doivent être SKIP au restore)
    await adapter.set(`tenants/${tenantId}/journalEntries/j1`, {
        id: 'j1',
        hash: 'abc',
        amountMu: 20_500_000,
    });
    await adapter.set(`tenants/${tenantId}/fiscalSeals/s1`, {
        id: 's1',
        chainHash: 'xyz',
    });
}

describe('SnapshotService — end-to-end backup + restore (provider-agnostic)', () => {
    const tenantId = 'tenant_snap_test';
    const collections = [
        'products',
        'ops_flows',
        'users',
        'journalEntries',
        'fiscalSeals',
    ] as const;

    let adapter: MockAdapter;

    beforeEach(async () => {
        adapter = new MockAdapter();
        await seedTenant(adapter, tenantId);
    });

    it('sérialise puis restaure à l’identique les collections mutables', async () => {
        const before = {
            products: await adapter.query(`tenants/${tenantId}/products`),
            ops_flows: await adapter.query(`tenants/${tenantId}/ops_flows`),
            users: await adapter.query(`tenants/${tenantId}/users`),
        };

        // 1) SNAPSHOT
        const snap = await serializeSnapshot(adapter, {
            tenantId,
            collections,
            now: () => '2026-01-01T00:00:00.000Z',
        });
        expect(snap.buffer).toBeInstanceOf(Buffer);
        expect(snap.bytes).toBeGreaterThan(0);
        expect(snap.checksum).toMatch(/^[a-f0-9]{64}$/);
        expect(snap.payload.counts).toMatchObject({
            products: 2,
            ops_flows: 1,
            users: 1,
            journalEntries: 1,
            fiscalSeals: 1,
        });

        // 2) WIPE catastrophe : on efface tout
        const allPaths = [
            `tenants/${tenantId}/products/p1`,
            `tenants/${tenantId}/products/p2`,
            `tenants/${tenantId}/ops_flows/o1`,
            `tenants/${tenantId}/users/u1`,
        ];
        for (const p of allPaths) await adapter.delete(p);
        expect(await adapter.query(`tenants/${tenantId}/products`)).toHaveLength(0);
        expect(await adapter.query(`tenants/${tenantId}/ops_flows`)).toHaveLength(0);

        // 3) RESTORE
        const result = await restoreSnapshot(adapter, snap.buffer, {
            expectedTenantId: tenantId,
            expectedChecksum: snap.checksum,
        });

        expect(result.tenantId).toBe(tenantId);
        expect(result.restoredCollections).toEqual({
            products: 2,
            ops_flows: 1,
            users: 1,
        });
        // NF525 collections skippées
        expect(result.skippedImmutable).toEqual({
            journalEntries: 1,
            fiscalSeals: 1,
        });

        // 4) ASSERT égalité byte-pour-byte des collections restaurées
        const after = {
            products: await adapter.query(`tenants/${tenantId}/products`),
            ops_flows: await adapter.query(`tenants/${tenantId}/ops_flows`),
            users: await adapter.query(`tenants/${tenantId}/users`),
        };
        expect(after.products).toEqual(expect.arrayContaining(before.products));
        expect(after.products).toHaveLength(before.products.length);
        expect(after.ops_flows).toEqual(before.ops_flows);
        expect(after.users).toEqual(before.users);
    });

    it('rejette un checksum incorrect', async () => {
        const snap = await serializeSnapshot(adapter, { tenantId, collections });
        await expect(
            restoreSnapshot(adapter, snap.buffer, { expectedChecksum: 'deadbeef' }),
        ).rejects.toThrow(/Checksum mismatch/);
    });

    it('rejette un tenantId inattendu (anti cross-tenant restore)', async () => {
        const snap = await serializeSnapshot(adapter, { tenantId, collections });
        await expect(
            restoreSnapshot(adapter, snap.buffer, { expectedTenantId: 'other_tenant' }),
        ).rejects.toThrow(/TenantId mismatch/);
    });

    it('ignore SILENCIEUSEMENT les collections NF525 immuables au restore', async () => {
        const snap = await serializeSnapshot(adapter, { tenantId, collections });

        // Efface les journalEntries (simule corruption)
        await adapter.delete(`tenants/${tenantId}/journalEntries/j1`);

        await restoreSnapshot(adapter, snap.buffer);

        // Les journalEntries NE sont PAS restaurés — l'archive WORM reste la source de vérité
        const journal = await adapter.query(`tenants/${tenantId}/journalEntries`);
        expect(journal).toHaveLength(0);

        // Sanity : la liste immutable couvre bien les fiscaux
        expect(NF525_IMMUTABLE_COLLECTIONS.has('journalEntries')).toBe(true);
        expect(NF525_IMMUTABLE_COLLECTIONS.has('fiscalSeals')).toBe(true);
        expect(NF525_IMMUTABLE_COLLECTIONS.has('wormArchives')).toBe(true);
    });

    it('round-trip avec BackupProvider LocalFS (upload → download → restore)', async () => {
        const tmp = mkdtempSync(join(tmpdir(), 'ros-snap-'));
        try {
            process.env.BACKUP_LOCAL_DIR = tmp;
            const provider = new LocalFSBackupProvider();

            // Snapshot → upload
            const snap = await serializeSnapshot(adapter, { tenantId, collections });
            const fileName = `backups/2026-01-01/${tenantId}.json.gz`;
            const { location } = await provider.upload(fileName, snap.buffer);
            expect(location).toContain(tmp);

            // Wipe côté adapter
            await adapter.delete(`tenants/${tenantId}/products/p1`);
            await adapter.delete(`tenants/${tenantId}/products/p2`);
            expect(await adapter.query(`tenants/${tenantId}/products`)).toHaveLength(0);

            // Download → restore
            const downloaded = await provider.download(fileName);
            expect(downloaded.equals(snap.buffer)).toBe(true);

            const result = await restoreSnapshot(adapter, downloaded, {
                expectedTenantId: tenantId,
                expectedChecksum: snap.checksum,
            });
            expect(result.restoredCollections.products).toBe(2);

            const products = await adapter.query(`tenants/${tenantId}/products`);
            expect(products).toHaveLength(2);
        } finally {
            rmSync(tmp, { recursive: true, force: true });
            delete process.env.BACKUP_LOCAL_DIR;
        }
    });

    it('rejette un snapshot corrompu (gzip cassé)', async () => {
        const bad = Buffer.from('not-a-gzip-stream-at-all');
        await expect(restoreSnapshot(adapter, bad)).rejects.toThrow();
    });

    it('rejette une version de snapshot inconnue', async () => {
        const snap = await serializeSnapshot(adapter, { tenantId, collections });
        // Décompresser, changer la version, recompresser
        const { gunzipSync, gzipSync } = await import('node:zlib');
        const payload = JSON.parse(gunzipSync(snap.buffer).toString());
        payload.version = 999;
        const tampered = gzipSync(Buffer.from(JSON.stringify(payload)));
        await expect(restoreSnapshot(adapter, tampered)).rejects.toThrow(
            /Unsupported snapshot version/,
        );
    });
});
