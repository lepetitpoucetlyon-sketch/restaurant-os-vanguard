import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { HermesKnowledgeManager } from '../knowledge/rag/HermesKnowledgeManager';
import type { IAutonomousAgent, AgentAction, AgentContext } from './types';

export class AtlasLogisticsAgent implements IAutonomousAgent {
    readonly name = 'Atlas Logistics Sentinel';
    readonly domain: 'STOCK_SIGNAL' = 'STOCK_SIGNAL'; // Logistics/Ops domain
    readonly requiredRole = 'chef_cuisinier';

    constructor(private knowledgeManager: HermesKnowledgeManager) {}

    async evaluate(context: AgentContext, triggerPayload: Record<string, unknown>): Promise<AgentAction[]> {
        logger.info(`[Atlas] Evaluating Logistics context for tenant ${context.tenantId}`);
        const actions: AgentAction[] = [];

        // Example trigger: stock_reception
        if (triggerPayload.action === 'stock_reception') {
            const productId = triggerPayload.productId as string;
            const expiryDateStr = triggerPayload.expiryDate as string;
            const quantity = triggerPayload.quantity as number;

            if (expiryDateStr) {
                const expiryDate = new Date(expiryDateStr);
                const today = new Date();
                const diffTime = Math.abs(expiryDate.getTime() - today.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

                if (diffDays <= 2) {
                    const queryResponse = await this.knowledgeManager.query(
                        { question: `Le produit ${productId} expire dans ${diffDays} jours. Que faire ?` },
                        this.requiredRole
                    );

                    actions.push({
                        id: `atlas-action-promo-${Date.now()}`,
                        type: 'ops.create_promotion',
                        description: `Alerte DLC courte pour le produit ${productId}. Recommandation IA : ${queryResponse.answer}`,
                        confidence: 0.95,
                        proposedPayload: { productId, discountPercentage: 20 },
                        requiresHumanApproval: true,
                    });
                }
            }
        }

        return actions;
    }

    async execute(context: AgentContext, action: AgentAction): Promise<boolean> {
        logger.info(`[Atlas] Executing action ${action.id} for tenant ${context.tenantId}`);
        
        if (action.type === 'ops.create_promotion') {
            await NexusEventBus.emitDurable('inventory.stock_adjusted' as any, {
                tenantId: context.tenantId,
                ...action.proposedPayload,
                createdBy: 'Atlas-AI'
            });
            return true;
        }
        
        return false;
    }
}
