import { NexusEventBus } from '../NexusEventBus';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

export function registerEndOfServiceActionHandler(): () => void {
  const handleShiftEnded = async (tenantId: string, label: string, endTime: string, details?: Record<string, unknown>) => {
    logger.info(`[EndOfService] Fin de service détectée pour ${label} à ${endTime}`);

    empireAudit.log({
      module: 'ops',
      action: 'SHIFT_ENDED',
      details: { label, endTime, ...details },
      severity: 'low',
      timestamp: new Date(),
    });

    // Suspendre les commandes externes (UberEats, Deliveroo, Web Ordering)
    await NexusEventBus.emit('store.rush_mode_toggled', {
      v: 1,
      tenantId,
      isPaused: true,
      requestedBy: 'system',
    });

    // Envoi alerte résumé de fin de service aux managers et à la direction
    await NexusEventBus.emitDurable('notification.urgent', {
      v: 1,
      tenantId,
      message: `Fin de service (${label}) : Bilan disponible. Commandes externes suspendues pour la nuit.`,
      roles: ['manager', 'directeur', 'admin'],
      priority: 'HIGH',
      metadata: { label, endTime, ...details },
    });
  };

  const unsubShiftEnded = NexusEventBus.on(
    'store.shift_ended',
    async (payload) => {
      const { tenantId, shiftId, endTime } = payload;
      await handleShiftEnded(tenantId, `Shift ${shiftId}`, endTime, { shiftId });
    },
    { id: 'end-of-service-action-handler', priority: 'BACKGROUND' }
  );

  const unsubZClosed = NexusEventBus.on(
    'finance.ticket_z_closed',
    async (payload) => {
      const { tenantId, date, totalInMicrounits, ordersCount, isSimulation } = payload;
      if (isSimulation) return;

      const totalEuros = (totalInMicrounits / 1_000_000).toFixed(2);
      const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      await handleShiftEnded(
        tenantId,
        `Ticket Z (${date})`,
        nowTime,
        { date, totalEuros: `${totalEuros} €`, ordersCount }
      );
    },
    { id: 'end-of-service-z-closed-handler', priority: 'HIGH' }
  );

  return () => {
    unsubShiftEnded();
    unsubZClosed();
  };
}
