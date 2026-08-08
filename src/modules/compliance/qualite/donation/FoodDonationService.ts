import { Nexus } from '@/lib/nexus/NexusAdapter';
import { FoodDonationSchema, type FoodDonation } from '@/modules/compliance/domain/schemas/foodDonation';
import { empireAudit } from '@/lib/audit';
import { toMicrounits } from '@/domain/schemas/primitives';

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
