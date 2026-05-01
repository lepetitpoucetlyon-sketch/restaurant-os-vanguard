import { AgentDomain, AgentRole, AgentResponse } from './types';

/**
 * 🏺 Zeus - The Sovereign Orchestrator
 * Central intelligence for multi-agent coordination in Restaurant OS.
 */

export interface VanguardAgentConfig {
    id: string;
    domain: AgentDomain;
    role: AgentRole;
    priority: number;
    description: string;
}

export interface ZeusPulseResult {
    timestamp: string;
    anomalies: ZeusAnomaly[];
    actionsTaken: string[];
    insights: AgentResponse[];
}

export interface ZeusAnomaly {
    id: string;
    domain: AgentDomain;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    detectedAt: string;
    metadata?: Record<string, unknown>;
}

export interface ZeusManifest {
    version: string;
    activeAgents: VanguardAgentConfig[];
    lastPulse: string | null;
    currentFocus: AgentDomain | 'synthesis';
}
