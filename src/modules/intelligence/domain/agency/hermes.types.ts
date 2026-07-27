import { AgentDomain, AgentRole, AgentResponse } from './types';

/**
 * 🏺 Hermes - The Sovereign Orchestrator
 * Central intelligence for multi-agent coordination in Restaurant OS.
 */

export interface VanguardAgentConfig {
    id: string;
    domain: AgentDomain;
    role: AgentRole;
    priority: number;
    description: string;
}

export interface HermesPulseResult {
    timestamp: string;
    anomalies: HermesAnomaly[];
    actionsTaken: string[];
    insights: AgentResponse[];
}

export interface HermesAnomaly {
    id: string;
    domain: AgentDomain;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    detectedAt: string;
    metadata?: Record<string, unknown>;
}

export interface HermesManifest {
    version: string;
    activeAgents: VanguardAgentConfig[];
    lastPulse: string | null;
    currentFocus: AgentDomain | 'synthesis';
}
