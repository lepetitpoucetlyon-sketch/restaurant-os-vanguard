/**
 * CoolingCycleHandler — HACCP 5.2 : cycle de refroidissement légal
 *
 * Enregistre les cycles de refroidissement (réglementation CE 852/2004) :
 * un aliment chaud (>63°C) doit descendre sous 10°C en moins de 2h.
 * Si non conforme → audit critique + notification hygiéniste.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/** Seuil légal CE 852/2004 : refroidissement en moins de 120 minutes */
const MAX_COOLING_DURATION_MINUTES = 120;

export function registerCoolingCycleHandler(): () => void {
  return NexusEventBus.on(
    'haccp.cooling_cycle_logged',
    async (payload) => {
      const {
        tenantId, batchId, productId, productName,
        startTempCelsius, endTempCelsius, durationMinutes,
        operatorId, compliant, loggedAt,
      } = payload;

      try {
        // Déterminer la conformité réelle (double vérification métier)
        const isLegallyCompliant =
          compliant &&
          durationMinutes <= MAX_COOLING_DURATION_MINUTES &&
          endTempCelsius <= 10;

        // Persister l'enregistrement légal HACCP (immuable — jamais delete)
        const recordPath = `tenants/${tenantId}/haccpCoolingCycles/${batchId}`;
        await Nexus.adapter.set(recordPath, {
          batchId,
          productId,
          productName,
          startTempCelsius,
          endTempCelsius,
          durationMinutes,
          operatorId,
          compliant: isLegallyCompliant,
          loggedAt,
          legalReference: 'CE 852/2004 — art. 4',
          maxAllowedMinutes: MAX_COOLING_DURATION_MINUTES,
          recordedAt: Date.now(),
        });

        if (!isLegallyCompliant) {
          // Non-conformité — alerte HACCP critique
          await NexusEventBus.emit('haccp.nonconform', {
            v: 1,
            tenantId,
            checkId: batchId,
            correctionDeadline: loggedAt + 3600_000, // 1h pour corrective action
          });

          await NexusEventBus.emit('notification.urgent', {
            v: 1,
            tenantId,
            message: `🌡️ NON-CONFORMITÉ Refroidissement — ${productName} (${durationMinutes}min, ${endTempCelsius}°C) — Action corrective requise`,
            roles: ['chef_cuisinier', 'manager', 'directeur'],
            priority: 'CRITICAL',
          });

          logger.error(
            `[CoolingCycle] NON-CONFORME — ${productName} batch ${batchId}: ${durationMinutes}min / ${endTempCelsius}°C`
          );

          empireAudit.log({
            module: 'compliance',
            action: 'HACCP_COOLING_NON_COMPLIANT',
            details: { batchId, productId, productName, startTempCelsius, endTempCelsius, durationMinutes, operatorId },
            severity: 'critical',
            timestamp: new Date(loggedAt),
          });
        } else {
          logger.info(
            `[CoolingCycle] Conforme — ${productName} batch ${batchId}: ${durationMinutes}min / ${endTempCelsius}°C ✓`
          );

          empireAudit.log({
            module: 'compliance',
            action: 'HACCP_COOLING_COMPLIANT',
            details: { batchId, productId, productName, durationMinutes, endTempCelsius },
            severity: 'low',
            timestamp: new Date(loggedAt),
          });
        }
      } catch (err) {
        logger.error('[CoolingCycle] Erreur enregistrement cycle', err);
        throw err;
      }
    },
    { id: 'cooling-cycle-haccp', priority: 'HIGH' }
  );
}
