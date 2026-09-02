/**
 * AirlockPipeline — The Decontamination Chamber
 * Grade X Intelligence Layer
 *
 * 4-stage pipeline: PARSE → DEDUP → VALIDATE → ENRICH
 * Private helpers extracted to airlock-helpers.ts / airlock-report.ts.
 *
 * Copyright © 2026 Mohammed-ali Boudjaadar. Tous droits réservés.
 */

import { logger } from '@/lib/logger';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';

import type {
    LegacyImportConfig,
    RawLegacyDocument,
    DuplicateCandidate,
    FiscalValidationResult,
    MigrationReport,
    OpeningBalance,
    OpeningEntry,
    LegacyArchiveEntry,
} from './types';

import {
    computeSimilarity,
    getMatchedFields,
    validateFiscalIntegrity,
    normalizeDocument,
    extractDate,
} from './airlock-helpers';

import {
    extractOpeningBalances,
    generateOpeningEntry,
    generateReport,
} from './airlock-report';

export class AirlockPipeline {
    private documents: RawLegacyDocument[] = [];
    private duplicates: DuplicateCandidate[] = [];
    private fiscalResults: FiscalValidationResult[] = [];
    private archiveEntries: LegacyArchiveEntry[] = [];

    constructor(private readonly config: LegacyImportConfig) {
        logger.info(
            `[Airlock] Pipeline initialized for ${config.sourceSystem} ` +
            `[${config.integrationMode}] — Genesis Date: ${config.genesisDate}`
        );
    }

    async parse(rawRows: Array<Record<string, string | number | null>>): Promise<number> {
        let parsed = 0;

        for (let i = 0; i < rawRows.length; i++) {
            const doc: RawLegacyDocument = {
                id: `legacy_${this.config.sessionId}_${i}`,
                sourceRowIndex: i,
                rawFields: rawRows[i],
                sourceFile: this.config.sourceSystem,
                status: 'RAW',
                issues: [],
            };

            const dataFields = { ...doc.rawFields };
            delete dataFields.id;
            delete dataFields.sourceRowIndex;
            const hasData = Object.values(dataFields).some(v => v !== null && v !== '');
            if (!hasData) {
                doc.status = 'REJECTED';
                doc.issues.push({ stage: 'PARSE', severity: 'ERROR', code: 'EMPTY_ROW', message: `Row ${i} is completely empty` });
            } else {
                doc.status = 'PARSED';
                parsed++;
            }
            this.documents.push(doc);
        }

        logger.info(`[Airlock] Stage 1 PARSE: ${parsed}/${rawRows.length} rows parsed successfully`);
        return parsed;
    }

    async dedup(): Promise<number> {
        const parsedDocs = this.documents.filter(d => d.status === 'PARSED');
        let deduplicatedCount = 0;

        for (let i = 0; i < parsedDocs.length; i++) {
            for (let j = i + 1; j < parsedDocs.length; j++) {
                const similarity = computeSimilarity(parsedDocs[i], parsedDocs[j]);

                if (similarity > 0.85) {
                    this.duplicates.push({
                        documentId:     parsedDocs[j].id,
                        matchedWithId:  parsedDocs[i].id,
                        similarityScore: similarity,
                        matchedFields:  getMatchedFields(parsedDocs[i], parsedDocs[j]),
                        resolution: 'PENDING',
                    });
                    parsedDocs[j].status = 'NEEDS_REVIEW';
                    parsedDocs[j].issues.push({
                        stage: 'DEDUP', severity: 'WARNING', code: 'POTENTIAL_DUPLICATE',
                        message: `Potential duplicate of ${parsedDocs[i].id} (${Math.round(similarity * 100)}% match)`,
                        suggestedFix: 'Review and merge or discard',
                    });
                    deduplicatedCount++;
                }
            }
            if (parsedDocs[i].status === 'PARSED') parsedDocs[i].status = 'DEDUPLICATED';
        }

        logger.info(`[Airlock] Stage 2 DEDUP: ${deduplicatedCount} potential duplicates found`);
        return deduplicatedCount;
    }

