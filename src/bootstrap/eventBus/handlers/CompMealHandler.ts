import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

import { onValidated } from '@/shared/eventBus/onValidated';
import { z } from 'zod';

const PayloadSchema = z.object({
  orderId: z.string(),
  tenantId: z.string(),
  totalValueInMicrounits: z.number(),
  operatorId: z.string(),
  reason: z.string().optional()
});

export function registerCompMealHandler() {
    return NexusEventBus.on(
        'order.comp',
        onValidated(PayloadSchema, async (payload) => {
            const { orderId, tenantId, totalValueInMicrounits, operatorId, reason } = payload;
            
            // Enregistrer le repas offert dans les entrées du journal
            const entryId = `comp_${orderId}_${Date.now()}`;
            await Nexus.adapter.set(`tenants/${tenantId}/journalEntries/${entryId}`, {
                id: entryId,
                orderId,
                category: 'offerts',
                amountInMicrounits: 0, // 0 pour un repas offert, mais tracé
                marketValueInMicrounits: totalValueInMicrounits,
                operatorId,
                reason: reason || 'Non spécifié',
                recordedAt: new Date().toISOString()
            });

            empireAudit.log({
                module: 'finance',
                action: 'COMP_MEAL_RECORDED',
                details: { orderId, operatorId, marketValue: totalValueInMicrounits },
                severity: 'low',
                timestamp: new Date()
            });
        }),
        { id: 'comp-meal-handler', priority: 'BACKGROUND' }
    );
}
