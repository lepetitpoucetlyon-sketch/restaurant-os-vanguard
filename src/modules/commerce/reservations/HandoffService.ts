import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

export const HandoffService = {
    async transferOrder(
        tenantId: string,
        orderId: string,
        fromServerId: string,
        toServerId: string,
        reason?: string
    ): Promise<void> {
        await Nexus.adapter.update(
            `tenants/${tenantId}/orders/${orderId}`,
            { ownerServerId: toServerId }
        );

        empireAudit.log({
            module: 'ops',
            action: 'order_handoff',
            userId: fromServerId,
            timestamp: new Date(),
            details: {
                orderId,
                fromServerId,
                toServerId,
                reason,
            } as unknown as import('@/shared/nexus-contract').SovereignData,
        });
    },
};
