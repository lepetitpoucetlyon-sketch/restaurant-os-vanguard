// @ts-nocheck
export type AgentDomain = 'inventory' | 'haccp' | 'recipes' | 'sales' | 'fleet' | 'accounting' | 'general';

export type AgentRole = 'admin' | 'manager' | 'staff' | 'commis';

export interface AgentReasoningStep {
    id: string;
    timestamp: string;
    action: string;
    observation: string;
    thought: string;
}

export interface AgentInsight {
    id: string;
    domain: AgentDomain;
    type: 'warning' | 'opportunity' | 'compliance' | 'info';
    title: string;
    description: string;
    suggestedAction?: {
        label: string;
        payload: any;
    };
    reasoning: AgentReasoningStep[];
}

export interface BusinessAgent {
    domain: AgentDomain;
    name: string;
    role: AgentRole;
    systemPrompt: string;
    capabilities: string[];
}

export interface AgentResponse {
    insight: AgentInsight;
    rawText?: string;
}
