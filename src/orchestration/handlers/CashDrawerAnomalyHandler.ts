import { NexusEventBus } from '@orchestration/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { z } from 'zod';

const PayloadSchema = z.object({
  tenantId: z.string(),
  drawerId: z.string(),
  operatorId: z.string().optional(),
  detectedAt: z.union([z.string(), z.number(), z.date()]).optional()
});

/**
 * P3-3: Cash Drawer Anomaly Handler (Sovereign Guard)
 * Protège contre l'ouverture suspecte des tiroirs-caisses (ex: hors transaction).
 * Émet une brèche de souveraineté si le tiroir n'appartient pas au tenant,
 * ou déclenche un verrouillage POS de sécurité.
 */
export function registerCashDrawerAnomalyHandler(): () => void {
  return NexusEventBus.onValidated(
    'cash_drawer.opened_unauthorized',
    PayloadSchema,
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
          timestamp: detectedAt ? new Date(detectedAt) : new Date(),
        });

        // 2. Vérification de la propriété du hardware (Sovereign Check)
        const drawer = await Nexus.adapter.get<{ tenantId: string }>(`hardware/drawers/${drawerId}`);
        
        if (drawer && drawer.tenantId !== tenantId) {
          // BRÈCHE DE SOUVERAINETÉ DÉTECTÉE (Tiroir croisé entre tenants)
          logger.error(`[SovereignGuard] BRÈCHE DÉTECTÉE : Le tiroir ${drawerId} appartient à ${drawer.tenantId} mais a été ouvert par ${tenantId}`);
          
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

        // 4. Notification push au manager via route interne (client-safe)
        try {
          const { browserPush } = await import('@/lib/push/browserPush');
          await browserPush.sendToRole(tenantId, 'manager', {
            title: 'ALERTE SÉCURITÉ CAISSE',
            body: `Tiroir ${drawerId} ouvert sans transaction par ${operatorId}. Le POS est verrouillé.`,
          });
        } catch (pushErr) {
          logger.warn('[CashDrawerAnomaly] Push envoi échoué', String(pushErr));
        }

        // 5. Émission anomaly.detected pour Intelligence
        await NexusEventBus.emitDurable('anomaly.detected', {
          v: 1,
          tenantId,
          type: 'unauthorized_drawer_open',
          message: `Tiroir-caisse ${drawerId} ouvert sans transaction par ${operatorId}`,
          metadata: { drawerId, operatorId, detectedAt },
        });
      } catch (e) {
        logger.error('[CashDrawerAnomaly] Erreur critique lors de la gestion de l\'anomalie', e);
        throw e; // Laisse remonter, c'est CRITICAL. Ça ira dans la DLQ.
      }
    },
    { id: 'cash-drawer-anomaly-handler', priority: 'CRITICAL' }
  );
}
