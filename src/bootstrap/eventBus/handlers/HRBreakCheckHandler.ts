/**
 * HRBreakCheckHandler — HR 6.3 : vérification pause légale HCR
 *
 * Art. L3121-16 Code du travail + Convention HCR :
 * Tout travail effectif continu ≥ 6 heures doit comporter une pause de 20 min minimum.
 * En HCR, la pratique est 30 min pour tout service ≥ 6h.
 *
 * Ce handler écoute `hr.break_checked` (émis par le moteur de pointage)
 * et crée une alerte RH si la pause est manquante ou insuffisante.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

/** Seuil légal HCR : pause requise dès 6h travaillées */
const BREAK_THRESHOLD_HOURS = 6;
/** Durée minimale pause HCR : 30 min */
const MIN_BREAK_MINUTES = 30;

export function registerHRBreakCheckHandler(): () => void {
  return NexusEventBus.on(
    'hr.break_checked',
    async (payload) => {
      const { tenantId, employeeId, shiftId, shiftDurationHours, breakMinutes, required, compliant } = payload;

      try {
        if (!required || shiftDurationHours < BREAK_THRESHOLD_HOURS) {
          // Pas de pause requise pour ce shift — rien à faire
          return;
        }

        if (compliant && breakMinutes >= MIN_BREAK_MINUTES) {
          // Conforme — log uniquement
          logger.info(
            `[HRBreakCheck] Shift ${shiftId} — pause ${breakMinutes}min ✓ (${shiftDurationHours}h travaillées)`
          );
          return;
        }

        // Non-conformité pause
        const alertId = `break-${shiftId}`;
        await Nexus.adapter.set(
          `tenants/${tenantId}/hrAlerts/${alertId}`,
          {
            id: alertId,
            type: 'missing_break',
            employeeId,
            shiftId,
            shiftDurationHours,
            breakMinutes,
            requiredBreakMinutes: MIN_BREAK_MINUTES,
            legalReference: 'Art. L3121-16 Code du travail + Convention HCR',
            status: 'open',
            severity: 'high',
            createdAt: new Date().toISOString(),
          }
        );

        await NexusEventBus.emit('notification.urgent', {
          v: 1,
          tenantId,
          message: `⚠️ Pause légale manquante — Employé ${employeeId} (shift ${shiftId}) : ${breakMinutes}min / ${MIN_BREAK_MINUTES}min requises après ${shiftDurationHours}h de travail`,
          roles: ['manager', 'directeur', 'admin'],
          priority: 'HIGH',
        });

        logger.warn(
          `[HRBreakCheck] NON-CONFORME — shift ${shiftId}: pause ${breakMinutes}min (${shiftDurationHours}h travaillées, min requis: ${MIN_BREAK_MINUTES}min)`
        );

        empireAudit.log({
          module: 'compliance',
          action: 'HR_BREAK_NON_COMPLIANT',
          details: { employeeId, shiftId, shiftDurationHours, breakMinutes, requiredMinutes: MIN_BREAK_MINUTES },
          severity: 'high',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[HRBreakCheck] Erreur vérification pause', err);
        throw err;
      }
    },
    { id: 'hr-break-check', priority: 'HIGH' }
  );
}
