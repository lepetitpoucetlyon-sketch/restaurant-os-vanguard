import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

const REASON_LABELS: Record<string, string> = {
  water: "Carafe d'eau",
  bread: "Corbeille de pain",
  bill: "Demande d'addition",
  assistance: "Appel serveur",
  custom: "Demande spécifique",
};

/**
 * 🛎️ WaiterCallHandler
 * Suture Nœud 1 (Réseau Bayésien Salle -> Service) :
 * Intercepte les appels émis depuis le smartphone des convives (WaiterCallDrawer)
 * et alerte immédiatement les serveurs et chefs de rang par notification prioritaire.
 */
export function registerWaiterCallHandler(): () => void {
  return NexusEventBus.on(
    'ops.waiter_call_requested',
    async (payload) => {
      const { tenantId, tableId, tableName, reason, note, requestedAt } = payload;
      const label = REASON_LABELS[reason] || reason;
      const detail = note ? `${label} (${note})` : label;
      const message = `${tableName} : ${detail}`;

      logger.info(`[WaiterCallHandler] ${message} pour tenant ${tenantId}`);

      // Émission d'une alerte urgente pour tous les membres de la salle
      await NexusEventBus.emitDurable('notification.urgent', {
        v: 1,
        tenantId,
        message,
        roles: ['serveur', 'chef_rang', 'manager', 'barman'],
        priority: 'HIGH',
        metadata: { tableId, reason, note, requestedAt },
      });

      empireAudit.log({
        module: 'ops',
        action: 'WAITER_CALL_DISPATCHED',
        details: { tableId, tableName, reason, note },
        severity: 'low',
        timestamp: new Date(requestedAt || Date.now()),
      });
    },
    { id: 'waiter-call-handler', priority: 'HIGH' }
  );
}
