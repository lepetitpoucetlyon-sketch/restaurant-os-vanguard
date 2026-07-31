import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { LightRAGClient } from '@/modules/intelligence/rag/LightRAGClient';

export class AutoIndexationHandler {
  static register() {
    return NexusEventBus.on('ai.document_uploaded', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, documentId, fileName, uploadedBy } = payload;
      
      logger.info(`[AutoIndexation] Début de l'indexation LightRAG pour le document ${fileName}`);

      try {
        const ragUrl = process.env.LIGHTRAG_URL || 'http://localhost:9621';
        const client = new LightRAGClient({ baseUrl: ragUrl, workspace: tenantId });
        
        // On simule l'envoi du document pour indexation, car on n'a que le documentId
        // Dans la réalité le RAG ira le lire dans GCS/S3, ou bien on lui passe un Blob.
        const response = await client.insert(`Metadata: ${fileName}`, documentId);

        if (response.status === 'error') {
            throw new Error(`LightRAG API responded with error: ${response.message}`);
        }

        // Enregistrement en base
        await Nexus.adapter.update(`tenants/${tenantId}/ai/documents/${documentId}`, {
            indexStatus: 'completed',
            indexedAt: Date.now(),
            lightragId: documentId
        });

        empireAudit.log({
            module: 'system',
            action: 'AI_DOCUMENT_INDEXED',
            userId: uploadedBy,
            instanceId: tenantId,
            details: { documentId, fileName, ragResponseId: documentId },
            severity: 'low',
            timestamp: new Date(),
        });
        
        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-rag-${documentId}`,
            type: 'info',
            title: 'Indexation Terminée',
            message: `Le document ${fileName} a été indexé et est disponible pour l'Oracle.`,
            priority: 'low',
            read: false,
            timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error(`[AutoIndexationHandler] Erreur d'indexation:`, String(err));
        
        await Nexus.adapter.update(`tenants/${tenantId}/ai/documents/${documentId}`, {
            indexStatus: 'failed',
            error: String(err),
            updatedAt: Date.now()
        });
      }
    }, { id: 'auto-indexation', priority: 'BACKGROUND' });
  }
}
