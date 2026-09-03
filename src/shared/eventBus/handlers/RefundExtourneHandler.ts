import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FinancialNexusBridge } from '@/modules/finance';
import type { JournalEntry } from '@nexus/contracts';

import { IdempotencyGuard } from '../IdempotencyGuard';

export function registerRefundExtourneHandler() {
  return NexusEventBus.on(
    'order.refunded',
    async (payload) => {
      const { orderId, tenantId, operatorId } = payload;
      const reason = 'Remboursement';
      
      // 1. Lire le JournalEntry original de la commande
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
