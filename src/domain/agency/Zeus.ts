import { z } from 'zod';
import { AgentDomain, AgentRole, AgentResponse } from './types';

/**
 * 🏺 Zeus - The Sovereign Orchestrator
 * Central intelligence for multi-agent coordination in Restaurant OS.
 */

export const VanguardAgentConfigSchema = z.object({
    id: z.string(),
    domain: z.enum(['inventory', 'haccp', 'recipes', 'sales', 'fleet', 'accounting', 'general']),
    role: z.enum(['admin', 'manager', 'staff', 'commis']),
    priority: z.number().int().min(0).max(10),
    description: z.string()
});

export type VanguardAgentConfig = z.infer<typeof VanguardAgentConfigSchema>;

export const ZeusAnomalySchema = z.object({
    id: z.string(),
    domain: z.enum(['inventory', 'haccp', 'recipes', 'sales', 'fleet', 'accounting', 'general']),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    message: z.string(),
    detectedAt: z.string(),
    metadata: z.record(z.string(), z.any()).optional()
});

export type ZeusAnomaly = z.infer<typeof ZeusAnomalySchema>;

export const ZeusPulseResultSchema = z.object({
    timestamp: z.string(),
    anomalies: z.array(ZeusAnomalySchema),
    actionsTaken: z.array(z.string()),
    insights: z.array(z.any()) // AgentResponse can be complex
});

export type ZeusPulseResult = z.infer<typeof ZeusPulseResultSchema>;

export const ZeusManifestSchema = z.object({
    version: z.string(),
    activeAgents: z.array(VanguardAgentConfigSchema),
    lastPulse: z.string().nullable(),
    currentFocus: z.union([
        z.enum(['inventory', 'haccp', 'recipes', 'sales', 'fleet', 'accounting', 'general']), 
        z.literal('synthesis')
    ])
});

export type ZeusManifest = z.infer<typeof ZeusManifestSchema>;
