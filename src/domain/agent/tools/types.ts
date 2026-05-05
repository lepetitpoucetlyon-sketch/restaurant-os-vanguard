import { z } from 'zod';
import { User } from '@nexus/contracts';
import { SovereignData, SovereignValue } from '@/shared/nexus-contract';

/**
 * 🏛️ AGENT TOOL DEFINITION - Grade X Contract
 */
export interface ToolDefinition<TArgs = unknown> {
    name: string;
    description: string;
    parameters: {
        type: 'object';
        properties: Record<string, unknown>;
        required?: string[];
    };
    schema: z.ZodTypeAny; // Grade X : Strict Validation (Supports Transformations)
    category: 'finance' | 'inventory' | 'commerce' | 'fleet' | 'compliance' | 'human' | 'reservations';
    execute: (args: TArgs, user: User, context?: SovereignData) => Promise<SovereignValue>;
}
