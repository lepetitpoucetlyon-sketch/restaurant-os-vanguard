/**
 * ProformaHandler — POS 2.4 : trace audit proforma
 *
 * Quand un proforma est imprimé (`order.proforma_printed`), enregistre
 * une entrée audit NF525 (le proforma n'est PAS une vente, mais doit
 * être tracé pour détecter les "oublis de passage à la caisse").
 * Si le proforma n'est pas converti en vente dans les 2h → alerte manager.
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/** Délai avant alerte proforma non encaissé : 2 heures */
const PROFORMA_ALERT_DELAY_MS = 2 * 3600_000;

export function registerProformaHandler(): () => void {
  return NexusEventBus.on(
    'order.proforma_printed',
    async (payload) => {
      const { tenantId, orderId, tableId, operatorId, totalInMicrounits, printedAt } = payload;

      try {
        // Persister le proforma dans le registre d'audit
        const proformaPath = `tenants/${tenantId}/proformaLog/${orderId}`;
        await Nexus.adapter.set(proformaPath, {
          orderId,
          tableId: tableId ?? null,
          operatorId,
          totalInMicrounits,
          printedAt,
          status: 'pending',           // devient 'converted' à order.paid
          alertScheduledAt: printedAt + PROFORMA_ALERT_DELAY_MS,
        });

        logger.info(
          `[Proforma] Proforma enregistré — commande ${orderId}, table ${tableId}, total ${totalInMicrounits}µ`
        );

        empireAudit.log({
          module: 'finance',
          action: 'PROFORMA_PRINTED',
          details: { orderId, tableId, operatorId, totalInMicrounits },
          severity: 'low',
          timestamp: new Date(printedAt),
        });
      } catch (err) {
        logger.error('[Proforma] Erreur enregistrement proforma', err);
        throw err;
      }
    },
    { id: 'proforma-audit', priority: 'HIGH' }
  );
}
