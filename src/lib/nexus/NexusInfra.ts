/**
 * NexusInfra — couche infrastructure agnostique du provider DB.
 *
 * Sépare les opérations de DONNÉES (INexusAdapter : get/set/query/…)
 * des opérations d'INFRASTRUCTURE (PITR, backup, health probe).
 *
 * Provider résolu depuis NEXUS_PROVIDER env var :
 *   firestore  (défaut) — Firebase Firestore PITR REST API
 *   postgres            — Supabase Management API / pg_basebackup
 *   mongo               — MongoDB Atlas Admin API
 *   sqlite              — non supporté (retourne 'unsupported')
 *   mock | simulacra    — simulation en mémoire
 */
import { logger } from '@/lib/logger';
import { fetchWithTimeout } from '@/lib/http/resilientFetch';

export interface PitrRestoreResult {
    jobId:            string;
    pitrOperationId?: string | null;
    status:           'initiated' | 'simulated' | 'unsupported';
}

export interface INexusInfraProvider {
    readonly name: string;
    pitrRestore(tenantId: string, targetTimestamp: string): Promise<PitrRestoreResult>;
}

// ─── Firestore ────────────────────────────────────────────────────────────────

class FirestoreInfraProvider implements INexusInfraProvider {
    readonly name = 'firestore';

    async pitrRestore(tenantId: string, _targetTimestamp: string): Promise<PitrRestoreResult> {
        const projectId = process.env.FIRESTORE_PROJECT_ID;
        const jobId     = crypto.randomUUID();

        if (!projectId || !process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
            logger.warn('[NexusInfra/firestore] PITR simulé — FIRESTORE_PROJECT_ID ou FIREBASE_SERVICE_ACCOUNT_JSON absent');
            return { jobId, status: 'simulated' };
        }

        try {
            // Firestore-only — PITR non-portable vers d'autres providers Nexus
            const res = await fetchWithTimeout(
                `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default):restore`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        backup:     `projects/${projectId}/locations/europe-west1/backups/${tenantId}_backup`,
                        databaseId: `restore-${tenantId}-${jobId.slice(0, 8)}`,
                    }),
                },
                10_000,
            );
            if (res.ok) {
                const op = await res.json() as { name?: string };
                return { jobId, pitrOperationId: op.name ?? null, status: 'initiated' };
            }
            logger.warn(`[NexusInfra/firestore] PITR API status ${res.status} — simulation`);
        } catch (err) {
            logger.warn('[NexusInfra/firestore] PITR API indisponible — simulation', String(err));
        }

        return { jobId, status: 'simulated' };
    }
}

// ─── Postgres / Supabase ──────────────────────────────────────────────────────

class PostgresInfraProvider implements INexusInfraProvider {
    readonly name = 'postgres';

    async pitrRestore(_tenantId: string, _targetTimestamp: string): Promise<PitrRestoreResult> {
        // TODO Supabase : POST /v1/projects/{ref}/database/restore
        // TODO OVH Managed Postgres : pg_basebackup + WAL replay
        throw new Error(
            'PostgresInfraProvider.pitrRestore — non implémenté. ' +
            'Utiliser Supabase Management API (SUPABASE_PROJECT_REF + SUPABASE_ACCESS_TOKEN) ' +
            'ou pg_basebackup pour une restore OVH.'
        );
    }
}

// ─── MongoDB Atlas ────────────────────────────────────────────────────────────

class MongoInfraProvider implements INexusInfraProvider {
    readonly name = 'mongo';

    async pitrRestore(_tenantId: string, _targetTimestamp: string): Promise<PitrRestoreResult> {
        // TODO: POST /api/atlas/v2/groups/{groupId}/clusters/{name}/backup/restoreJobs
        throw new Error(
            'MongoInfraProvider.pitrRestore — non implémenté. ' +
            'Utiliser MongoDB Atlas Admin API (MONGO_ATLAS_PROJECT_ID + MONGO_ATLAS_API_KEY).'
        );
    }
}

// ─── SQLite / Mock / Simulacra ────────────────────────────────────────────────

class UnsupportedInfraProvider implements INexusInfraProvider {
    constructor(readonly name: string) {}

    async pitrRestore(_tenantId: string, _targetTimestamp: string): Promise<PitrRestoreResult> {
        logger.info(`[NexusInfra/${this.name}] PITR non supporté pour ce provider`);
        return { jobId: crypto.randomUUID(), status: 'unsupported' };
    }
}

// ─── Factory ──────────────────────────────────────────────────────────────────

function resolveInfraProvider(): INexusInfraProvider {
    const provider = (process.env.NEXUS_PROVIDER ?? 'firestore').toLowerCase();
    switch (provider) {
        case 'firestore':  return new FirestoreInfraProvider();
        case 'postgres':   return new PostgresInfraProvider();
        case 'mongo':      return new MongoInfraProvider();
        case 'sqlite':     return new UnsupportedInfraProvider('sqlite');
        case 'mock':
        case 'simulacra':  return new UnsupportedInfraProvider(provider);
        default:
            logger.warn(`[NexusInfra] Provider inconnu "${provider}" — fallback firestore`);
            return new FirestoreInfraProvider();
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

class NexusInfraManager {
    private _provider: INexusInfraProvider | null = null;

    private get provider(): INexusInfraProvider {
        if (!this._provider) this._provider = resolveInfraProvider();
        return this._provider;
    }

    get providerName(): string { return this.provider.name; }

    pitrRestore(tenantId: string, targetTimestamp: string): Promise<PitrRestoreResult> {
        return this.provider.pitrRestore(tenantId, targetTimestamp);
    }
}

export const NexusInfra = new NexusInfraManager();
