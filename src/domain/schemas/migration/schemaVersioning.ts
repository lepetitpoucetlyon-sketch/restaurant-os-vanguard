/**
 * SchemaVersioning — Gestion du versionnage des schémas de données et migrations à la volée.
 */

export const CURRENT_SCHEMA_VERSION = 2;

export interface VersionedEntity {
    _schemaVersion?: number;
    [key: string]: unknown;
}

export type MigratorFn = (data: Record<string, unknown>) => Record<string, unknown>;

export class SchemaVersioning {
    /**
     * Enveloppe un document avec la version de schéma actuelle.
     */
    static tag<T extends Record<string, unknown>>(data: T, version: number = CURRENT_SCHEMA_VERSION): T & { _schemaVersion: number } {
        return {
            ...data,
            _schemaVersion: version,
        };
    }

    /**
     * Migre un document d'une version v(N) vers v(N+1) séquentiellement.
     */
    static migrate<T extends Record<string, unknown>>(
        data: VersionedEntity,
        migrators: Record<number, MigratorFn>,
        targetVersion: number = CURRENT_SCHEMA_VERSION
    ): T {
        let current = { ...data };
        let version = current._schemaVersion ?? 1;

        while (version < targetVersion) {
            const migrator = migrators[version];
            if (!migrator) {
                break;
            }
            current = migrator(current);
            version++;
            current._schemaVersion = version;
        }

        return current as T;
    }
}
