import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

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
        const { browserPush } = await import('@/lib/push/browserPush');
        await browserPush.sendToRole(tenantId, 'manager', {
          title: 'ALERTE PIN — Terminal verrouillé',
          body: `Terminal ${terminalId} bloqué (5 échecs PIN). Déverr. auto dans 30s.`,
        });
      } catch (err) {
        logger.warn('[PinLockoutNotifier] Push indisponible', toError(err).message);
        throw err;
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
