import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'restaurant';

/**
 * Libellés RBAC — verticale Restaurant.
 * Les valeurs numériques de PERMISSION_ROLE_LEVELS sont invariantes ;
 * seuls les libellés changent d'une verticale à l'autre.
 *
 * Niveau 100 = Propriétaire du restaurant (PAS le super admin MCC).
 *
 * ──────────────────────────────────────────────────────────────────────
 * DÉFINITION DU RÔLE PROPRIÉTAIRE (niveau 100) — TENANT RESTAURANT
 * ──────────────────────────────────────────────────────────────────────
 * Le propriétaire est le gérant légal de l'établissement de restauration.
 * Il a un accès complet à son propre tenant, mais JAMAIS aux données
 * d'autres tenants (SovereignGuard). Ce n'est pas le créateur du logiciel.
 *
 * Périmètre complet :
 *  • Opérations    — POS, KDS, plan de salle, réservations
 *  • Finances      — CA, marges, TVA, NF525 (scellement fiscal)
 *  • Personnel     — embauche, planning, fiches de paie, congés
 *  • Stock         — inventaire, fournisseurs, alertes DLC
 *  • Conformité    — HACCP, températures, actions correctives
 *  • CRM           — fidélité, historique client, campagnes
 *  • Analytique    — oracle IA, tableaux de bord, profitabilité
 *  • Paramétrage   — config établissement, RBAC, intégrations
 *  • Migration     — import/export données
 * ──────────────────────────────────────────────────────────────────────
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:       'Manager / Chef de Salle',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef de Cuisine',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Sous-Chef',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Sommelier',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Chef de Rang',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Serveur(se)',
    [PERMISSION_ROLE_LEVELS.barman]:        'Barman / Barmaid',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) d\'accueil',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Cuisinier(ère)',
    [PERMISSION_ROLE_LEVELS.commis]:        'Commis / Runner',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Plongeur / Apprenti',
};

/** Suggestions de rôles pour la création rapide d'un membre du personnel. */
export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Serveur(se)' },
    { value: 'barman',          label: 'Barman / Barmaid' },
    { value: 'chef_cuisinier',  label: 'Chef de cuisine' },
    { value: 'cuisinier',       label: 'Cuisinier(ère)' },
    { value: 'sous_chef',       label: 'Sous-chef' },
    { value: 'sommelier',       label: 'Sommelier' },
    { value: 'chef_rang',       label: 'Chef de rang' },
    { value: 'hotesse',         label: 'Hôte(sse) d\'accueil' },
    { value: 'commis',          label: 'Commis / Runner' },
    { value: 'plongeur',        label: 'Plongeur' },
    { value: 'manager',         label: 'Manager / Chef de salle' },
    { value: 'directeur',       label: 'Directeur' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Propriétaire' },
];

/**
 * Descriptions courtes par rôle — utilisées dans l'UI d'onboarding, les tooltips,
 * les pages de paramétrage équipe et l'export RH.
 */
export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Gérant légal de l\'établissement. Accès total à toutes les fonctions du tenant.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur de l\'établissement. Supervise l\'ensemble des opérations et des équipes.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Manager / Chef de salle. Gère le service, les tables et l\'équipe en salle.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef de cuisine. Responsable de la production culinaire et des fiches recettes.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Sous-chef. Seconde le chef et coordonne les postes de cuisine.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable. Accède aux données financières, TVA et exports comptables.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Sommelier. Gère la cave, les accords mets-vins et les stocks de boissons.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Chef de rang. Encadre les serveurs et assure la qualité du service à table.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Serveur(se). Prend les commandes, encaisse, gère son rang.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Barman / Barmaid. Gère le bar, les cocktails et les commandes boissons.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) d\'accueil. Gère les réservations, l\'accueil et le plan de salle.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Cuisinier(ère). Exécute la production en cuisine sur son poste.',
    [PERMISSION_ROLE_LEVELS.commis]:        'Commis / Runner. Assiste la brigade, assure la mise en place et les courses.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Plongeur(se) / Apprenti. Entretien de la vaisselle et du matériel.',
};

/** Poids de distribution des pourboires par niveau RBAC. */
export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.3 },
    { level: PERMISSION_ROLE_LEVELS.sous_chef,       weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.sommelier,       weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.1 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.barman,          weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.9 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.8 },
    { level: PERMISSION_ROLE_LEVELS.commis,          weight: 0.7 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.5 },
];