    async validate(): Promise<number> {
        const validDocs = this.documents.filter(d => d.status === 'DEDUPLICATED' || d.status === 'PARSED');
        let issueCount = 0;

        for (const doc of validDocs) {
            const result = validateFiscalIntegrity(doc);
            this.fiscalResults.push(result);

            if (result.issues.length > 0) {
                issueCount += result.issues.length;
                for (const issue of result.issues) {
                    doc.issues.push(issue.autoFixable
                        ? { stage: 'VALIDATE', severity: 'INFO', code: `AUTO_FIXED_${issue.type}`, message: `Auto-fixed: ${issue.description}` }
                        : { stage: 'VALIDATE', severity: issue.type === 'NEGATIVE_AMOUNT' ? 'ERROR' : 'WARNING', code: issue.type, message: issue.description, suggestedFix: `Expected: ${issue.expectedValue}, Got: ${issue.actualValue}` }
                    );
                }
            }

            doc.status = (!result.vatValid || !result.totalsBalanced) ? 'NEEDS_REVIEW' : 'VALIDATED';
        }

        logger.info(`[Airlock] Stage 3 VALIDATE: ${issueCount} fiscal issues found`);
        return issueCount;
    }

    async enrich(): Promise<number> {
        const validatedDocs = this.documents.filter(d => d.status === 'VALIDATED');
        let enrichedCount = 0;

        for (const doc of validatedDocs) {
            const normalized = normalizeDocument(doc);

            if (normalized) {
                doc.normalizedOutput = normalized;
                doc.status = 'ENRICHED';
                enrichedCount++;
                this.archiveEntries.push({
                    id:                doc.id,
                    sourceSystem:      this.config.sourceSystem,
                    originalDate:      extractDate(doc) ?? this.config.genesisDate,
                    entityType:        normalized.entityType,
                    data:              normalized.fields,
                    ragIndexable:      true,
                    migrationSessionId: this.config.sessionId,
                    archivedAt:        new Date().toISOString(),
                });
            } else {
                doc.status = 'NEEDS_REVIEW';
                doc.issues.push({ stage: 'ENRICH', severity: 'WARNING', code: 'NORMALIZATION_FAILED', message: 'Could not determine entity type or map fields', suggestedFix: 'Manual mapping required' });
            }
        }

        for (const doc of this.documents) {
            if (doc.status === 'ENRICHED') doc.status = 'READY';
        }

        logger.info(`[Airlock] Stage 4 ENRICH: ${enrichedCount} documents enriched and normalized`);
        return enrichedCount;
    }

    async execute(rawRows: Array<Record<string, string | number | null>>): Promise<MigrationReport> {
        const startTime = Date.now();

        await this.parse(rawRows);
        await this.dedup();
        await this.validate();
        await this.enrich();

        const report = generateReport({
            documents:     this.documents,
            duplicates:    this.duplicates,
            fiscalResults: this.fiscalResults,
            archiveEntries: this.archiveEntries,
            config:        this.config,
        }, startTime);

        await NexusTelemetryService.emit({
            pulse:    AuditPulseType.LEGACY_INGESTION,
            vassalId: this.config.tenantId,
            actorId:  this.config.initiatedBy,
            payload: {
                sessionId:       this.config.sessionId,
                sourceSystem:    this.config.sourceSystem,
                integrationMode: this.config.integrationMode,
                totalIngested:   report.stats.totalDocumentsIngested,
                successRate:     report.stats.totalDocumentsIngested > 0
                    ? Math.round((report.stats.successfullyNormalized / report.stats.totalDocumentsIngested) * 100) : 0,
                fiscalIssues:    report.stats.fiscalIssuesFound,
                durationMs:      report.durationMs,
            },
            severity:  report.stats.rejectedDocuments > 0 ? 'WARNING' : 'INFO',
            timestamp: new Date().toISOString(),
        });

        logger.info(
            `[Airlock] Pipeline complete: ${report.stats.successfullyNormalized}/${report.stats.totalDocumentsIngested} ` +
            `documents ready (${report.durationMs}ms)`
        );

        return report;
    }

