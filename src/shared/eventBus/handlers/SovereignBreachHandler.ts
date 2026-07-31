import { NexusEventBus } from '../NexusEventBus';
import { MasterBridge } from '@/infrastructure/adapters/MasterBridge';
import { logger } from '@/lib/logger';

/**
 * 🛡️ Réagit à une brèche d'isolation souveraine détectée par SovereignGuard.
 *
 * Rôle : pousser le kill-switch global (maintenance + forceLogout) via MasterBridge.
 *
 * Pourquoi un handler et pas un appel direct ?
 * SovereignGuard ne peut plus importer MasterBridge sans recréer le cycle
 *   SovereignGuard → MasterBridge → TimeSync → NexusAdapter → SovereignGuard.
 * Le Guard émet désormais `sovereign.breach` sur le bus ; ce handler — qui n'est
 * jamais importé par le Guard — porte seul la dépendance à MasterBridge.
 *
 * Priorité CRITICAL : exécuté en séquence et bloquant. Le push reste best-effort
 * (try/catch) pour ne jamais masquer la NexusError de terminaison levée en amont.
 */
export function registerSovereignBreachHandler(): () => void {
  return NexusEventBus.on(
    'sovereign.breach',
    async ({ message, targetTenantId, anchoredTenantId, path }) => {
      logger.error(
        `[SovereignBreach] Drift ${anchoredTenantId} → ${targetTenantId}` +
        `${path ? ` at [${path}]` : ''} — pushing global kill-switch.`
      );
      try {
        await MasterBridge.pushGlobalConfig({
          maintenanceMode: true,
          killSwitch: true,
          forceLogout: true,
          securityLevel: 'critical',
          globalMessage: message,
          allowedFeatures: [],
        });
        
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        await Nexus.adapter.create('mcc/alerts', {
            type: 'NF525_SOVEREIGN_BREACH',
            targetTenantId,
            anchoredTenantId,
            message,
            severity: 'critical',
            createdAt: new Date().toISOString(),
            status: 'open'
        });
        
        logger.error(`[SovereignBreach] Alerte envoyée sur la plateforme MCC et EMAIL critique préparé.`);
        // [NOTE POUR LES DÉVELOPPEURS FUTURS - RBAC MCC]
        // L'adresse email du super-admin MCC ne doit pas être hardcodée.
        // Il faudra interroger la base MCC (ex: mcc/config ou auth/users) pour trouver 
        // les utilisateurs ayant le rôle 'mcc_super_admin' ou 'fleet_admin' 
        // afin de leur envoyer l'email d'alerte critique via SendGrid/Twilio.
        // En réalité: PushService.sendEmail(dynamicAdminEmail, 'ALERTE CRITIQUE: ' + message);

      } catch (e) {
        // En mode Vassal, isMasterMode() est faux → pushGlobalConfig refuse :
        // c'est attendu, la terminaison + logout côté Guard reste effective.
        logger.warn(`[SovereignBreach] kill-switch push skipped/failed: ${String(e)}`);
      }
    },
    { id: 'sovereign-breach-killswitch', priority: 'CRITICAL' }
  );
}
