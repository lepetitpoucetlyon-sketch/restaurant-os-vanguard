import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

interface TenantRecord {
  id?: string;
  status?: string;
  name?: string;
}

interface TicketZRecord {
  totalInMicrounits: number;
  date: string;
}

interface TenantMetrics {
  tenantId: string;
  tenantName: string;
  revenueInMicrounits: number;
  ticketCount: number;
}

export class FleetStratBriefingHandler {
  static register() {
    return NexusEventBus.on('ai.fleet_brief_requested', async (payload) => {
      if (payload.isSimulation) return;

      const { tenantId, requestedBy, fleetScope } = payload;

      logger.info(`[FleetStratBriefing] Génération du briefing stratégique MCC par ${requestedBy} (Scope: ${fleetScope})`);

      try {
        const briefingId = `briefing_${Date.now()}`;
        let aggregatedRevenue = 0;
        let totalTickets = 0;
        let activeTenantCount = 0;
        const perTenantMetrics: TenantMetrics[] = [];

        if (fleetScope === 'all') {
          // Cross-tenant aggregation : requête de tous les tenants actifs
          let allTenants: TenantRecord[] = [];
          try {
            allTenants = await Nexus.adapter.query<TenantRecord>('tenants', {
              where: [{ field: 'status', operator: '==', value: 'active' }]
            });
          } catch (err) {
            logger.warn('[FleetStratBriefing] Impossible de lister les tenants, fallback single-tenant', toError(err).message);
            allTenants = [{ id: tenantId, name: 'current' }];
          }

          // Derniers 7 jours pour les Ticket Z
          const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

          for (const tenant of allTenants) {
            const tid = tenant.id;
            if (!tid) continue;

            try {
              const ticketZData = await Nexus.adapter.query<TicketZRecord>(
                `tenants/${tid}/finance/ticketZ`, {
                  where: [{ field: 'date', operator: '>=', value: sevenDaysAgo }]
                }
              );

              const tenantRevenue = ticketZData.reduce((sum, t) => sum + (t.totalInMicrounits || 0), 0);

              perTenantMetrics.push({
                tenantId: tid,
                tenantName: tenant.name || tid,
                revenueInMicrounits: tenantRevenue,
                ticketCount: ticketZData.length
              });

              aggregatedRevenue += tenantRevenue;
              totalTickets += ticketZData.length;
              activeTenantCount++;
            } catch (err) {
              logger.warn(`[FleetStratBriefing] Erreur récupération données tenant ${tid}`, toError(err).message);
            }
          }
        } else {
          // Single tenant : uniquement le tenant demandeur
          const reports = await Nexus.adapter.query<{ totalRevenue: number }>('ai/reports', {
            where: [{ field: 'tenantId', operator: '==', value: tenantId }]
          });

          aggregatedRevenue = reports.reduce((acc, r) => acc + (r.totalRevenue || 0), 0);
          totalTickets = reports.length;
          activeTenantCount = 1;
        }

        const avgHealthScore = activeTenantCount > 0
          ? Math.round((totalTickets / (activeTenantCount * 7)) * 100) / 100 // tickets/jour moyen
          : 0;

        await Nexus.adapter.update(`tenants/${tenantId}/ai/briefings/${briefingId}`, {
          fleetScope,
          requestedBy,
          aggregatedRevenueInMicrounits: aggregatedRevenue,
          totalTickets,
          activeTenantCount,
          avgDailyTicketsPerTenant: avgHealthScore,
          perTenantMetrics: fleetScope === 'all' ? perTenantMetrics : undefined,
          generatedAt: Date.now()
        });

        empireAudit.log({
          module: 'system',
          action: 'AI_FLEET_BRIEFING_GENERATED',
          userId: requestedBy,
          instanceId: tenantId,
          details: { fleetScope, briefingId, aggregatedRevenue, activeTenantCount },
          severity: 'high',
          timestamp: new Date(),
        });

        NexusEventBus.emitDurable('notification.created', {
          v: 1,
          tenantId,
          id: `alert-fleet-brief-${Date.now()}`,
          type: 'info',
          title: 'Briefing Flotte Généré',
          message: fleetScope === 'all'
            ? `Briefing cross-tenant : ${activeTenantCount} établissements actifs, CA agrégé ${(aggregatedRevenue / 1_000_000).toFixed(2)} € sur 7 jours.`
            : `Briefing mono-tenant généré. Revenu agrégé : ${(aggregatedRevenue / 1_000_000).toFixed(2)} € sur ${totalTickets} rapports.`,
          priority: 'high',
          read: false,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        logger.error('[FleetStratBriefingHandler] Error generating briefing', toError(err).message);
        throw err;
      }
    }, { id: 'fleet-strat-briefing', priority: 'BACKGROUND' });
  }
}
