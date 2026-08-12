import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FoodDonationSchema, type FoodDonation } from '../../domain/schemas/foodDonation';
import { empireAudit } from '@/lib/audit';
import { toMicrounits } from '@/shared/schemas/primitives';

/**
 * 🍽️ §8.6 Vague 1 — **Service culinaire fondationnel** (loi Garot / dons alimentaires).
 * Ne monte que pour les verticales `usesCulinaryStock(variant)` — la surface UI
 * est gatée par `capabilities.mod_haccp` dans le DNA (`salon/garage/retail non-food
 * /clinic = false`). Ce fichier ne re-vérifie pas le variant : ses appelants sont
 * déjà filtrés en amont. Aucun call site non-culinaire connu.
 */
export const FoodDonationService = {
    async record(
        tenantId: string,
        donation: Omit<FoodDonation, 'id' | 'totalValueInMicrounits'>
    ): Promise<FoodDonation> {
        const id = Nexus.adapter.generateId(`tenants/${tenantId}/foodDonations`);

        const totalValueInMicrounits = toMicrounits(
            donation.items.reduce((sum, item) => sum + item.estimatedValueInMicrounits * item.quantity, 0)
        );

        const entry: FoodDonation = {
            ...donation,
            id,
            totalValueInMicrounits,
        };

        FoodDonationSchema.parse(entry);

        await Nexus.adapter.set(
            `tenants/${tenantId}/foodDonations/${id}`,
            entry
        );

        empireAudit.log({
            module: 'inventory',
            action: 'food_donation_recorded',
            userId: donation.operatorId,
            timestamp: new Date(),
            details: {
                donationId: id,
                tenantId,
                recipient: donation.recipientOrg,
                itemCount: donation.items.length,
                totalValueInMicrounits,
            },
        });

        return entry;
    },

    async listByDate(
        tenantId: string,
        startDate: string,
        endDate: string
    ): Promise<FoodDonation[]> {
        const all = await Nexus.adapter.query<FoodDonation>(
            `tenants/${tenantId}/foodDonations`,
            {
                where: [
                    { field: 'date', operator: '>=', value: startDate },
                    { field: 'date', operator: '<=', value: endDate },
                ],
                orderBy: { field: 'date', direction: 'desc' },
            }
        );
        return all;
    },
};
