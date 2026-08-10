/**
 * HRClockInGuardHandler — I2 : POS → RH
 *
 * Quand un opérateur se connecte à un terminal POS (`pos.terminal_login`),
 * vérifie qu'il est bien pointé (CLOCK_IN actif). Si ce n'est pas le cas,
 * émet une alerte RH et crée un enregistrement de pointage manquant.
 */
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

interface ShiftEntry {
  type: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  userId: string;
  timestamp: string;
}

export function registerHRClockInGuardHandler(): () => void {
  return NexusEventBus.on(
    'pos.terminal_login',
    async (payload) => {
      const { tenantId, operatorId, terminalId, loggedAt } = payload;

      try {
        // Récupérer les dernières entrées de pointage de l'opérateur (24h glissant)
        const since = new Date(loggedAt - 24 * 3600 * 1000).toISOString();
        const entries = await Nexus.adapter.query<ShiftEntry>(
          `tenants/${tenantId}/shiftEntries`,
          {
            where: [
              { field: 'userId', operator: '==', value: operatorId },
              { field: 'timestamp', operator: '>=', value: since },
            ],
            orderBy: { field: 'timestamp', direction: 'desc' },
            limit: 20,
          }
        );

        // Vérifier que le dernier event est un CLOCK_IN (sans CLOCK_OUT après)
        const lastEntry = entries[0];
        const isClockedIn = lastEntry?.type === 'CLOCK_IN';

        if (!isClockedIn) {
          logger.warn(
            `[HRClockInGuard] Opérateur ${operatorId} login POS sans pointage actif sur terminal ${terminalId}`
          );

          // Enregistrer l'alerte RH
          const alertId = crypto.randomUUID();
          await Nexus.adapter.set(
            `tenants/${tenantId}/hrAlerts/${alertId}`,
            {
              id: alertId,
              type: 'missing_clock_in',
              employeeId: operatorId,
              terminalId,
              detectedAt: new Date(loggedAt).toISOString(),
              status: 'open',
              severity: 'medium',
            }
          );

          // Émettre notification urgente aux managers
          await NexusEventBus.emit('notification.urgent', {
            v: 1,
            tenantId,
            message: `Opérateur ${operatorId} connecté au POS sans pointage — terminal ${terminalId}`,
            roles: ['manager', 'directeur', 'admin'],
            priority: 'HIGH',
          });

          empireAudit.log({
            module: 'compliance',
            action: 'POS_LOGIN_WITHOUT_CLOCK_IN',
            details: { operatorId, terminalId, lastEntryType: lastEntry?.type ?? 'none' },
            severity: 'medium',
            timestamp: new Date(loggedAt),
          });
        }
      } catch (err) {
        logger.error('[HRClockInGuard] Erreur vérification pointage', err);
        throw err;
      }
    },
    { id: 'hr-clockin-guard', priority: 'HIGH' }
  );
}
