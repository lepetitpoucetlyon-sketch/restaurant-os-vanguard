import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';

/**
 * Met à jour l'agrégat Ticket Z en temps réel à chaque paiement.
 * BACKGROUND : non-bloquant, le serveur n'attend pas.
 */
export function registerTicketZHandler(): () => void {
  return NexusEventBus.on(
    'order.paid',
    async ({ tenantId, totalInMicrounits, items, orderId: _orderId }) => {
      const today = new Date().toISOString().split('T')[0];
      const path = `tenants/${tenantId}/ticketZ/${today}`;

      const existing = await Nexus.adapter.get<{ id: string; date: string; tenantId: string; ordersCount: number; totalInMicrounits: number; taxBreakdown: Record<string, number>; updatedAt: string }>(path) ?? {
        id: today,
        date: today,
        tenantId,
        ordersCount: 0,
        totalInMicrounits: 0,
        taxBreakdown: {},
        updatedAt: new Date().toISOString(),
      };

      // Ventilation TVA incrémentale
      for (const item of items) {
        const rate = item.taxRate ?? '0.10';
        const lineTotal = item.unitPriceInMicrounits * item.quantity - (item.discountInMicrounits ?? 0);
        const tva = Math.round(lineTotal * parseFloat(rate));
        existing.taxBreakdown[rate] = (existing.taxBreakdown[rate] ?? 0) + tva;
      }

      existing.ordersCount += 1;
      existing.totalInMicrounits += totalInMicrounits;
      existing.updatedAt = new Date().toISOString();

      await Nexus.adapter.set(path, existing, { merge: true });

      logger.info(
        `[TicketZ] Jour ${today} — total ${(existing.totalInMicrounits / 1_000_000).toFixed(2)}€ (${existing.ordersCount} tickets)`
      );
    },
    { id: 'ticketz-update', priority: 'BACKGROUND' }
  );
}
