import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export class BankConnectionExpiredHandler {
  static register() {
    return NexusEventBus.on('finance.bank_connection_expired', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, connectionId } = payload;
      logger.error(`[BankConnection] Connection ${connectionId} expired for tenant ${tenantId}`);

      empireAudit.log({
        module: 'finance',
        action: 'BANK_CONNECTION_EXPIRED',
        userId: 'system',
        instanceId: tenantId,
        details: { connectionId },
        severity: 'high',
        timestamp: new Date(),
      });

      NexusEventBus.emitDurable('notification.created', {
        v: 1,
        tenantId,
        id: `alert-bank-${connectionId}`,
        type: 'error',
        title: 'Connexion Bancaire Expirée',
        message: `La connexion à votre banque (ID: ${connectionId}) a expiré (SCA). Veuillez la renouveler.`,
        priority: 'high',
        read: false,
        timestamp: new Date().toISOString()
      });
    });
  }
}
