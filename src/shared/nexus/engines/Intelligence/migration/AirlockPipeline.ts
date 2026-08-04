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

            const hasData = Object.values(doc.rawFields).some(v => v !== null && v !== '');
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
}
