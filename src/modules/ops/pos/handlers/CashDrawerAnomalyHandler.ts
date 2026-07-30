import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/infrastructure/services/audit';

/**
 * P3-3: Cash Drawer Anomaly Handler (Sovereign Guard)
 * Protège contre l'ouverture suspecte des tiroirs-caisses (ex: hors transaction).
 * Émet une brèche de souveraineté si le tiroir n'appartient pas au tenant,
 * ou déclenche un verrouillage POS de sécurité.
 */
export function registerCashDrawerAnomalyHandler(): () => void {
  return NexusEventBus.on(
    'cash_drawer.opened_unauthorized',
    async (payload) => {
      const { drawerId, operatorId, tenantId, detectedAt } = payload;
      
      try {
        logger.warn(`[CashDrawerAnomaly] Ouverture non autorisée détectée ! Tiroir: ${drawerId}, Opérateur: ${operatorId}`);

        // 1. Audit strict
        empireAudit.log({
          module: 'finance',
          action: 'UNAUTHORIZED_DRAWER_OPEN',
          details: { drawerId, operatorId, detectedAt },
          severity: 'critical',
          timestamp: new Date(detectedAt),
        });

        // 2. Vérification de la propriété du hardware (Sovereign Check)
        const drawer = await Nexus.adapter.get<{ tenantId: string }>(`hardware/drawers/${drawerId}`);
        
        if (drawer && drawer.tenantId !== tenantId) {
          // BRÈCHE DE SOUVERAINETÉ DÉTECTÉE (Tiroir croisé entre tenants)
          logger.fatal(`[SovereignGuard] BRÈCHE DÉTECTÉE : Le tiroir ${drawerId} appartient à ${drawer.tenantId} mais a été ouvert par ${tenantId}`);
          
          await NexusEventBus.emitDurable('sovereign.breach', {
            v: 1,
            anchoredTenantId: drawer.tenantId,
            targetTenantId: tenantId,
            message: `Tiroir-caisse ${drawerId} accédé frauduleusement par un autre tenant.`,
            path: `hardware/drawers/${drawerId}`
          });
          return; // La brèche s'occupe du lockdown global
        }

        // 3. Si même tenant, c'est juste un vol ou une erreur de process -> Lockdown local
        await Nexus.adapter.update(`tenants/${tenantId}/settings/pos`, {
          lockdownMode: true,
          lockdownReason: `Ouverture suspecte du tiroir ${drawerId}`
        });

        // 4. Notification WebPush au manager
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('🛑 ALERTE SÉCURITÉ CAISSE', {
              body: `Tiroir ${drawerId} ouvert sans transaction. Le POS est verrouillé.`,
              requireInteraction: true,
            });
          }
        }
      } catch (e) {
        logger.error('[CashDrawerAnomaly] Erreur critique lors de la gestion de l\'anomalie', e);
        throw e; // Laisse remonter, c'est CRITICAL. Ça ira dans la DLQ.
      }
    },
    { id: 'cash-drawer-anomaly-handler', priority: 'CRITICAL' }
  );
}
