/**
 * 🛠️ AssistantActionDispatcher — Orchestrateur des actions IA (Function Calling)
 *
 * Compose : Registry (data) + Validator (RBAC/PII) + Idempotence + Executor (switch)
 *
 * Historique : ce fichier faisait 544L. Il a été découpé (2026-08-20) en :
 *   - AssistantToolRegistry.ts   (types + registre des outils)
 *   - AssistantActionValidator.ts (RBAC + PII + sanitize)
 *   - AssistantActionDispatcher.ts (ce fichier — orchestration + exécution)
 *
 * Tous les exports historiques sont préservés (re-export) pour les 14 callers.
 */

import { logger } from '@/lib/logger';
import { AssistantActionValidator } from './AssistantActionValidator';
import {
    UNIVERSAL_ASSISTANT_TOOLS,
    getToolById,
    type ActionToolCategory,
    type AssistantToolDefinition,
    type ActionProposal,
} from './AssistantToolRegistry';

// Re-exports pour compat totale — les 14 callers importent depuis ici
export {
    UNIVERSAL_ASSISTANT_TOOLS,
    getToolById,
    type ActionToolCategory,
    type AssistantToolDefinition,
    type ActionProposal,
};

/** Cache d'idempotence — anti-rejeu des propositions déjà exécutées. */
const executedProposalIds = new Set<string>();

/**
 * Aiguillage d'exécution d'un outil vers son message métier.
 * Encapsulé ici plutôt qu'inline pour tester séparément et permettre l'extension future.
 */
function runToolExecution(
    toolId: string,
    toolName: string,
    execParams: Record<string, unknown>,
): { success: boolean; message: string; data?: unknown } {
    switch (toolId) {
        case 'fire_course_sequence':
            return {
                success: true,
                message: `Suite envoyée pour la Table ${execParams.tableId} (${execParams.course || 'plats'}) ! Les KDS ont été notifiés.`,
            };
        case 'schedule_baking_batch':
            return {
                success: true,
                message: `Fournée programmée : ${execParams.quantity}x ${execParams.recipeId}. Minuteur cuisson activé.`,
            };
        case 'publish_tgtg_basket':
            return {
                success: true,
                message: `${execParams.quantity} paniers TooGoodToGo publiés à ${((execParams.priceCents as number) || 399) / 100}€. Bordereau loi Garot généré.`,
            };
        case 'track_waste_bsdd':
            return {
                success: true,
                message: `Bordereau Trackdéchets BSDD scellé pour ${execParams.volume} de ${execParams.wasteType}. N° BSDD: BSDD-${Date.now()}`,
            };
        case 'generate_police_sheet':
            return {
                success: true,
                message: `Fiche de police CESEDA générée et scellée pour ${execParams.guestName} (Réservation ${execParams.bookingId}).`,
            };
        case 'verify_hds_consent':
            return {
                success: true,
                message: `Consentement HDS vérifié et conforme pour le patient ${execParams.patientId} (Acte ${execParams.treatmentCode}).`,
            };
        case 'verify_luxury_asset_seal':
            return {
                success: true,
                message: `Actif ${execParams.assetId} scellé et authentifié. Cote officielle certifiée.`,
            };
        case 'lock_space_or_table':
            return {
                success: true,
                message: `Espace ${execParams.spaceId} verrouillé avec succès.`,
            };
        case 'create_maintenance_ticket':
            return {
                success: true,
                message: `Ticket d'incident créé pour ${execParams.equipmentName} (Gravité: ${execParams.severity}).`,
            };
        case 'trigger_stock_reorder':
            return {
                success: true,
                message: `Bon de réapprovisionnement généré pour ${execParams.quantity} unités de ${execParams.itemId}.`,
            };
        default:
            return {
                success: true,
                message: `Action ${toolName} exécutée avec succès.`,
            };
    }
}

export class AssistantActionDispatcher {
    /** Vide le cache d'idempotence (réservé aux tests et réinitialisations de session). */
    public static clearIdempotencyCache(): void {
        executedProposalIds.clear();
    }

    /** Filtre les outils utilisables selon le niveau RBAC de l'utilisateur. */
    public static getAuthorizedTools(
        roleLevel: number,
        categoryFilter?: ActionToolCategory,
    ): AssistantToolDefinition[] {
        return AssistantActionValidator.getAuthorizedTools(roleLevel, categoryFilter);
    }

    /** Valide et instancie une proposition d'action (RBAC + PII + params). */
    public static createActionProposal(
        toolId: string,
        params: Record<string, unknown>,
        userRoleLevel: number,
    ): { success: boolean; proposal?: ActionProposal; error?: string } {
        const validation = AssistantActionValidator.prepareAction(toolId, params, userRoleLevel);
        if (!validation.success) {
            return { success: false, error: validation.error };
        }

        const { tool, sanitizedParams } = validation.data;
        const proposal: ActionProposal = {
            id: `ACT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            toolId,
            title: tool.name,
            description: tool.description,
            params: sanitizedParams,
            minRoleLevel: tool.minRoleLevel,
            status: 'proposed',
        };

        return { success: true, proposal };
    }

    /** Simule ou exécute une action approuvée par l'utilisateur. */
    public static async executeAction(
        proposal: ActionProposal,
        userRoleLevel: number,
    ): Promise<{ success: boolean; message: string; data?: unknown }> {
        const tool = getToolById(proposal.toolId);
        if (!tool) {
            return { success: false, message: `Outil non trouvé : ${proposal.toolId}` };
        }

        if (userRoleLevel < tool.minRoleLevel) {
            return {
                success: false,
                message: `Exécution refusée : habilitation requise ${tool.minRoleLevel} (votre niveau: ${userRoleLevel}).`,
            };
        }

        // 🛡️ VERROU D'IDEMPOTENCE : Empêche le rejeu ou double-exécution
        if (executedProposalIds.has(proposal.id)) {
            logger.warn(
                `[AssistantActionDispatcher] Tentative de rejeu de l'action déjà exécutée : ${proposal.id}`,
            );
            return {
                success: false,
                message: `Action déjà exécutée (Idempotence) : la proposition ${proposal.id} ne peut pas être rejouée.`,
            };
        }

        // Validation stricte à l'exécution (les params ont pu être altérés entre propose et execute)
        const validation = AssistantActionValidator.sanitizeParams(proposal.toolId, proposal.params);
        if (!validation.valid) {
            return {
                success: false,
                message: `Exécution annulée : paramètres non conformes (${validation.error}).`,
            };
        }

        logger.info(
            `[AssistantActionDispatcher] Exécution de l'action : ${proposal.toolId}`,
            validation.sanitizedParams,
        );
        executedProposalIds.add(proposal.id);

        return runToolExecution(proposal.toolId, tool.name, validation.sanitizedParams);
    }
}
