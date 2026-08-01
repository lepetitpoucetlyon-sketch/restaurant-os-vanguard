import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/infrastructure/services/audit';
import { logger } from '@/lib/logger';

export function registerFoodDonationHandler() {
    return NexusEventBus.on(
        'service.end',
        async (payload) => {
            const { tenantId } = payload;
            
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const stockItems = await Nexus.adapter.query<any>(`tenants/${tenantId}/stockItems`);
            
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
        },
        { id: 'food-donation-handler', priority: 'BACKGROUND' }
    );
}
