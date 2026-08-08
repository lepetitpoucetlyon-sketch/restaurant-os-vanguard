import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

interface RecallImpact {
    lotId: string;
    preparations: Array<{
        recipeId: string;
        recipeName: string;
    }>;
    orderLines: Array<{
        orderId: string;
        productName: string;
        quantity: number;
        tableId?: string;
        timestamp: string;
    }>;
    affectedSubjectIds: string[];
    totalCovers: number;
}

interface RecipeDoc {
    id: string;
    name: string;
    ingredients?: Array<{ ingredientId: string; lotId?: string }>;
}

interface OrderDoc {
    id: string;
    tableId?: string;
    timestamp?: string;
    customerId?: string;
    items?: Array<{
        productId: string;
        name?: string;
        quantity?: number;
    }>;
}

export const RecallService = {
    async traceFromLot(tenantId: string, lotId: string): Promise<RecallImpact> {
        const recipes = await Nexus.adapter.query<RecipeDoc>(
            `tenants/${tenantId}/recipes`
        );

        const affectedRecipes = recipes.filter(r =>
            r.ingredients?.some(ing => ing.lotId === lotId)
        );

        const recipeProductIds = new Set(affectedRecipes.map(r => r.id));

        const orders = await Nexus.adapter.query<OrderDoc>(
            `tenants/${tenantId}/orders`
        );

        const orderLines: RecallImpact['orderLines'] = [];
        const subjectIds = new Set<string>();

        for (const order of orders) {
            if (!order.items) continue;
            for (const item of order.items) {
                if (recipeProductIds.has(item.productId)) {
                    orderLines.push({
                        orderId: order.id,
                        productName: item.name ?? item.productId,
                        quantity: item.quantity ?? 1,
                        tableId: order.tableId,
                        timestamp: order.timestamp ?? '',
                    });
                    if (order.customerId) {
                        subjectIds.add(order.customerId);
                    }
                }
            }
        }

        return {
            lotId,
            preparations: affectedRecipes.map(r => ({
                recipeId: r.id,
                recipeName: r.name,
            })),
            orderLines,
            affectedSubjectIds: Array.from(subjectIds),
            totalCovers: orderLines.reduce((sum, l) => sum + l.quantity, 0),
        };
    },

    async initiateRecall(
        tenantId: string,
        lotId: string,
        operatorId: string,
        reason: string
    ): Promise<RecallImpact> {
        const impact = await this.traceFromLot(tenantId, lotId);

        const recallRecord = {
            id: Nexus.adapter.generateId(`tenants/${tenantId}/recalls`),
            tenantId,
            lotId,
            reason,
            operatorId,
            initiatedAt: new Date().toISOString(),
            impact: {
                recipeCount: impact.preparations.length,
                orderCount: impact.orderLines.length,
                coverCount: impact.totalCovers,
                subjectCount: impact.affectedSubjectIds.length,
            },
            status: 'active' as const,
        };

        await Nexus.adapter.set(
            `tenants/${tenantId}/recalls/${recallRecord.id}`,
            recallRecord
        );

        empireAudit.log({
            module: 'inventory',
            action: 'food_recall_initiated',
            userId: operatorId,
            severity: 'critical',
            timestamp: new Date(),
            details: {
                recallId: recallRecord.id,
                lotId,
                reason,
                affectedOrders: impact.orderLines.length,
                affectedCovers: impact.totalCovers,
            },
        });

        const { NexusEventBus } = await import('@/shared/eventBus/NexusEventBus');
        await NexusEventBus.emitDurable('recall.declared', {
            v: 1,
            tenantId,
            recallId: recallRecord.id,
            productIds: Array.from(new Set(impact.preparations.map(p => p.recipeId))),
            reason
        });

        return impact;
    },
};
