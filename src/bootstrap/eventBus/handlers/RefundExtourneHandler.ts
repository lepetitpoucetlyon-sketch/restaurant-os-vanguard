import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FinancialNexusBridge } from '@/modules/finance/comptabilite/FinancialNexusBridge';
import type { JournalEntry } from '@nexus/contracts';

export function registerRefundExtourneHandler() {
  return NexusEventBus.on(
    'order.refunded',
    async (payload) => {
      const { orderId, tenantId, operatorId } = payload;
      const reason = 'Remboursement';
      
      // 1. Lire le JournalEntry original de la commande
      // Attention : l'identifiant peut avoir été indexé sous `Z_orderId` ou juste `orderId` selon le bridge
      // Dans processOrder, il utilise SharedKernel.generateId('JE') qui génère par ex `JE_xyz`. 
      // Si l'orderId passé dans l'event est l'ID du JournalEntry, on l'utilise directement.
      const original = await Nexus.adapter.get<JournalEntry>(`tenants/${tenantId}/journalEntries/${orderId}`);
      
      if (!original) {
        throw new Error(`RefundExtourneHandler: Original JournalEntry not found for orderId ${orderId}`);
      }

      // 2 & 3 & 4. Créer l'extourne et sceller via FinancialNexusBridge
      await FinancialNexusBridge.processRefund({
        original,
        operatorId,
        tenantId,
        reason
      });
    },
    { id: 'refund-extourne-handler', priority: 'BACKGROUND' }
  );
}
