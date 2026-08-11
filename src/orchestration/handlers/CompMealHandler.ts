import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

export function registerCompMealHandler() {
    return NexusEventBus.on(
        'order.comp',
        async (payload) => {
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
        },
        { id: 'comp-meal-handler', priority: 'BACKGROUND' }
    );
}
