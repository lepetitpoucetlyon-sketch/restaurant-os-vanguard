/**
 * 📥 KnowledgeIndexer — Document and media ingestion into Sovereign RAG
 */

import { logger } from '@/lib/logger';
import { NexusTelemetryService } from '@/shared/nexus/telemetry/NexusTelemetryService';
import { AuditPulseType } from '@/shared/nexus/telemetry/types';
import { sovereignIngest } from '../SovereignRAGClient';
import { documentToText } from '../subservices/documentHelpers';
import type { KnowledgeEntityType } from '../types';

export class KnowledgeIndexer {
    constructor(private readonly tenantId: string) {}

    async indexCollection(
        collectionType: KnowledgeEntityType,
        documents: Array<Record<string, unknown>>
    ): Promise<{ indexed: number; failed: number }> {
        const startTime = Date.now();
        let indexed = 0;
        let failed = 0;

        for (const doc of documents) {
            try {
                const text = documentToText(collectionType, doc);
                if (!text) { failed++; continue; }

                const fileName = `${collectionType}_${doc.id ?? Date.now()}.txt`;
                await sovereignIngest({
                    workspaceId: this.tenantId,
                    fileName,
                    fileContent: new Blob([text], { type: 'text/plain' }),
                    mimeType: 'text/plain',
                });
                indexed++;

            } catch (error) {
                logger.error(`[HermesKnowledge] Failed to index ${collectionType} document: ${error}`);
                failed++;
            }
        }

        await NexusTelemetryService.emit({
            pulse: AuditPulseType.KNOWLEDGE_QUERY,
            vassalId: this.tenantId,
            actorId: 'hermes',
            payload: {
                action: 'index_collection',
                collectionType,
                indexed,
                failed,
                durationMs: Date.now() - startTime,
            },
            severity: failed > 0 ? 'WARNING' : 'INFO',
            timestamp: new Date().toISOString(),
        });

        logger.info(
            `[HermesKnowledge] Indexed ${indexed}/${documents.length} ${collectionType} documents ` +
            `(${failed} failed, ${Date.now() - startTime}ms)`
        );

        return { indexed, failed };
    }

    async indexText(text: string, id?: string): Promise<boolean> {
        try {
            await sovereignIngest({
                workspaceId: this.tenantId,
                fileName: `text_${id ?? Date.now()}.txt`,
                fileContent: new Blob([text], { type: 'text/plain' }),
                mimeType: 'text/plain',
            });
            return true;
        } catch (error) {
            logger.error(`[HermesKnowledge] Failed to index text: ${error}`);
            return false;
        }
    }

    async indexMedia(
        fileBlob: Blob,
        metadata: { fileName: string; type: 'pdf' | 'image'; category: KnowledgeEntityType; id?: string }
    ): Promise<boolean> {
        const startTime = Date.now();

        try {
            logger.info(`[HermesKnowledge] Starting media ingestion for ${metadata.fileName} [${metadata.type}]`);
            await sovereignIngest({
                workspaceId: this.tenantId,
                fileName: metadata.fileName,
                fileContent: fileBlob,
                mimeType: metadata.type === 'pdf' ? 'application/pdf' : 'image/jpeg',
            });

            await NexusTelemetryService.emit({
                pulse: AuditPulseType.KNOWLEDGE_QUERY,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    action: 'index_media',
                    mediaType: metadata.type,
                    category: metadata.category,
                    durationMs: Date.now() - startTime,
                },
                severity: 'INFO',
                timestamp: new Date().toISOString(),
            });

            logger.info(`[HermesKnowledge] Successfully indexed media ${metadata.fileName} in ${Date.now() - startTime}ms`);
            return true;
        } catch (error) {
            logger.error(`[HermesKnowledge] Failed to index media ${metadata.fileName}: ${error}`);

            await NexusTelemetryService.emit({
                pulse: AuditPulseType.KNOWLEDGE_QUERY,
                vassalId: this.tenantId,
                actorId: 'hermes',
                payload: {
                    action: 'index_media',
                    mediaType: metadata.type,
                    category: metadata.category,
                    failed: true,
                    durationMs: Date.now() - startTime,
                },
                severity: 'WARNING',
                timestamp: new Date().toISOString(),
            });

            return false;
        }
    }
}
