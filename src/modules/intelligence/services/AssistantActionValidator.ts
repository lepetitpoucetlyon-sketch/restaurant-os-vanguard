/**
 * 🛡️ AssistantActionValidator — RBAC + PII + validation paramètres
 *
 * Toutes les portes d'entrée d'une action IA passent ici :
 *   1. Existence du tool
 *   2. RBAC (niveau utilisateur ≥ minRoleLevel)
 *   3. Redaction PII initiale
 *   4. Sanitize + validation des paramètres (délégué au sub-validator existant)
 */

import { logger } from '@/lib/logger';
import { redactPII } from '@/lib/security/redactPII';
import { ActionParameterValidator } from './action-validators/ActionParameterValidator';
import {
    UNIVERSAL_ASSISTANT_TOOLS,
    getToolById,
    type ActionToolCategory,
    type AssistantToolDefinition,
} from './AssistantToolRegistry';

export interface ValidatedActionInput {
    tool: AssistantToolDefinition;
    sanitizedParams: Record<string, unknown>;
}

export type ValidationResult =
    | { success: true; data: ValidatedActionInput }
    | { success: false; error: string };

export const AssistantActionValidator = {
    /** Filtre les outils autorisés pour un niveau RBAC + catégorie optionnelle. */
    getAuthorizedTools(
        roleLevel: number,
        categoryFilter?: ActionToolCategory,
    ): AssistantToolDefinition[] {
        return Object.values(UNIVERSAL_ASSISTANT_TOOLS).filter((t) => {
            const levelMatch = roleLevel >= t.minRoleLevel;
            const catMatch = !categoryFilter || t.category === categoryFilter;
            return levelMatch && catMatch;
        });
    },

    /** Sanitize + valide les paramètres (déléguée au sous-validateur historique). */
    sanitizeParams(toolId: string, params: Record<string, unknown>) {
        return ActionParameterValidator.sanitizeAndValidate(toolId, params);
    },

    /**
     * Prépare une action : existence tool + RBAC + PII + sanitize.
     * Retourne le tool résolu et les params nettoyés, prêts à être exécutés.
     */
    prepareAction(
        toolId: string,
        rawParams: Record<string, unknown>,
        userRoleLevel: number,
    ): ValidationResult {
        const tool = getToolById(toolId);
        if (!tool) {
            return { success: false, error: `Outil inconnu : ${toolId}` };
        }

        if (userRoleLevel < tool.minRoleLevel) {
            logger.warn(
                `[AssistantActionValidator] Tentative d'action non-autorisée : ${toolId} (Requis: ${tool.minRoleLevel}, Utilisateur: ${userRoleLevel})`,
            );
            return {
                success: false,
                error: `Permissions insuffisantes : cet outil nécessite un niveau d'habilitation ${tool.minRoleLevel} (votre niveau: ${userRoleLevel}).`,
            };
        }

        const piiRedacted = redactPII(rawParams) as Record<string, unknown>;
        const validation = this.sanitizeParams(toolId, piiRedacted);
        if (!validation.valid) {
            logger.warn(
                `[AssistantActionValidator] Paramètres d'action invalides pour ${toolId} : ${validation.error}`,
            );
            return { success: false, error: validation.error ?? 'Paramètres invalides' };
        }

        return {
            success: true,
            data: { tool, sanitizedParams: validation.sanitizedParams },
        };
    },
};
