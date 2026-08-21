/**
 * PromptComposer — Composition universelle de prompts IA.
 *
 * Layer 1 du kernel IA : compose les prompts en combinant :
 *   [kernel base] + [vertical persona] + [vocabulary] + [few-shot examples] + [tenant context] + [user prompt]
 *
 * Règle R2 : AUCUN nom de vertical hardcodé dans ce fichier.
 * La personnalisation métier passe intégralement par VerticalAIPrompts (Layer 3).
 */

import type { VerticalAIPrompts } from './types';

export interface ComposeMCCInput {
    /** Prompt système de base (depuis MCC_SYSTEM_PROMPTS). */
    base: string;
    /** Contexte additionnel (tenantId, ticketId, etc.). */
    context?: Record<string, unknown>;
}

export interface ComposeTenantInput {
    /** Prompt système de base (depuis TENANT_SYSTEM_PROMPTS). */
    base: string;
    /** Bloc aiPrompts du blueprint vertical (Layer 3). */
    verticalLayer?: VerticalAIPrompts;
    /** Contexte tenant (user, section, données métier). */
    tenantContext?: Record<string, unknown>;
}

export class PromptComposer {
    /**
     * Compose un prompt MCC — sans layer vertical.
     * Le MCC ne connaît pas de vertical spécifique.
     */
    static composeMCC(input: ComposeMCCInput): string {
        const parts: string[] = [input.base];

        if (input.context && Object.keys(input.context).length > 0) {
            parts.push('');
            parts.push('--- Contexte ---');
            parts.push(JSON.stringify(input.context, null, 2));
        }

        return parts.join('\n');
    }

    /**
     * Compose un prompt Tenant — avec layer vertical automatique.
     * Injection cohérente : base + persona + vocabulary + examples + compliance + context.
     *
     * Sera enrichi en Phase D avec la composition complète.
     */
    static composeTenant(input: ComposeTenantInput): string {
        const parts: string[] = [input.base];

        if (input.verticalLayer) {
            const vl = input.verticalLayer;

            // Persona métier
            if (vl.systemPersona) {
                parts.push('');
                parts.push(vl.systemPersona);
            }

            // Vocabulaire métier
            if (vl.vocabulary && Object.keys(vl.vocabulary).length > 0) {
                parts.push('');
                parts.push('--- Vocabulaire métier ---');
                for (const [key, val] of Object.entries(vl.vocabulary)) {
                    parts.push(`${key} : ${val}`);
                }
            }

            // Few-shot examples
            if (vl.examples && vl.examples.length > 0) {
                parts.push('');
                parts.push('--- Exemples ---');
                for (const ex of vl.examples) {
                    parts.push(`Utilisateur : ${ex.user}`);
                    parts.push(`Assistant : ${ex.assistant}`);
                    parts.push('');
                }
            }

            // Actions interdites
            if (vl.forbiddenActions && vl.forbiddenActions.length > 0) {
                parts.push('');
                parts.push('--- Actions interdites ---');
                parts.push(vl.forbiddenActions.map(a => `- ${a}`).join('\n'));
            }

            // Compliance
            if (vl.complianceContext) {
                parts.push('');
                parts.push(`--- Contexte réglementaire ---`);
                parts.push(vl.complianceContext);
            }
        }

        if (input.tenantContext && Object.keys(input.tenantContext).length > 0) {
            parts.push('');
            parts.push('--- Contexte tenant ---');
            parts.push(JSON.stringify(input.tenantContext, null, 2));
        }

        return parts.join('\n');
    }
}
