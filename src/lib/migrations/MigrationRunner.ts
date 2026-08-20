import { logger } from '@/lib/logger';
import { Nexus } from '@/lib/nexus/NexusAdapter';

// ─────────────────────────────────────────────────────────────────
// MigrationRunner — Versioned schema migrations for Firestore
// Pattern: numbered migration files applied in order, idempotent
// Status tracked in _meta/migrations/{migrationId}
// ─────────────────────────────────────────────────────────────────

export interface Migration {
  /** Unique ID — format: YYYYMMDD-description e.g. '20260820-add-schema-version' */
  id: string;
  /** Human-readable description */
  description: string;
  /** Migration function — receives tenantId, returns void */
  up: (tenantId: string) => Promise<void>;
}

interface MigrationRecord {
  id: string;
  appliedAt: string;
  status: 'success' | 'error';
  errorMessage?: string;
  durationMs: number;
}

export class MigrationRunner {
  private migrations: Migration[];

  constructor(migrations: Migration[]) {
    // Sort by ID (chronological since IDs are date-prefixed)
    this.migrations = [...migrations].sort((a, b) => a.id.localeCompare(b.id));
  }

  /** Get already-applied migration IDs for a tenant */
  async getAppliedMigrations(tenantId: string): Promise<Set<string>> {
    try {
      // recordMigration() écrit chaque record dans un sous-doc
      // `_meta/migrations/{id}`. On lit la collection, PAS le parent
      // (un `get` sur le parent renverrait rien sur un adapter document-store).
      const records = await Nexus.adapter.query<MigrationRecord>(
        `tenants/${tenantId}/_meta/migrations`,
      );
      return new Set(
        (records ?? [])
          .filter((r) => r && r.status === 'success' && typeof r.id === 'string')
          .map((r) => r.id),
      );
    } catch {
      return new Set();
    }
  }

  /** Get list of pending migrations for a tenant */
  async getPendingMigrations(tenantId: string): Promise<Migration[]> {
    const applied = await this.getAppliedMigrations(tenantId);
    return this.migrations.filter((m) => !applied.has(m.id));
  }

  /** Run all pending migrations for a single tenant */
  async runForTenant(tenantId: string): Promise<MigrationRecord[]> {
    const pending = await this.getPendingMigrations(tenantId);
    if (pending.length === 0) {
      logger.info(`[migrations] No pending migrations for tenant ${tenantId}`);
      return [];
    }

    logger.info(`[migrations] Running ${pending.length} migration(s) for tenant ${tenantId}`);
    const results: MigrationRecord[] = [];

    for (const migration of pending) {
      const start = Date.now();
      let record: MigrationRecord;

      try {
        await migration.up(tenantId);
        record = {
          id: migration.id,
          appliedAt: new Date().toISOString(),
          status: 'success',
          durationMs: Date.now() - start,
        };
        logger.info(`[migrations] ✅ ${migration.id} applied to ${tenantId} (${record.durationMs}ms)`);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        record = {
          id: migration.id,
          appliedAt: new Date().toISOString(),
          status: 'error',
          errorMessage: message,
          durationMs: Date.now() - start,
        };
        logger.error(`[migrations] ❌ ${migration.id} failed on ${tenantId}: ${message}`);
        // Stop on first error — don't apply subsequent migrations
        results.push(record);
        await this.recordMigration(tenantId, record);
        break;
      }

      results.push(record);
      await this.recordMigration(tenantId, record);
    }

    return results;
  }

  /** Run pending migrations for ALL tenants in the fleet */
  async runForAllTenants(): Promise<Map<string, MigrationRecord[]>> {
    const resultMap = new Map<string, MigrationRecord[]>();

    try {
      const tenantsSnapshot = await Nexus.adapter.get('tenants');
      if (!tenantsSnapshot || typeof tenantsSnapshot !== 'object') return resultMap;

      const tenantIds = Object.keys(tenantsSnapshot as Record<string, unknown>);
      logger.info(`[migrations] Running migrations for ${tenantIds.length} tenant(s)`);

      for (const tenantId of tenantIds) {
        // Skip meta keys
        if (tenantId.startsWith('_')) continue;
        const results = await this.runForTenant(tenantId);
        if (results.length > 0) resultMap.set(tenantId, results);
      }
    } catch (err) {
      logger.error('[migrations] Failed to enumerate tenants', err);
    }

    return resultMap;
  }

  /** Record a migration result in the tenant's _meta */
  private async recordMigration(tenantId: string, record: MigrationRecord): Promise<void> {
    try {
      await Nexus.adapter.set(
        `tenants/${tenantId}/_meta/migrations/${record.id}`,
        record
      );
    } catch (err) {
      logger.error(`[migrations] Failed to record migration ${record.id} for ${tenantId}`, err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────
// Migration Registry — Import all migrations here
// ─────────────────────────────────────────────────────────────────

const ALL_MIGRATIONS: Migration[] = [
  {
    id: '20260820-add-schema-version',
    description: 'Add _schemaVersion field to tenant config',
    up: async (tenantId: string) => {
      const configPath = `tenants/${tenantId}/tenantConfig`;
      const config = await Nexus.adapter.get(configPath);
      if (config && typeof config === 'object' && !('_schemaVersion' in (config as Record<string, unknown>))) {
        await Nexus.adapter.set(configPath, {
          ...(config as Record<string, unknown>),
          _schemaVersion: 1,
        });
      }
    },
  },
];

/** Default singleton runner with all registered migrations */
export const migrationRunner = new MigrationRunner(ALL_MIGRATIONS);
