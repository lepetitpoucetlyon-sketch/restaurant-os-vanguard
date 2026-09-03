import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { browserPush } from '@/lib/push/browserPush';
import { normalizeRbacRole } from '@/kernel/contracts/rbac';
import { evaluatePush, type QuietHoursConfig } from '@/kernel/alerts/QuietHoursPolicy';
import { resolveResponsibility, type Responsibility, type AlertRoutingEntry } from '@/kernel/alerts/AlertRouter';
import { toError } from "@/lib/toError";

interface TenantNotificationSettings {
  notifications?: QuietHoursConfig;
  notificationsConfig?: QuietHoursConfig;
  notificationRoutings?: AlertRoutingEntry[];
  alerts?: AlertRoutingEntry[];
}

/** Lit les réglages de notification du tenant (best-effort). */
async function readNotificationSettings(tenantId: string): Promise<TenantNotificationSettings | null> {
  try {
    return await Nexus.adapter.get<TenantNotificationSettings>(`tenants/${tenantId}/settings/global`);
  } catch {
    return null; // en cas de doute, on ne bâillonne pas une alerte
  }
}

/**
 * NotificationUrgentDispatchHandler (P0-1.2)
 * Écoute `notification.urgent` (priority: CRITICAL).
 * Dispatche l'alerte WebPush vers tous les rôles cibles spécifiés dans `payload.roles`.
 */
export function registerNotificationUrgentDispatchHandler(): () => void {
  return NexusEventBus.on(
    'notification.urgent',
    async (payload) => {
      const { tenantId, message, roles, metadata, priority, responsibility } = payload;

      // On lit les réglages une seule fois : heures calmes + table de routage.
      const settings = await readNotificationSettings(tenantId);

      // N2-a : gating par sévérité + heures calmes (branche doNotDisturb / dnd*).
      // CRITICAL traverse toujours ; HIGH est différé pendant les heures calmes —
      // l'alerte reste visible dans le centre (notification.created), le push seul
      // est supprimé pour ne pas réveiller inutilement.
      const severity = priority === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
      if (severity !== 'CRITICAL') {
        const quietCfg = settings?.notifications ?? settings?.notificationsConfig ?? null;
        if (evaluatePush('HIGH', quietCfg) === 'SUPPRESS_QUIET_HOURS') {
          logger.info(
            `[NotificationUrgentDispatch] Push différé (heures calmes) pour tenant ${tenantId} — alerte conservée au centre de notifications`
          );
          return;
        }
      }

      // N2-b : routage par responsabilité (AlertRouting enfin lu). Si l'émetteur
      // cible une responsabilité (RESP_HYGIENE…), on résout destinataires nommés +
      // rôles depuis la table du tenant (ou les défauts), en plus des rôles explicites.
      const namedUserIds: string[] = [];
      const responsibilityRoles: string[] = [];
      if (responsibility) {
        const routings = settings?.notificationRoutings ?? settings?.alerts;
        const resolved = resolveResponsibility(responsibility as Responsibility, routings);
        namedUserIds.push(...resolved.userIds);
        responsibilityRoles.push(...resolved.roles);
        if (resolved.routingMissing) {
          logger.warn(
            `[NotificationUrgentDispatch] Aucun destinataire configuré pour ${responsibility} (tenant: ${tenantId}) — repli sur la direction`
          );
        }
      }

      // Correctif N0-3 : normalisation canonique des rôles au point d'étranglement.
      // Corrige d'un seul endroit les 84 ciblages en dur non canoniques du dépôt
      // (ex. 'ADMIN', 'MANAGER', 'kitchen_chef') que sendToRole ne résout pas.
      // Normalisation insensible à la casse : couvre les variantes majuscules
      // ('ADMIN', 'MANAGER', 'CHEF_CUISINIER') et les alias legacy ('kitchen_chef').
      const normalizedRoles = Array.from(
        new Set(
          [...(roles ?? []), ...responsibilityRoles]
            .map((r) => normalizeRbacRole(r) ?? normalizeRbacRole(String(r).toLowerCase()))
            .filter((r): r is NonNullable<typeof r> => r !== null)
            .map((r) => String(r))
        )
      );

      if (normalizedRoles.length === 0 && namedUserIds.length === 0) {
        logger.warn(
          `[NotificationUrgentDispatch] Aucun destinataire résolu pour [${(roles ?? []).join(', ')}]${responsibility ? ` / ${responsibility}` : ''} (tenant: ${tenantId}) — alerte non dispatchée`
        );
        return;
      }

      logger.info(`[NotificationUrgentDispatch] Dispatch alerte push → rôles [${normalizedRoles.join(', ')}]${namedUserIds.length ? ` + ${namedUserIds.length} destinataire(s) nommé(s)` : ''} (tenant: ${tenantId})`);

      // Destinataires nommés (prioritaires) — push ciblé par utilisateur.
      for (const userId of Array.from(new Set(namedUserIds))) {
        try {
          if (typeof window !== 'undefined') {
            await browserPush.sendToUser(tenantId, userId, { title: 'Alerte Urgente', body: message });
          } else {
            await fetch('/api/push/internal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tenantId, userId, title: 'Alerte Urgente', body: message, metadata }),
            }).catch(e => logger.warn(`[NotificationUrgentDispatch] WebPush API fetch failed for user ${userId}`, toError(e).message));
          }
        } catch (err) {
          logger.warn(`[NotificationUrgentDispatch] Échec émission WebPush pour utilisateur ${userId}: ${toError(err).message}`);
        }
      }

      for (const role of normalizedRoles) {
        try {
          if (typeof window !== 'undefined') {
            await browserPush.sendToRole(tenantId, role, {
              title: 'Alerte Urgente',
              body: message,
            });
          } else {
            // Context SSR / API route: fetch interne vers l'API push
            await fetch('/api/push/internal', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                tenantId,
                role,
                title: 'Alerte Urgente',
                body: message,
                metadata,
              }),
            }).catch(e => logger.warn(`[NotificationUrgentDispatch] WebPush API fetch failed for role ${role}`, toError(e).message));
          }
        } catch (err) {
          logger.warn(`[NotificationUrgentDispatch] Échec émission WebPush pour rôle ${role}: ${toError(err).message}`);
        }
      }
    },
    { id: 'notification-urgent-dispatch-handler', priority: 'CRITICAL' }
  );
}
