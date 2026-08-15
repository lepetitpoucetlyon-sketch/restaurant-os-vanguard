/**
 * 🛠️ AssistantActionDispatcher — Moteur de Function Calling & Dispatcher d'Actions
 * 
 * Permet au Copilote IA d'émettre des propositions d'actions concrètes
 * avec validation stricte du niveau RBAC (10 à 100) avant toute exécution.
 */

import { logger } from '@/lib/logger';
import { redactPII } from '@/lib/security/redactPII';

export type ActionToolCategory = 'navigation' | 'pos' | 'logistics' | 'facility' | 'finance' | 'luxury_vault';

export interface AssistantToolDefinition {
    id: string;
    name: string;
    description: string;
    category: ActionToolCategory;
    minRoleLevel: number; // 10 (Opérateur), 40 (Employé/Praticien), 70 (Manager), 100 (Directeur/Propriétaire)
    parameters: Array<{
        name: string;
        type: 'string' | 'number' | 'boolean';
        description: string;
        required: boolean;
    }>;
}

export interface ActionProposal {
    id: string;
    toolId: string;
    title: string;
    description: string;
    params: Record<string, unknown>;
    minRoleLevel: number;
    status: 'proposed' | 'executed' | 'rejected';
}

export const UNIVERSAL_ASSISTANT_TOOLS: Record<string, AssistantToolDefinition> = {
    navigate_to_module: {
        id: 'navigate_to_module',
        name: 'Navigation vers un Module',
        description: 'Redirige l\'utilisateur vers une page ou un écran spécifique de l\'application.',
        category: 'navigation',
        minRoleLevel: 10,
        parameters: [
            { name: 'targetPath', type: 'string', description: 'Chemin de destination (ex: /pos, /inventory, /fec)', required: true },
            { name: 'label', type: 'string', description: 'Intitulé de l\'écran cible', required: false },
        ],
    },
    lock_space_or_table: {
        id: 'lock_space_or_table',
        name: 'Verrouillage d\'Espace ou Table',
        description: 'Verrouille une table, baie de garage, cabine de soin ou espace de travail.',
        category: 'pos',
        minRoleLevel: 40,
        parameters: [
            { name: 'spaceId', type: 'string', description: 'Identifiant de l\'espace ou de la table', required: true },
            { name: 'reason', type: 'string', description: 'Motif du verrouillage (ex: Réservation VIP, Nettoyage)', required: false },
        ],
    },
    trigger_stock_reorder: {
        id: 'trigger_stock_reorder',
        name: 'Préparation Commande Fournisseur',
        description: 'Génère un bon de réapprovisionnement pour un article en rupture ou seuil critique.',
        category: 'logistics',
        minRoleLevel: 50,
        parameters: [
            { name: 'itemId', type: 'string', description: 'Identifiant du produit ou ingrédient', required: true },
            { name: 'quantity', type: 'number', description: 'Quantité à commander', required: true },
            { name: 'supplierName', type: 'string', description: 'Nom du fournisseur principal', required: false },
        ],
    },
    create_maintenance_ticket: {
        id: 'create_maintenance_ticket',
        name: 'Alerte Incident Équipement',
        description: 'Crée un ticket d\'incident matériel ou de panne d\'équipement technique.',
        category: 'facility',
        minRoleLevel: 30,
        parameters: [
            { name: 'equipmentName', type: 'string', description: 'Nom de l\'appareil (ex: Fournil, TPE, Pont élévateur)', required: true },
            { name: 'severity', type: 'string', description: 'Gravité (low, medium, critical)', required: true },
            { name: 'description', type: 'string', description: 'Description de la panne constatée', required: true },
        ],
    },
    verify_luxury_asset_seal: {
        id: 'verify_luxury_asset_seal',
        name: 'Vérification Scellé & Cote Actif',
        description: 'Consulte la cote officielle ou déclenche une vérification de scellé de coffre.',
        category: 'luxury_vault',
        minRoleLevel: 40,
        parameters: [
            { name: 'assetId', type: 'string', description: 'Identifiant du sac ou lot de luxe (ex: BIRKIN-30-001)', required: true },
            { name: 'verificationType', type: 'string', description: 'Type de vérification (nfc_ping, market_quote, vault_status)', required: true },
        ],
    },
    query_financial_snapshot: {
        id: 'query_financial_snapshot',
        name: 'Consultation Synthèse Financière',
        description: 'Affiche la synthèse du chiffre d\'affaires, de la marge ou du FEC.',
        category: 'finance',
        minRoleLevel: 70,
        parameters: [
            { name: 'period', type: 'string', description: 'Période analysée (today, this_week, this_month)', required: true },
            { name: 'metric', type: 'string', description: 'Métrique financière (turnover, food_cost, margin)', required: true },
        ],
    },
};

export class AssistantActionDispatcher {
    /**
     * Filtre les outils utilisables selon le niveau RBAC de l'utilisateur
     */
    public static getAuthorizedTools(roleLevel: number): AssistantToolDefinition[] {
        return Object.values(UNIVERSAL_ASSISTANT_TOOLS).filter(t => roleLevel >= t.minRoleLevel);
    }

    /**
     * Valide et instancie une proposition d'action
     */
    public static createActionProposal(
        toolId: string,
        params: Record<string, unknown>,
        userRoleLevel: number
    ): { success: boolean; proposal?: ActionProposal; error?: string } {
        const tool = UNIVERSAL_ASSISTANT_TOOLS[toolId];
        if (!tool) {
            return { success: false, error: `Outil inconnu : ${toolId}` };
        }

        if (userRoleLevel < tool.minRoleLevel) {
            logger.warn(`[AssistantActionDispatcher] Tentative d'action non-autorisée : ${toolId} (Requis: ${tool.minRoleLevel}, Utilisateur: ${userRoleLevel})`);
            return { 
                success: false, 
                error: `Permissions insuffisantes : cet outil nécessite un niveau d'habilitation ${tool.minRoleLevel} (votre niveau: ${userRoleLevel}).` 
            };
        }

        // Nettoyage PII des paramètres
        const sanitizedParams = redactPII(params) as Record<string, unknown>;

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
}
