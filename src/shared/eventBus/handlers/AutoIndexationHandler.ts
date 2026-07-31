import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class AutoIndexationHandler {
  static register() {
    return NexusEventBus.on('ai.document_uploaded', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, documentId, fileName, uploadedBy } = payload;
      
      logger.info(`[AutoIndexation] Début de l'indexation LightRAG pour le document ${fileName}`);

      // Simulation de l'appel LightRAG (ex: embeddings & vector db)
      await new Promise(r => setTimeout(r, 1000));

      empireAudit.log({
        module: 'system',
        action: 'AI_DOCUMENT_INDEXED',
        userId: uploadedBy,
        instanceId: tenantId,
        details: { documentId, fileName },
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
    });
  }
}
