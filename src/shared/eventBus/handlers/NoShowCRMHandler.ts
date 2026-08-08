import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/**
 * NoShowCRMHandler (P05-E)
 * Écoute 'reservation.no_show' (l'événement 'resa.noshow' n'existe pas dans NexusEventBus ;
 * 'reservation.no_show' est l'équivalent exact).
 * Dégrade le score CRM du client et taggue les no-showers récurrents.
 */
export function registerNoShowCRMHandler(): () => void {
  return NexusEventBus.on(
    'reservation.no_show',
    async (payload) => {
      const { tenantId, reservationId } = payload;

      const reservation = await Nexus.adapter.get<{
        customerId?: string;
        subjectId?: string;
      }>(`tenants/${tenantId}/reservations/${reservationId}`);

      const customerId = reservation?.customerId ?? reservation?.subjectId;

      if (!customerId) {
        logger.warn(`[NoShowCRM] Aucun customerId pour la réservation ${reservationId} — dégradation CRM ignorée`);
        return;
      }

      const customer = await Nexus.adapter.get<{
        noShowCount?: number;
        crmScore?: number;
        tags?: string[];
      }>(`tenants/${tenantId}/customers/${customerId}`);

      if (!customer) {
        logger.warn(`[NoShowCRM] Client ${customerId} introuvable`);
        return;
      }

      const noShowCount = (customer.noShowCount ?? 0) + 1;
      const crmScore = Math.max(0, (customer.crmScore ?? 100) - 20);
      const tags: string[] = Array.isArray(customer.tags) ? [...customer.tags] : [];

      const isDepositRequired = noShowCount >= 2;

      if (noShowCount >= 2 && !tags.includes('frequent_noshow')) {
        tags.push('frequent_noshow');
        logger.warn(`[NoShowCRM] Client ${customerId} tagué 'frequent_noshow' (${noShowCount} no-shows) — Acompte 100% désormais obligatoire.`);
      }

      await Nexus.adapter.update(`tenants/${tenantId}/customers/${customerId}`, {
        noShowCount,
        crmScore,
        tags,
        depositRequired: isDepositRequired,
        updatedAt: new Date().toISOString(),
      });

      logger.info(
        `[NoShowCRM] CRM dégradé pour client ${customerId} : noShowCount=${noShowCount}, crmScore=${crmScore}`,
      );

      empireAudit.log({
        module: 'crm',
        action: 'NOSHOW_CRM_DEGRADED',
        details: { reservationId, customerId, noShowCount, crmScore, tags },
        severity: 'medium',
        timestamp: new Date(),
      });
    },
    { id: 'noshow-crm', priority: 'BACKGROUND' },
  );
}
