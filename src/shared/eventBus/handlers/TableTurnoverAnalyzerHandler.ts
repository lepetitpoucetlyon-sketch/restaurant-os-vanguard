import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerTableTurnoverAnalyzerHandler() {
  // Gère l'assignation (début du chrono)
  const unsubAssigned = NexusEventBus.on(
    'table.assigned',
    async (payload) => {
      const { tenantId, tableId, partySize } = payload;
      
      await Nexus.adapter.set(`tenants/${tenantId}/tables/${tableId}/currentSession`, {
        seatedAt: Date.now(),
        partySize
      });
      
      empireAudit.log({
        module: 'ops',
        action: 'TABLE_SEATED',
        details: { tableId, partySize },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'table-turnover-assigned', priority: 'BACKGROUND' }
  );

  // Gère la libération (fin du chrono et analyse)
  const unsubReleased = NexusEventBus.on(
    'table.released',
    async (payload) => {
      const { tenantId, tableId } = payload;
      
      const sessionPath = `tenants/${tenantId}/tables/${tableId}/currentSession`;
      const session = await Nexus.adapter.get<any>(sessionPath);
      
      if (session && session.seatedAt) {
        const releasedAt = Date.now();
        const durationMinutes = Math.round((releasedAt - session.seatedAt) / 60000);
        
        logger.info(`[TableTurnover] Table ${tableId} libérée. Durée: ${durationMinutes} min pour ${session.partySize} couverts.`);
        
        // Sauvegarde de la métrique pour le Yield Management
        await Nexus.adapter.set(`tenants/${tenantId}/analytics/turnover_${Date.now()}`, {
          tableId,
          partySize: session.partySize,
          durationMinutes,
          date: new Date().toISOString()
        });
        
        // Nettoyage de la session courante
        await Nexus.adapter.update(`tenants/${tenantId}/tables/${tableId}`, {
          currentSession: null
        });
      }

      empireAudit.log({
        module: 'ops',
        action: 'TABLE_RELEASED',
        details: { tableId },
        severity: 'low',
        timestamp: new Date(),
      });
    },
    { id: 'table-turnover-released', priority: 'BACKGROUND' }
  );

  return () => {
    unsubAssigned();
    unsubReleased();
  };
}
