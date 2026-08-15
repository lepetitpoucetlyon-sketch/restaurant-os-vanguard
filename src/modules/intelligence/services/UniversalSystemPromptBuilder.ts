/**
 * 🏛️ UniversalSystemPromptBuilder — Générateur Dynamique de Prompts Multi-Verticales
 * 
 * Élimine le hardcoding "Restaurant OS" et injecte dynamiquement :
 * 1. Le vocabulaire sectoriel (MetricLabels) de la verticale active
 * 2. Le rôle et le niveau d'habilitation RBAC numérique (10 à 100)
 * 3. Le périmètre de confidentialité étanche
 * 4. Le catalogue d'actions exécutables autorisées
 */

import { redactPII } from '@/lib/security/redactPII';
import { AssistantActionDispatcher, AssistantToolDefinition } from './AssistantActionDispatcher';

export interface VerticalShorthandLabels {
    merchantTitle: string;
    unitLabel: string;
    spaceLabel: string;
    operatorLabel: string;
    ticketLabel: string;
    focusAreas: string;
}

export const VERTICAL_LABELS_MAP: Record<string, VerticalShorthandLabels> = {
    restaurant: {
        merchantTitle: 'Restaurant & Brasserie',
        unitLabel: 'couvert / plat',
        spaceLabel: 'table / salle',
        operatorLabel: 'serveur / cuisinier / manager',
        ticketLabel: 'bon de commande / addition',
        focusAreas: 'service en salle, cadençage KDS, hygiène HACCP, allergènes INCO et stock périssable.',
    },
    bakery: {
        merchantTitle: 'Boulangerie & Pâtisserie',
        unitLabel: 'pièce / kilo',
        spaceLabel: 'fournil / vitrine',
        operatorLabel: 'boulanger / vendeur comptoir',
        ticketLabel: 'ticket de pesée / fournée',
        focusAreas: 'fournées, poids balance connectée, traçabilité farine et DLC/DLUO.',
    },
    garage: {
        merchantTitle: 'Garage & Atelier Mécanique',
        unitLabel: 'heure MO / pièce détachée',
        spaceLabel: 'baie de travail / pont élévateur',
        operatorLabel: 'mécanicien / chef d\'atelier',
        ticketLabel: 'ordre de réparation (OR) / devis',
        focusAreas: 'immatriculation SIV, pièces TecDoc, suivi de réparation et traçabilité déchets BSDD.',
    },
    salon: {
        merchantTitle: 'Salon de Coiffure & Beauté',
        unitLabel: 'prestation / forfait',
        spaceLabel: 'fauteuil / cabine de soin',
        operatorLabel: 'coiffeur / esthéticienne',
        ticketLabel: 'fiche rendez-vous / ticket prestation',
        focusAreas: 'agenda cabine, temps de pose, fiches clientes et stock cabine vs revente.',
    },
    hotel: {
        merchantTitle: 'Hôtel & Hébergement',
        unitLabel: 'nuitée / chambre',
        spaceLabel: 'chambre / suite / étage',
        operatorLabel: 'réceptionniste / gouvernante',
        ticketLabel: 'folio / note de séjour',
        focusAreas: 'planning de réservation, check-in/out, taxe de séjour et fiche de police CESEDA.',
    },
    clinic: {
        merchantTitle: 'Clinique & Cabinet Médical',
        unitLabel: 'acte médical (CCAM)',
        spaceLabel: 'cabinet / salle de consultation',
        operatorLabel: 'praticien / secrétaire médicale',
        ticketLabel: 'dossier consultation / feuille de soins',
        focusAreas: 'planning de consultations, dossiers patients chiffrés, confidentialité médicale et télétransmission.',
    },
    retail: {
        merchantTitle: 'Commerce de Détail & Boutique',
        unitLabel: 'article / variante',
        spaceLabel: 'rayon / réserve',
        operatorLabel: 'vendeur / caissier',
        ticketLabel: 'ticket de caisse / scan EAN',
        focusAreas: 'variantes taille/couleur, scan codes-barres 2D, inventaire et réassort.',
    },
    luxury_vault: {
        merchantTitle: 'Investissement & Coffre Sacs de Luxe',
        unitLabel: 'part / fraction d\'actif',
        spaceLabel: 'coffre-fort / chambre forte blindée',
        operatorLabel: 'expert authentificateur / curator',
        ticketLabel: 'certificat de scellé / fiche d\'expertise',
        focusAreas: 'cotation officielle, état du cuir/coutures, vérification NFC et distribution des dividendes locatifs.',
    },
    custom: {
        merchantTitle: 'Universal Commerce OS',
        unitLabel: 'unité / lot',
        spaceLabel: 'espace / poste',
        operatorLabel: 'opérateur / collaborateur',
        ticketLabel: 'ticket d\'opération',
        focusAreas: 'opérations de commerce, gestion d\'équipe et encaissement sécurisé.',
    },
};

