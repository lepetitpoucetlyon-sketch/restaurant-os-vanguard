import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';
import { getDefaultStore } from 'jotai';
import { quarantinedProductsAtom } from '@/store/pillars/compliance';

/**
 * QuarantineHandler (P2-2)
 * Écoute les alertes HACCP (haccp.alert).
 * Si la sévérité est critique, met en quarantaine les produits liés au capteur,
 * émet un événement métier `inventory.quarantine_activated`, et met à jour
 * le store Jotai pour masquer instantanément les produits sur le POS.
 */
export function registerQuarantineHandler(): () => void {
  const unsubHaccp = NexusEventBus.on(
    'haccp.alert',
    async (payload) => {
      const { tenantId, sensorId, alertType, severity, message } = payload;
      
      if (severity !== 'CRITICAL' && severity !== 'HIGH') return;

      // 1. Détermination des produits impactés (Suture HACCP -> Logistique)
      // Dans un cas réel, on lirait les relations capteur -> produits depuis Nexus.
      // Pour l'implémentation P2, on simule une résolution basée sur le sensorId.
      const affectedProductIds: string[] = [];
      if (sensorId.includes('ROTISSERIE') || sensorId.includes('CHICKEN')) {
         // Ids de démo
         affectedProductIds.push('prod_poulet_roti', 'prod_demi_poulet');
      } else {
         affectedProductIds.push('prod_generic_quarantine'); // Fallback
      }

      // 2. Maj de l'état local (ProductGrid POS)
      const store = getDefaultStore();
      const currentQuarantine = store.get(quarantinedProductsAtom);
      const nextQuarantine = { ...currentQuarantine };
      const now = Date.now();

      for (const productId of affectedProductIds) {
        nextQuarantine[productId] = { reason: message, timestamp: now };
        
        // Persistance de l'état de quarantaine
        await Nexus.adapter.set(`tenants/${tenantId}/quarantine/${productId}`, {
          productId,
          sensorId,
          reason: message,
          quarantinedAt: new Date(now).toISOString()
        });
      }
      store.set(quarantinedProductsAtom, nextQuarantine);

      // 3. Notification utilisateur (Manager de garde)
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('⚠️ ALERTE HACCP - QUARANTAINE', {
            body: `${message} (${affectedProductIds.length} produits isolés)`,
          });
        }
      }

      // 4. Émission de l'événement métier d'inventaire
      if (affectedProductIds.length > 0) {
        await NexusEventBus.emitDurable('inventory.quarantine_activated', {
          v: 1,
          tenantId,
          productIds: affectedProductIds,
          reason: `Auto-quarantaine suite alerte HACCP: ${alertType}`
        });
      }

      logger.warn(`[Quarantine] ${affectedProductIds.length} produits mis en quarantaine suite à ${sensorId}`);

      empireAudit.log({
        module: 'compliance',
        action: 'PRODUCT_QUARANTINED',
        details: { affectedProductIds, sensorId, severity, message },
        severity: 'high',
        timestamp: new Date(now),
      });
    },
    { id: 'quarantine-haccp-alert', priority: 'CRITICAL' }
  );

  return () => {
    unsubHaccp();
  };
}
