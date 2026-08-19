/**
 * SnapshotService — Sérialisation / restauration provider-agnostique d'un tenant.
 *
 * Ne dépend PAS d'un adapter concret : reçoit un `INexusAdapter` en paramètre,
 * fonctionne identiquement avec Firestore / MockAdapter / SqliteMemoryAdapter /
 * futur PostgreSQL souverain.
 *
 * Format snapshot v1 (JSON gzippé) :
 *   {
 *     version: 1,
 *     tenantId: string,
 *     createdAt: ISO,
 *     collections: string[],
 *     counts: Record<string, number>,
 *     data: { [collection]: unknown[] }
 *   }
 *
 * Checksum SHA-256 exposé séparément (le buffer compressé est signé).
 *
 * NF525 : les collections immuables (journalEntries, fiscalSeals, fiscalLedger,
 * wormArchives) sont exportées mais IGNORÉES au restore — la source de vérité
 * fiscale reste l'archive WORM originale, jamais réécrite depuis un snapshot.
 */
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import type { INexusAdapter } from '@/lib/nexus/types';

export const SNAPSHOT_VERSION = 1;

export const NF525_IMMUTABLE_COLLECTIONS = new Set([
    'journalEntries',
    'fiscalSeals',
    'fiscalLedger',
    'wormArchives',
    'fiscalArchives',
    'grandTotals',
    'haccpLogs',
    'iotHistory',
    'auditTrails',
    'ledger',
    'seals',
    'tenantConfig',
]);

export interface SnapshotPayload {
    version: number;
    tenantId: string;
    createdAt: string;
    collections: string[];
    counts: Record<string, number>;
    data: Record<string, unknown[]>;
}

export interface SerializeOptions {
    tenantId: string;
    collections: readonly string[];
    now?: () => string;
}

export interface SerializeResult {
    buffer: Buffer;
    checksum: string;
    bytes: number;
    payload: SnapshotPayload;
}

export interface RestoreOptions {
    /** Si true, écrase tout (par défaut). Sinon merge (set with merge). */
    overwrite?: boolean;
    /** Si true, échoue si le tenantId du snapshot diffère de celui attendu. */
    expectedTenantId?: string;
    /** Vérifie le checksum contre celui-ci avant de restaurer. */
    expectedChecksum?: string;
}

export interface RestoreResult {
    tenantId: string;
    restoredCollections: Record<string, number>;
    skippedImmutable: Record<string, number>;
    createdAt: string;
}

function computeChecksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
}

/**
 * Sérialise l'état d'un tenant en un buffer gzippé + checksum SHA-256.
 * Provider-agnostique : lit uniquement via `adapter.query(collectionPath)`.
 */
export async function serializeSnapshot(
    adapter: INexusAdapter,
    opts: SerializeOptions,
): Promise<SerializeResult> {
    const { tenantId, collections } = opts;
    const createdAt = opts.now?.() ?? new Date().toISOString();

    const data: Record<string, unknown[]> = {};
    const counts: Record<string, number> = {};

    for (const collection of collections) {
        const rows = await adapter.query<unknown>(`tenants/${tenantId}/${collection}`);
        data[collection] = rows;
        counts[collection] = rows.length;
    }

    const payload: SnapshotPayload = {
        version: SNAPSHOT_VERSION,
        tenantId,
        createdAt,
        collections: [...collections],
        counts,
        data,
    };

    const json = Buffer.from(JSON.stringify(payload));
    const buffer = gzipSync(json);
    return {
        buffer,
        checksum: computeChecksum(buffer),
        bytes: buffer.length,
        payload,
    };
}

/**
 * Restaure un snapshot dans un adapter (n'importe lequel).
 *
 * Comportement :
 *   - Vérifie le checksum si fourni (throw si mismatch).
 *   - Vérifie que le tenantId matche `expectedTenantId` si fourni (throw sinon).
 *   - Vérifie la version (throw si inconnue).
 *   - Ignore silencieusement les collections NF525 immuables (audit dans le résultat).
 *   - Pour les collections restaurées : (opt. wipe) puis `set` chaque doc à son path original.
 *
 * L'écriture passe par `adapter.set()` — si l'adapter est enveloppé par NexusInterceptor,
 * SovereignGuard s'appliquera (WORM cohérent). Un adapter raw écrit sans garde.
 */
export async function restoreSnapshot(
    adapter: INexusAdapter,
    buffer: Buffer,
    opts: RestoreOptions = {},
): Promise<RestoreResult> {
    if (opts.expectedChecksum) {
        const actual = computeChecksum(buffer);
        if (actual !== opts.expectedChecksum) {
            throw new Error(
                `[SnapshotService] Checksum mismatch: expected ${opts.expectedChecksum}, got ${actual}`,
            );
        }
    }

    const raw = gunzipSync(buffer).toString('utf-8');
    const payload = JSON.parse(raw) as SnapshotPayload;

    if (payload.version !== SNAPSHOT_VERSION) {
        throw new Error(
            `[SnapshotService] Unsupported snapshot version ${payload.version} (expected ${SNAPSHOT_VERSION})`,
        );
    }

    if (opts.expectedTenantId && payload.tenantId !== opts.expectedTenantId) {
        throw new Error(
            `[SnapshotService] TenantId mismatch: snapshot=${payload.tenantId}, expected=${opts.expectedTenantId}`,
        );
    }

    const restoredCollections: Record<string, number> = {};
    const skippedImmutable: Record<string, number> = {};
    const overwrite = opts.overwrite !== false;

    for (const collection of payload.collections) {
        const rows = (payload.data[collection] ?? []) as Array<Record<string, unknown>>;

        if (NF525_IMMUTABLE_COLLECTIONS.has(collection)) {
            skippedImmutable[collection] = rows.length;
            continue;
        }

        // Wipe préalable (optionnel)
        if (overwrite) {
            const existing = await adapter.query<Record<string, unknown>>(
                `tenants/${payload.tenantId}/${collection}`,
            );
            for (const doc of existing) {
                const id = String(doc.id ?? '');
                if (id) {
                    await adapter.delete(`tenants/${payload.tenantId}/${collection}/${id}`);
                }
            }
        }

        // Réécriture doc par doc
        let written = 0;
        for (const doc of rows) {
            const id = String(doc.id ?? '');
            if (!id) continue;
            await adapter.set(
                `tenants/${payload.tenantId}/${collection}/${id}`,
                doc,
                { merge: !overwrite },
            );
            written++;
        }
        restoredCollections[collection] = written;
    }

    return {
        tenantId: payload.tenantId,
        restoredCollections,
        skippedImmutable,
        createdAt: payload.createdAt,
    };
}