    extractOpeningBalances(): OpeningBalance[] {
        return extractOpeningBalances(this.archiveEntries);
    }

    generateOpeningEntry(): OpeningEntry {
        return generateOpeningEntry(this.archiveEntries, this.config);
    }

    getArchiveEntries(): LegacyArchiveEntry[] {
        return [...this.archiveEntries];
    }

    /**
     * 💾 Persistance canonique du résultat de migration selon le mode choisi (Loi 12 & ADR-015).
     * - TABULA_RASA : Aucune écriture (page blanche).
     * - PONT : Écriture de l'archive dans legacyArchive/ + écriture d'ouverture seq=1 dans journalEntries/.
     * - SUTURE_TOTALE : Archive + écriture d'ouverture + miroir dans legacyOrders/ (origin: 'legacy').
     */
    async commit(mode: import('@nexus/contracts').IntegrationMode = this.config.integrationMode): Promise<{
        openingEntry?: OpeningEntry;
        archiveSaved: number;
        legacyOrdersSaved: number;
    }> {
        if (mode === 'TABULA_RASA') {
            logger.info(`[Airlock] Mode TABULA_RASA pour ${this.config.tenantId} — pas de persistance.`);
            return { archiveSaved: 0, legacyOrdersSaved: 0 };
        }

        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const batch = Nexus.adapter.batch();
        let archiveSaved = 0;
        let legacyOrdersSaved = 0;

        // 1. Sauvegarde dans legacyArchive/
        for (const entry of this.archiveEntries) {
            const path = `${Nexus.getTenantPath('legacyArchive', this.config.tenantId)}/${entry.id}`;
            batch.set(path, {
                ...entry,
                tenantId: this.config.tenantId,
                origin: 'legacy',
            });
            archiveSaved++;
        }

        // 2. Génération et scellement de l'OpeningEntry pour PONT et SUTURE_TOTALE
        let openingEntry: OpeningEntry | undefined;
        if (mode === 'PONT' || mode === 'SUTURE_TOTALE') {
            openingEntry = this.generateOpeningEntry();
            const path = `${Nexus.getTenantPath('journalEntries', this.config.tenantId)}/${openingEntry.id}`;
            batch.set(path, {
                ...openingEntry,
                origin: 'legacy',
                tenantId: this.config.tenantId,
                sequence: 1,
                previousHash: 'GENESIS_ROOT',
                type: 'OPENING_ENTRY',
                createdAt: this.config.genesisDate,
            });
        }

        // 3. Pour SUTURE_TOTALE, écriture dans legacyOrders/ (JAMAIS dans orders/ live)
        if (mode === 'SUTURE_TOTALE') {
            for (const entry of this.archiveEntries) {
                if (entry.entityType === 'transaction') {
                    const legacyOrderId = `legacy_order_${entry.id}`;
                    const path = `${Nexus.getTenantPath('legacyOrders', this.config.tenantId)}/${legacyOrderId}`;
                    batch.set(path, {
                        id: legacyOrderId,
                        tenantId: this.config.tenantId,
                        origin: 'legacy',
                        legacyMeta: {
                            source: this.config.sourceSystem,
                            migrationSessionId: this.config.sessionId,
                            originalDate: entry.originalDate,
                            ingestedAt: entry.archivedAt,
                        },
                        totalInCents: (entry.data.amountInCents as number) || 0,
                        data: entry.data,
                        createdAt: entry.originalDate,
                    });
                    legacyOrdersSaved++;
                }
            }
        }

        await batch.commit();

        logger.info(
            `[Airlock] Migration validée et commitée: mode=${mode}, archiveSaved=${archiveSaved}, ` +
            `legacyOrdersSaved=${legacyOrdersSaved}, openingEntry=${openingEntry?.id || 'none'}`
        );

        return { openingEntry, archiveSaved, legacyOrdersSaved };
    }
}
