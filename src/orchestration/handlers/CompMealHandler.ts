import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { assertHandlerTenant } from '../guards/assertHandlerTenant';

export function registerCompMealHandler() {
    return NexusEventBus.on(
        'order.comp',
        async (payload) => {
            const { orderId, tenantId, totalValueInMicrounits, operatorId, reason } = payload;

            const entryId = `comp_${orderId}_${Date.now()}`;
            const path = `tenants/${tenantId}/journalEntries/${entryId}`;
            assertHandlerTenant('comp-meal', tenantId, path);
            await Nexus.adapter.set(path, {
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
