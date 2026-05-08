/**
 * 📚 LegacyArchive — Read-Only Historical Data Vault
 * Grade X Intelligence Layer
 *
 * Stores decontaminated legacy data in a read-only archive.
 * The LightRAG can traverse this archive for contextual enrichment,
 * but no data from here can enter the active SovereignLedger.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import type { LegacyArchiveEntry, LegacySourceSystem } from './types';

// ============================================
// LEGACY ARCHIVE
// ============================================

export class LegacyArchive {
    private entries: LegacyArchiveEntry[] = [];
    private sealed: boolean = false;

    constructor(private readonly tenantId: string) {
        logger.info(`[LegacyArchive] Initialized for tenant: ${tenantId}`);
    }

    /**
     * 📥 Ingests archive entries from the AirlockPipeline.
     * Can only be called before the archive is sealed.
     */
    ingest(entries: LegacyArchiveEntry[]): void {
        if (this.sealed) {
            throw new Error('[LegacyArchive] Cannot ingest into a sealed archive. The Genesis Date has passed.');
        }
        this.entries.push(...entries);
        logger.info(`[LegacyArchive] Ingested ${entries.length} entries (total: ${this.entries.length})`);
    }

    /**
     * 🔒 Seals the archive — no more writes allowed.
     * This should be called after the migration is validated by the client.
     */
    seal(): void {
        this.sealed = true;
        logger.info(`[LegacyArchive] Archive SEALED. ${this.entries.length} entries are now read-only.`);
    }

    /**
     * 🔍 Queries the archive (read-only).
     */
    query(filters: {
        entityType?: string;
        sourceSystem?: LegacySourceSystem;
        dateFrom?: string;
        dateTo?: string;
        keyword?: string;
    }): LegacyArchiveEntry[] {
        let results = [...this.entries];

        if (filters.entityType) {
            results = results.filter(e => e.entityType === filters.entityType);
        }

        if (filters.sourceSystem) {
            results = results.filter(e => e.sourceSystem === filters.sourceSystem);
        }

        if (filters.dateFrom) {
            results = results.filter(e => e.originalDate >= filters.dateFrom!);
        }

        if (filters.dateTo) {
            results = results.filter(e => e.originalDate <= filters.dateTo!);
        }

        if (filters.keyword) {
            const kw = filters.keyword.toLowerCase();
            results = results.filter(e =>
                Object.values(e.data).some(v =>
                    String(v).toLowerCase().includes(kw)
                )
            );
        }

        return results;
    }

    /**
     * Returns entries that are flagged as indexable by the LightRAG.
     */
    getRAGIndexableEntries(): LegacyArchiveEntry[] {
        return this.entries.filter(e => e.ragIndexable);
    }

    /**
     * Returns a statistical summary of the archive.
     */
    getSummary(): {
        totalEntries: number;
        byEntityType: Record<string, number>;
        bySource: Record<string, number>;
        dateRange: { earliest: string; latest: string } | null;
        isSealed: boolean;
    } {
        const byEntityType: Record<string, number> = {};
        const bySource: Record<string, number> = {};
        let earliest = '';
        let latest = '';

        for (const entry of this.entries) {
            byEntityType[entry.entityType] = (byEntityType[entry.entityType] ?? 0) + 1;
            bySource[entry.sourceSystem] = (bySource[entry.sourceSystem] ?? 0) + 1;

            if (!earliest || entry.originalDate < earliest) earliest = entry.originalDate;
            if (!latest || entry.originalDate > latest) latest = entry.originalDate;
        }

        return {
            totalEntries: this.entries.length,
            byEntityType,
            bySource,
            dateRange: this.entries.length > 0 ? { earliest, latest } : null,
            isSealed: this.sealed,
        };
    }

    isSealed(): boolean {
        return this.sealed;
    }

    getEntryCount(): number {
        return this.entries.length;
    }
}
