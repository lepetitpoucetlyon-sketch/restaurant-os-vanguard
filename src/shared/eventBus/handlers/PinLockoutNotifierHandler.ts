import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class PinLockoutNotifierHandler {
  static register() {
    return NexusEventBus.on('security.pin_locked', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, terminalId, lockedUntil } = payload;

      logger.warn(`[PinLockout] Terminal ${terminalId} verrouillé jusqu'à ${new Date(lockedUntil).toISOString()}`);

      await Nexus.adapter.update(`tenants/${tenantId}/notifications/pin-lock-${terminalId}-${Date.now()}`, {
        type: 'warning',
        title: 'ALERTE SÉCURITÉ — PIN verrouillé',
        message: `Le terminal ${terminalId} a été verrouillé après 5 tentatives PIN échouées. Déverrouillage automatique à ${new Date(lockedUntil).toLocaleTimeString('fr-FR')}.`,
        priority: 'high',
        read: false,
        createdAt: Date.now(),
      });

      try {
        const { WebPushService } = await import('@/lib/push/webPushService');
        await WebPushService.sendToRole(tenantId, 'manager', {
          title: 'ALERTE PIN — Terminal verrouillé',
          body: `Terminal ${terminalId} bloqué (5 échecs PIN). Déverr. auto dans 30s.`,
        });
      } catch (err) {
        logger.warn('[PinLockoutNotifier] WebPush indisponible', String(err));
      }

      empireAudit.log({
        module: 'security',
        action: 'PIN_TERMINAL_LOCKED',
        details: { terminalId, lockedUntil },
        severity: 'high',
        timestamp: new Date(),
      });
    }, { id: 'pin-lockout-notifier', priority: 'HIGH' });
  }
}
