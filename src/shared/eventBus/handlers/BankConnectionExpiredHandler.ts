import { NexusEventBus } from '../NexusEventBus';
import { empireAudit } from '@/lib/audit';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

export class BankConnectionExpiredHandler {
  static register() {
    return NexusEventBus.on('finance.bank_connection_expired', async (payload) => {
      if (payload.isSimulation) return;
      const { tenantId, connectionId } = payload;
      logger.error(`[BankConnection] Connection ${connectionId} expired for tenant ${tenantId}`);

      try {
        await Nexus.adapter.update(`tenants/${tenantId}/finance/bank_connections/${connectionId}`, {
            status: 'expired',
            updatedAt: Date.now()
        });

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
      } catch (err) {
        logger.error('[BankConnectionExpiredHandler] Error updating bank connection status', String(err));
      }
    }, { id: 'bank-connection-expired', priority: 'HIGH' });
  }

  /**
   * P10-G: Scan proactif des connexions bancaires expirées.
   * Appelable depuis un cron ou une route admin pour détecter les tokens SCA périmés
   * sans attendre un webhook de la banque.
   */
  static async scanExpiredConnections(tenantId: string): Promise<void> {
    const connections = await Nexus.adapter.query<{
      id: string;
      status: string;
      tokenExpiresAt?: number;
    }>(`tenants/${tenantId}/banking/connections`, {
      where: [{ field: 'status', operator: '==', value: 'active' }]
    });

    const now = Date.now();
    let expiredCount = 0;

    for (const conn of connections) {
      if (conn.tokenExpiresAt && conn.tokenExpiresAt < now) {
        expiredCount++;
        logger.warn(`[BankConnectionExpired] Connexion ${conn.id} expirée (token expiré le ${new Date(conn.tokenExpiresAt).toISOString()})`);

        await NexusEventBus.emitDurable('finance.bank_connection_expired', {
          v: 1,
          tenantId,
          connectionId: conn.id,
        });
      }
    }

    if (expiredCount > 0) {
      logger.info(`[BankConnectionExpired] Scan terminé : ${expiredCount} connexion(s) expirée(s) sur ${connections.length} active(s)`);
    }
  }
}
