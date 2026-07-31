import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class FleetStratBriefingHandler {
  static register() {
    return NexusEventBus.on('ai.fleet_brief_requested', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, requestedBy, fleetScope } = payload;
      
      logger.info(`[FleetStratBriefing] Génération du briefing stratégique MCC par ${requestedBy} (Scope: ${fleetScope})`);

      try {
        // Query some metrics for the fleet strategy
        // In a real app we might fetch across all tenants if fleetScope === 'all', 
        // but here we will fetch metrics for the requesting tenant as an example.
        const reports = await Nexus.adapter.query<{ totalRevenue: number }>('ai/reports', {
            where: [{ field: 'tenantId', operator: '==', value: tenantId }]
        });
        
        const aggregatedRevenue = reports.reduce((acc, r) => acc + (r.totalRevenue || 0), 0);
        const briefingId = `briefing_${Date.now()}`;
        
        await Nexus.adapter.update(`tenants/${tenantId}/ai/briefings/${briefingId}`, {
            fleetScope,
            requestedBy,
            aggregatedRevenue,
            reportCount: reports.length,
            generatedAt: Date.now()
        });

        empireAudit.log({
            module: 'system',
            action: 'AI_FLEET_BRIEFING_GENERATED',
            userId: requestedBy,
            instanceId: tenantId,
            details: { fleetScope, briefingId, aggregatedRevenue },
            severity: 'high',
            timestamp: new Date(),
        });
        
        NexusEventBus.emitDurable('notification.created', {
            v: 1,
            tenantId,
            id: `alert-fleet-brief-${Date.now()}`,
            type: 'info',
            title: 'Briefing Flotte Généré',
            message: `Le document de stratégie pour ${fleetScope} a été généré par l'Oracle. Revenu agrégé: ${(aggregatedRevenue / 100).toFixed(2)}€ sur ${reports.length} rapports.`,
            priority: 'high',
            read: false,
            timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('[FleetStratBriefingHandler] Error generating briefing', String(err));
      }
    }, { id: 'fleet-strat-briefing', priority: 'BACKGROUND' });
  }
}
