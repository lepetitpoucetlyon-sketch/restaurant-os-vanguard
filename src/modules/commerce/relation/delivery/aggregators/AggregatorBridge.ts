import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';
import { toMicrounits } from '@/domain/schemas/primitives';
import type { AggregatorOrder, AggregatorPlatform, AggregatorConfig } from './types';

export const AggregatorBridge = {
    async ingestOrder(
        tenantId: string,
        platform: AggregatorPlatform,
        externalOrder: {
            externalOrderId: string;
            items: Array<{ name: string; quantity: number; priceInMicrounits: number; externalProductId: string }>;
            totalInMicrounits: number;
            customerName?: string;
            deliveryAddress?: string;
        }
    ): Promise<AggregatorOrder> {
        const configs = await Nexus.adapter.query<AggregatorConfig>(
            `tenants/${tenantId}/aggregatorConfigs`,
            { where: [{ field: 'platform', operator: '==', value: platform }] }
        );
        const config = configs[0];
        const commissionPct = config?.commissionPercent ?? 30;
        const commissionInMicrounits = toMicrounits(
            Math.round(externalOrder.totalInMicrounits * (commissionPct / 100))
        );
        const netInMicrounits = toMicrounits(externalOrder.totalInMicrounits - commissionInMicrounits);

        const id = Nexus.adapter.generateId(`tenants/${tenantId}/aggregatorOrders`);
        const order: AggregatorOrder = {
            id,
            tenantId,
            platform,
            externalOrderId: externalOrder.externalOrderId,
            items: externalOrder.items.map(item => ({
                ...item,
                priceInMicrounits: toMicrounits(item.priceInMicrounits),
            })),
            totalInMicrounits: toMicrounits(externalOrder.totalInMicrounits),
            commissionInMicrounits,
            netInMicrounits,
            status: 'pending',
            customerName: externalOrder.customerName,
            deliveryAddress: externalOrder.deliveryAddress,
            receivedAt: new Date().toISOString(),
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/aggregatorOrders/${id}`,
            order
        );

        empireAudit.log({
            module: 'ops',
            action: 'aggregator_order_received',
            timestamp: new Date(),
            details: {
                platform,
                externalOrderId: externalOrder.externalOrderId,
                totalEur: externalOrder.totalInMicrounits / 1_000_000,
                commissionPct,
            },
        });

        return order;
    },

    async updateStatus(
        tenantId: string,
        orderId: string,
        status: AggregatorOrder['status']
    ): Promise<void> {
        const updates: Record<string, unknown> = { status };
        if (status === 'accepted') updates.acceptedAt = new Date().toISOString();

        await Nexus.adapter.update(
            `tenants/${tenantId}/aggregatorOrders/${orderId}`,
            updates
        );
    },

    async reconcilePayouts(
        tenantId: string,
        platform: AggregatorPlatform,
        startDate: string,
        endDate: string
    ): Promise<{ orderCount: number; totalGross: number; totalCommission: number; totalNet: number }> {
        const orders = await Nexus.adapter.query<AggregatorOrder>(
            `tenants/${tenantId}/aggregatorOrders`,
            {
                where: [
                    { field: 'platform', operator: '==', value: platform },
                    { field: 'status', operator: '==', value: 'delivered' },
                    { field: 'receivedAt', operator: '>=', value: startDate },
                    { field: 'receivedAt', operator: '<=', value: endDate },
                ],
            }
        );

        const MU = 1_000_000;
        return {
            orderCount: orders.length,
            totalGross: Math.round(orders.reduce((s, o) => s + o.totalInMicrounits, 0) / MU * 100) / 100,
            totalCommission: Math.round(orders.reduce((s, o) => s + o.commissionInMicrounits, 0) / MU * 100) / 100,
            totalNet: Math.round(orders.reduce((s, o) => s + o.netInMicrounits, 0) / MU * 100) / 100,
        };
    },
};
