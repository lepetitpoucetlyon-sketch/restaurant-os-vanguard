import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import type { Customer } from '@shared/nexus/contracts/nexus-internal-mapper';
import type { JsonObject } from "@/shared/types/json";
import { getSetting } from '@/lib/settings/SettingsReader';

/** 1 € = 1 000 000 microunits (cf. CLAUDE.md — convention monnaie). */
const EUR_TO_MICROUNITS = 1_000_000;

/**
 * P3-1: CRM VIP Handler
 * Écoute les commandes payées en arrière-plan.
 * Évalue si le client devient VIP (fidélité) et met à jour son profil CRM.
 */
export function registerCRMVipHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async (payload) => {
      const { tenantId, orderId } = payload;
      
      try {
        // 1. Récupérer l'ordre pour voir s'il y a un customerId associé
        const order = await Nexus.adapter.get<Record<string, unknown>>(`tenants/${tenantId}/ops_flows/${orderId}`);
        if (!order || !order.customerId) return;
        
        const customerId = order.customerId as string;

        // 2. Récupérer le profil client
        const customer = await Nexus.adapter.get<Customer>(`tenants/${tenantId}/customers/${customerId}`);
        if (!customer) return;

        // Si déjà VIP, rien à faire (sauf si on gère des tiers, mais restons simple)
        const tags = (customer as JsonObject).tags as string[] | undefined;
        if (tags?.includes('VIP')) return;

        // 3. Logique d'évaluation VIP
        const stats = (customer as JsonObject).stats as { totalVisits?: number; totalSpentInMicrounits?: number; lastVisitAt?: string } | undefined;
        const visits = (stats?.totalVisits ?? 0) + 1;
        const totalSpent = (stats?.totalSpentInMicrounits ?? 0) + (order.totalTTCInMicrounits as number ?? 0);

        // DF-K2 — seuils VIP réglables par le gérant (page `customer` du registre).
        // Le registre expose `vip_threshold_spend` en EUROS ; le code raisonne en
        // microunits, d'où la conversion explicite (1 € = 1 000 000 µ).
        const vipVisitsThreshold = getSetting<number>('customer', 'vip_threshold_visits', 5);
        const vipSpentThresholdEur = getSetting<number>('customer', 'vip_threshold_spend', 500);
        const vipSpentThreshold = vipSpentThresholdEur * EUR_TO_MICROUNITS;

        const becomesVip = visits >= vipVisitsThreshold || totalSpent >= vipSpentThreshold;

        // Met à jour les stats client en passant
        await Nexus.adapter.update(`tenants/${tenantId}/customers/${customerId}`, {
          stats: {
            ...(stats ?? {}),
            totalVisits: visits,
            totalSpentInMicrounits: totalSpent,
            lastVisitAt: new Date().toISOString()
          }
        });

        if (becomesVip) {
          const newTags = [...(customer.tags || []), 'VIP'];
          
          await Nexus.adapter.update(`tenants/${tenantId}/customers/${customerId}`, {
            tags: newTags
          });

          logger.info(`[CRMVipHandler] Le client ${customer.name || customerId} est devenu VIP !`);

          empireAudit.log({
            module: 'crm',
            action: 'CUSTOMER_UPGRADED_VIP',
            details: { customerId, reason: visits >= vipVisitsThreshold ? 'VISITS' : 'SPENT', orderId },
            severity: 'low',
            timestamp: new Date(),
          });

          // Notification optionnelle
          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('🌟 Nouveau VIP détecté !', {
                body: `Le client ${customer.name || 'Inconnu'} vient d'atteindre le statut VIP.`,
              });
            }
          }
        }
      } catch (e) {
        logger.error('[CRMVipHandler] Erreur lors de l\'évaluation VIP', e);
        // Handler BACKGROUND = on ne throw pas pour DLQ par défaut (sauf si configuré)
        // Mais pour la robustesse, on peut laisser passer pour la DLQ.
        throw e;
      }
    },
    { id: 'crm-vip-handler', priority: 'BACKGROUND' }
  );
}
