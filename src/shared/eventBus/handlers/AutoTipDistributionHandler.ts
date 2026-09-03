import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import {
  TipsDistributionEngine,
  DEFAULT_TIPS_SETTINGS,
  type StaffShiftParticipation,
  type ClockEntry,
} from '@/modules/human';

/**
 * 💰 AutoTipDistributionHandler
 * Suture Nœud 5 (Réseau Bayésien Clôture -> Tronc Pourboires CB) :
 * À la clôture du Ticket Z (finance.ticket_z_closed), calcule automatiquement la répartition
 * équitable des pourboires CB entre les membres du personnel ayant pointé sur la journée.
 */
function buildStaffParticipations(entries: ClockEntry[]): StaffShiftParticipation[] {
  const openMap: Record<string, number> = {};
  const hoursMap: Record<string, { hours: number; name: string; role: string }> = {};

  for (const entry of entries) {
    const empId = entry.employeeId;
    const timeMs = new Date(entry.timestamp).getTime();
    const meta = (entry.metadata as Record<string, unknown>) || {};
    const userName = (meta.userName as string) || empId;
    const userRole = (meta.role as string) || 'serveur';

    if (entry.type === 'clock_in') {
      openMap[empId] = timeMs;
    } else if (entry.type === 'clock_out' && openMap[empId]) {
      const worked = (timeMs - openMap[empId]) / 3600000;
      const current = hoursMap[empId] || { hours: 0, name: userName, role: userRole };
      hoursMap[empId] = { ...current, hours: current.hours + worked };
      delete openMap[empId];
    }
  }

  return Object.entries(hoursMap).map(([staffId, data]) => ({
    staffId,
    staffName: data.name,
    role: data.role,
    hoursWorked: Number(data.hours.toFixed(2)),
  }));
}

export function registerAutoTipDistributionHandler(): () => void {
  return NexusEventBus.on(
    'finance.ticket_z_closed',
    async (payload) => {
      const { tenantId, date, isSimulation } = payload;
      if (isSimulation) return;

      try {
        // 1. Récupérer les pourboires totaux enregistrés pour cette date
        const tipsRecord = await Nexus.adapter.get<{ totalTipsInMicrounits?: number }>(
          `tenants/${tenantId}/analytics/tips_${date}`
        );
        const totalTipsInMicrounits = tipsRecord?.totalTipsInMicrounits ?? 0;

        if (totalTipsInMicrounits <= 0) {
          logger.info(`[AutoTipDistribution] Aucun pourboire CB enregistré pour le Z du ${date}`);
          return;
        }

        // 2. Récupérer les pointages de la journée pour identifier les participants
        const rawPunches = await Nexus.adapter.get<Record<string, ClockEntry>>(
          `tenants/${tenantId}/timeclock/${date}`
        );
        const entries = rawPunches ? Object.values(rawPunches) : [];
        const participants = buildStaffParticipations(entries);

        if (participants.length === 0) {
          logger.info(`[AutoTipDistribution] Aucun personnel éligible trouvé pour la répartition des pourboires`);
          return;
        }

        // 3. Calcul de la répartition par le moteur canonique
        const shiftId = `shift_${date}`;
        const result = TipsDistributionEngine.calculateDistribution(
          shiftId,
          totalTipsInMicrounits,
          participants,
          DEFAULT_TIPS_SETTINGS
        );

        // 4. Persistance du draft de répartition dans l'espace tenant
        const distributionId = `dist_${date}_${Date.now()}`;
        await Nexus.adapter.set(`tenants/${tenantId}/tip_distributions/${distributionId}`, {
          id: distributionId,
          date,
          shiftId,
          totalTipsInMicrounits: result.totalTipsInMicrounits,
          totalTipsEur: result.totalTipsEur,
          method: result.method,
          shares: result.shares,
          status: 'draft_ready_for_review',
          createdAt: new Date().toISOString(),
        });

        logger.info(
          `[AutoTipDistribution] ${result.totalTipsEur}€ répartis entre ${result.shares.length} salariés pour le Z du ${date}`
        );

        // 5. Notification de synthèse au manager
        await NexusEventBus.emitDurable('notification.urgent', {
          v: 1,
          tenantId,
          message: `Pourboires CB (${result.totalTipsEur.toFixed(2)} €) : Répartition automatique calculée pour ${result.shares.length} salariés.`,
          roles: ['manager', 'directeur', 'admin'],
          priority: 'HIGH',
          metadata: { date, distributionId, totalTipsEur: result.totalTipsEur, count: result.shares.length },
        });

        empireAudit.log({
          module: 'human',
          action: 'AUTO_TIPS_DISTRIBUTED_Z',
          details: { date, distributionId, totalTipsEur: result.totalTipsEur, participantsCount: result.shares.length },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error('[AutoTipDistribution] Erreur lors du calcul automatique des pourboires', error);
      }
    },
    { id: 'auto-tip-distribution-handler', priority: 'HIGH' }
  );
}
