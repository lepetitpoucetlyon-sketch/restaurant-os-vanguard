import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class AutoIndexationHandler {
  static register() {
    return NexusEventBus.on('ai.document_uploaded', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, documentId, fileName, uploadedBy } = payload;
      
      logger.info(`[AutoIndexation] Début de l'indexation LightRAG pour le document ${fileName}`);

      try {
        // Simulation de l'appel LightRAG via fetch 
        // [TEMPORARY MOCK] Simulation d'appel à l'API LightRAG pour l'indexation.
        // A remplacer par l'URL réelle du service RAG en production.
        const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
            method: 'POST',
            body: JSON.stringify({
                tenantId,
                documentId,
                fileName,
                action: 'index'
            }),
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`LightRAG API responded with status ${response.status}`);
        }

        const data = await response.json();
        
        // Enregistrement en base
        await Nexus.adapter.update(`tenants/${tenantId}/ai/documents/${documentId}`, {
            indexStatus: 'completed',
            indexedAt: Date.now(),
            lightragId: data.id || `rag_${Date.now()}`
        });

        empireAudit.log({
            module: 'system',
            action: 'AI_DOCUMENT_INDEXED',
            userId: uploadedBy,
            instanceId: tenantId,
            details: { documentId, fileName, ragResponseId: data.id },
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
