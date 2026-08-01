import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import type { AuditSeverity } from '@/infrastructure/services/audit';

/**
 * BigGroupAlertHandler (P05-K)
 * Écoute 'biggroup.confirmed' (ajouté dans NexusEventBus.ts).
 * Alerte le manager via WebPush et persiste une notification si covers ≥ bigGroupThreshold (défaut 12).
 * Si covers ≥ 20 : severity 'high' et tag 'vip_event'.
 */
export function registerBigGroupAlertHandler(): () => void {
  return NexusEventBus.on(
    'biggroup.confirmed',
    async (payload) => {
      const { tenantId, reservationId, covers, date, customerId } = payload;

      const settings = await Nexus.adapter.get<{ bigGroupThreshold?: number }>(
        `tenants/${tenantId}/settings/general`,
      );
      const bigGroupThreshold = settings?.bigGroupThreshold ?? 12;

      if (covers < bigGroupThreshold) {
        logger.info(
          `[BigGroupAlert] ${covers} couverts < seuil ${bigGroupThreshold} — pas d'alerte pour ${reservationId}`,
        );
        return;
      }

      const severity: AuditSeverity = covers >= 20 ? 'high' : 'medium';
      const tags: string[] = covers >= 20 ? ['vip_event'] : [];

      await browserPush.sendToRole(tenantId, 'manager', {
        title: `Grand groupe : ${covers} couverts`,
        body: `Réservation ${reservationId} le ${date}`,
      });

      await Nexus.adapter.set(
        `tenants/${tenantId}/notifications/NOTIF-BIG-${reservationId}`,
        {
          id: `NOTIF-BIG-${reservationId}`,
          reservationId,
          covers,
          date,
          customerId: customerId ?? null,
          severity,
          tags,
          bigGroupThreshold,
          createdAt: new Date().toISOString(),
        },
      );

      logger.info(
        `[BigGroupAlert] Alerte envoyée pour réservation ${reservationId} (${covers} couverts, severity=${severity})`,
      );

      empireAudit.log({
        module: 'ops',
        action: 'BIG_GROUP_ALERT_SENT',
        details: { reservationId, covers, severity, bigGroupThreshold, tags },
        severity,
        timestamp: new Date(),
      });
    },
    { id: 'biggroup-alert', priority: 'HIGH' },
  );
}