export class UniversalSystemPromptBuilder {
    /**
     * Calcule le niveau numérique du rôle utilisateur (10 à 100)
     */
    public static resolveRoleLevel(role?: string): number {
        if (!role) return 10;
        const normalized = role.toLowerCase();

        if (['super_admin', 'owner', 'proprietaire', 'gerant'].includes(normalized)) return 100;
        if (['directeur', 'director', 'gm'].includes(normalized)) return 90;
        if (['manager', 'responsable_site', 'adjoint'].includes(normalized)) return 70;
        if (['comptable', 'accountant', 'finance_lead'].includes(normalized)) return 60;
        if (['chef_rang', 'chef_atelier', 'specialiste', 'praticien', 'expert'].includes(normalized)) return 50;
        if (['serveur', 'mecanicien', 'vendeur', 'coiffeur', 'receptionniste', 'cuisinier', 'barman'].includes(normalized)) return 40;
        if (['assistant', 'aide', 'hotesse'].includes(normalized)) return 30;
        if (['apprenti', 'stagiaire', 'plongeur'].includes(normalized)) return 10;

        return 40; // Fallback opérationnel standard
    }

    /**
     * Construit le prompt système optimisé pour la verticale et le rôle
     */
    public static build(params: {
        variant?: string;
        role?: string;
        roleLevel?: number;
        ragContext?: string;
        userContext?: Record<string, unknown>;
    }): string {
        const variantKey = (params.variant || 'restaurant').toLowerCase();
        const vertical = VERTICAL_LABELS_MAP[variantKey] || VERTICAL_LABELS_MAP.custom;
        const level = params.roleLevel ?? this.resolveRoleLevel(params.role);
        const roleName = params.role || 'opérateur';

        // Outils autorisés pour ce niveau
        const tools: AssistantToolDefinition[] = AssistantActionDispatcher.getAuthorizedTools(level);
        const toolsDescription = tools.map(t => `- [${t.id}] : ${t.name} — ${t.description}`).join('\n');

        const levelPerimeter = this.describeLevelPerimeter(level);

        const promptSections: string[] = [
            `Tu es NEXUS, l'assistant intelligent et copilote d'exploitation de la plateforme **${vertical.merchantTitle}**.`,
            `Tu t'adresses à un utilisateur ayant le rôle : **${roleName}** (Niveau d'habilitation RBAC : **${level}/100**).`,
            '',
            `### 🏢 Contexte Métier & Vocabulaire :`,
            `- Type d'établissement : ${vertical.merchantTitle}`,
            `- Unité de mesure / transaction : ${vertical.unitLabel}`,
            `- Espace de travail : ${vertical.spaceLabel}`,
            `- Équipe : ${vertical.operatorLabel}`,
            `- Document opérationnel : ${vertical.ticketLabel}`,
            `- Domaines prioritaires : ${vertical.focusAreas}`,
            '',
            `### 🛡️ Périmètre de Sécurité & Confidentialité (Niveau ${level}/100) :`,
            levelPerimeter,
            `RÈGLE ABSOLUE : Ne divulgue JAMAIS d'informations dépassant le niveau d'habilitation de l'utilisateur (salaires des collègues, données financières globales si <70, secrets d'administration si <100).`,
            '',
            `### ⚡ Outils & Actions Applicatives Autorisés :`,
            toolsDescription || 'Aucune action automatisée autorisée pour ce niveau.',
            '',
            `Si la demande de l'utilisateur implique l'un de ces outils, tu peux suggérer explicitement l'action correspondante au format structuré.`,
        ];

        if (params.ragContext) {
            const sanitizedRAG = redactPII(params.ragContext);
            promptSections.push(
                '',
                '### 📚 Base de Connaissances Spécifique de l\'Établissement (RAG) :',
                sanitizedRAG
            );
        }

        return promptSections.join('\n');
    }

    private static describeLevelPerimeter(level: number): string {
        if (level >= 100) {
            return 'Accès souverain total : Supervision de la flotte, paramètres système, comptabilité complète, RH et sécurité.';
        }
        if (level >= 70) {
            return 'Accès managérial : Gestion des plannings, marge commerciale, clôtures de caisse, stocks et alertes qualité.';
        }
        if (level >= 40) {
            return 'Accès opérationnel : Prise de commande, fiches techniques, consultation des plannings individuels et aide aux opérations courantes.';
        }
        return 'Accès restreint / initiation : Consultation des consignes du jour, fiches de sécurité et tâches assignées.';
    }
}
