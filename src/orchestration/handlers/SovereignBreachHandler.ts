import { NexusEventBus } from '../NexusEventBus';
import { MasterBridge } from '@/lib/adapters/MasterBridge';
import { logger } from '@/lib/logger';
import { toError } from "@/lib/toError";

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
    async (payload) => {
      // Simulation flag is ignored for critical security events, or we handle it gracefully
      const { message, targetTenantId, anchoredTenantId, path } = payload;
      logger.error(
        `[SovereignBreach] Drift ${anchoredTenantId} → ${targetTenantId}` +
        `${path ? ` at [${path}]` : ''} — pushing global kill-switch.`
      );
      try {
        if (!payload.isSimulation) {
            await MasterBridge.pushGlobalConfig({
            maintenanceMode: true,
            killSwitch: true,
            forceLogout: true,
            securityLevel: 'critical',
            globalMessage: message,
            allowedFeatures: [],
            });
        }
        
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        await Nexus.adapter.create('mcc/alerts', {
            type: 'NF525_SOVEREIGN_BREACH',
            targetTenantId,
            anchoredTenantId,
            message,
            severity: 'critical',
            createdAt: new Date().toISOString(),
            status: 'open',
            isSimulation: !!payload.isSimulation
        });
        
        logger.error(`[SovereignBreach] Alerte envoyée sur la plateforme MCC et WebPush critique préparé.`);
        
        // Notification WebPush critique via la route interne (client-safe, pas de web-push direct).
        if (!payload.isSimulation) {
            try {
                await fetch('/api/push/internal', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        tenantId: process.env.MCC_SYSTEM_TENANT_ID ?? 'mcc',
                        role: 'mcc_admin',
                        title: 'SOVEREIGN BREACH DETECTED',
                        body: message,
                    }),
                });
            } catch (e) {
                logger.warn('[SovereignBreach] Failed to send push', toError(e).message);
            }
        }

      } catch (e) {
        // En mode Vassal, isMasterMode() est faux → pushGlobalConfig refuse :
        // c'est attendu, la terminaison + logout côté Guard reste effective.
        logger.warn(`[SovereignBreach] kill-switch push skipped/failed: ${toError(e).message}`);
      }
    },
    { id: 'sovereign-breach-killswitch', priority: 'CRITICAL' }
  );
}
