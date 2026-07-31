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
        
        // Notification WebPush VAPID d'alerte critique.
        if (!payload.isSimulation) {
            try {
                const webpush = (await import('web-push')).default;
                const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
                const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:admin@restaurant-os.com';

                if (!vapidPublicKey || !vapidPrivateKey) {
                    logger.warn('[SovereignBreach] VAPID keys non configurées, WebPush ignoré.');
                } else {
                    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
                    
                    const subs = await Nexus.adapter.query<{ endpoint: string; keys: { p256dh: string; auth: string } }>('mcc/pushSubscriptions', {
                        where: [{ field: 'status', operator: '==', value: 'active' }]
                    });

                    const pushPayload = JSON.stringify({
                        topic: 'mcc.security.critical',
                        title: '🚨 SOVEREIGN BREACH DETECTED',
                        body: message,
                        targetTenantId,
                        anchoredTenantId
                    });

                    await Promise.allSettled(
                        subs.map(sub => 
                            webpush.sendNotification(
                                { endpoint: sub.endpoint, keys: sub.keys },
                                pushPayload
                            )
                        )
                    );
                }
            } catch (e) {
                logger.warn('[SovereignBreach] Failed to send WebPush', String(e));
            }
        }

      } catch (e) {
        // En mode Vassal, isMasterMode() est faux → pushGlobalConfig refuse :
        // c'est attendu, la terminaison + logout côté Guard reste effective.
        logger.warn(`[SovereignBreach] kill-switch push skipped/failed: ${String(e)}`);
      }
    },
    { id: 'sovereign-breach-killswitch', priority: 'CRITICAL' }
  );
}
