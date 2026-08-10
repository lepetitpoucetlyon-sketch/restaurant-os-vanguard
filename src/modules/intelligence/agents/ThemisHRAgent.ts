import { logger } from '@/lib/logger';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { HermesKnowledgeManager } from '@/modules/intelligence/knowledge/rag/HermesKnowledgeManager';
import type { IAutonomousAgent, AgentAction, AgentContext } from './types';

export class ThemisHRAgent implements IAutonomousAgent {
    readonly name = 'Themis HR Evaluator';
    readonly domain: 'LABOR_PATTERN' = 'LABOR_PATTERN';
    readonly requiredRole = 'manager';

    constructor(private knowledgeManager: HermesKnowledgeManager) {}

    async evaluate(context: AgentContext, triggerPayload: Record<string, unknown>): Promise<AgentAction[]> {
        logger.info(`[Themis] Evaluating HR context for tenant ${context.tenantId}`);
        const actions: AgentAction[] = [];

        // Example trigger: timeclock_submit
        if (triggerPayload.action === 'timeclock_submit') {
            const employeeId = triggerPayload.employeeId as string;
            const hoursLogged = triggerPayload.hours as number;
            
            // 1. Query the RAG for the employee's contract rules
            const queryResponse = await this.knowledgeManager.query(
                { question: `Quelles sont les heures supplémentaires autorisées pour l'employé ${employeeId} ?` },
                this.requiredRole
            );

            // 2. Simple heuristic (simulate AI deduction)
            if (hoursLogged > 8) {
                actions.push({
                    id: `themis-action-ot-${Date.now()}`,
                    type: 'hr.approve_overtime',
                    description: `L'employé a travaillé ${hoursLogged}h. Approbation d'heures supplémentaires requise. RAG Context: ${queryResponse.answer}`,
                    confidence: 0.9,
                    proposedPayload: { employeeId, overtimeHours: hoursLogged - 8 },
                    requiresHumanApproval: true,
                });
            }
        }

        return actions;
    }

    async execute(context: AgentContext, action: AgentAction): Promise<boolean> {
        logger.info(`[Themis] Executing action ${action.id} for tenant ${context.tenantId}`);
        
        if (action.type === 'hr.approve_overtime') {
            await NexusEventBus.emitDurable('mcc.alert_triggered' as any, {
                tenantId: context.tenantId,
                ...action.proposedPayload,
                approvedBy: 'Themis-AI'
            });
            return true;
        }
        
        return false;
    }
}
