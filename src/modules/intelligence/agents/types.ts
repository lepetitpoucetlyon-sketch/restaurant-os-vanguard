import type { PermissionRole } from '@/shared/nexus/contracts/permissions.types';
import type { PulseCategory } from '@/shared/nexus/contracts/intelligence.types';

export interface AgentContext {
    tenantId: string;
    correlationId?: string;
}

export interface AgentAction {
    id: string;
    type: string;
    description: string;
    confidence: number;
    proposedPayload: Record<string, unknown>;
    requiresHumanApproval: boolean;
}

export interface IAutonomousAgent {
    readonly name: string;
    readonly domain: PulseCategory;
    readonly requiredRole: PermissionRole;

    /**
     * Evaluates a context and proposes a set of actions based on sovereign intelligence.
     * @param context The tenant execution context
     * @param triggerPayload The raw data that triggered this evaluation
     */
    evaluate(context: AgentContext, triggerPayload: Record<string, unknown>): Promise<AgentAction[]>;

    /**
     * Executes a given action after human approval or if requiresHumanApproval is false.
     * @param action The action to execute
     */
    execute(context: AgentContext, action: AgentAction): Promise<boolean>;
}
