import { logger } from '@/lib/logger';
import { HermesKnowledgeManager } from '@/modules/intelligence/knowledge/rag/HermesKnowledgeManager';
import type { IAutonomousAgent, AgentAction, AgentContext } from './types';
import { ThemisHRAgent } from './ThemisHRAgent';
import { AtlasLogisticsAgent } from './AtlasLogisticsAgent';

export class MacroBrainOrchestrator {
    private agents: IAutonomousAgent[] = [];
    private knowledgeManager: HermesKnowledgeManager;

    constructor(tenantId: string) {
        this.knowledgeManager = new HermesKnowledgeManager(tenantId, { correlationId: 'macrobrain-init' } as any);
        this.registerAgents();
    }

    private registerAgents() {
        this.agents.push(new ThemisHRAgent(this.knowledgeManager));
        this.agents.push(new AtlasLogisticsAgent(this.knowledgeManager));
        logger.info(`[MacroBrain] Registered ${this.agents.length} sovereign agents.`);
    }

    /**
     * Dispatch an event payload to all relevant agents for evaluation.
     */
    async dispatchEvent(tenantId: string, eventName: string, payload: Record<string, unknown>): Promise<AgentAction[]> {
        const context: AgentContext = { tenantId, correlationId: `evt-${Date.now()}` };
        
        // Add action type to payload to match agent logic
        const triggerPayload = { ...payload, action: eventName };
        const proposedActions: AgentAction[] = [];

        logger.info(`[MacroBrain] Dispatching event '${eventName}' to swarm for tenant ${tenantId}`);

        for (const agent of this.agents) {
            try {
                const actions = await agent.evaluate(context, triggerPayload);
                if (actions && actions.length > 0) {
                    proposedActions.push(...actions);
                    logger.info(`[MacroBrain] Agent ${agent.name} proposed ${actions.length} action(s).`);
                }
            } catch (error) {
                logger.error(`[MacroBrain] Agent ${agent.name} failed during evaluation:`, error);
            }
        }

        return proposedActions;
    }

    /**
     * Executes a specific action using the agent that proposed it.
     */
    async executeAction(tenantId: string, agentName: string, action: AgentAction): Promise<boolean> {
        const agent = this.agents.find(a => a.name === agentName);
        if (!agent) {
            logger.error(`[MacroBrain] Agent ${agentName} not found for execution.`);
            return false;
        }

        const context: AgentContext = { tenantId, correlationId: `exec-${Date.now()}` };
        
        try {
            return await agent.execute(context, action);
        } catch (error) {
            logger.error(`[MacroBrain] Agent ${agentName} failed to execute action ${action.id}:`, error);
            return false;
        }
    }
}
