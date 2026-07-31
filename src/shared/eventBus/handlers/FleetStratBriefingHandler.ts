import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class FleetStratBriefingHandler {
  static register() {
    return NexusEventBus.on('ai.fleet_brief_requested', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, requestedBy, fleetScope } = payload;
      
      logger.info(`[FleetStratBriefing] Génération du briefing stratégique MCC par ${requestedBy} (Scope: ${fleetScope})`);

      empireAudit.log({
        module: 'system',
        action: 'AI_FLEET_BRIEFING_GENERATED',
        userId: requestedBy,
        instanceId: tenantId,
        details: { fleetScope },
        severity: 'high',
        timestamp: new Date(),
      });
      
      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-fleet-brief-${Date.now()}`,
        type: 'info',
        title: 'Briefing Flotte Généré',
        message: `Le document de stratégie pour ${fleetScope} a été généré par l'Oracle.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
