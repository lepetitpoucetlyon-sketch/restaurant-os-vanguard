import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { logger } from '@/lib/logger';

import { onValidated } from '@/shared/eventBus/onValidated';
import { z } from 'zod';

const PayloadSchema = z.object({
  tenantId: z.string(),
});

export function registerFoodDonationHandler() {
    return NexusEventBus.on(
        'service.end',
        onValidated(PayloadSchema, async (payload) => {
            const { tenantId } = payload;
            const stockItems = await Nexus.adapter.query<{id?: string, itemId?: string, name?: string, quantity: number, category: string}>(`tenants/${tenantId}/stockItems`);
            
            // On filtre les items périssables qui ont de la quantité (pour le don associatif)
            const donatableItems = stockItems.filter(item => item.quantity > 0 && item.category === 'perishable');
            
            if (donatableItems.length > 0) {
                const reportId = `donation_${Date.now()}`;
                
                await Nexus.adapter.set(`tenants/${tenantId}/donationReports/${reportId}`, {
                    id: reportId,
                    date: new Date().toISOString(),
                    items: donatableItems.map(item => ({
                        itemId: item.id || item.itemId,
                        name: item.name || 'Inconnu',
                        quantity: item.quantity
                    })),
                    status: 'pending_collection'
                });

                logger.info(`[FoodDonationHandler] Rapport de don généré pour la fin de service: ${reportId}`);

                empireAudit.log({
                    module: 'inventory',
                    action: 'FOOD_DONATION_REPORTED',
                    details: { reportId, itemCount: donatableItems.length },
                    severity: 'low',
                    timestamp: new Date()
                });
            }
        }),
        { id: 'food-donation-handler', priority: 'BACKGROUND' }
    );
}
