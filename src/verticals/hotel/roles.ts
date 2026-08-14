import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'hotel';

/**
 * Libellés RBAC — verticale Hôtel / Hôtellerie-Restauration.
 * Niveau 100 = Propriétaire de l'hôtel (PAS le super admin MCC).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / Directeur Général',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur d\'Établissement',
    [PERMISSION_ROLE_LEVELS.manager]:       'Chef de Réception / Manager',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef Exécutif',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Sous-Chef / Responsable de Service',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Contrôleur de Gestion',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Sommelier / Concierge Senior',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Responsable Étage / Maître d\'Hôtel',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Réceptionniste',
    [PERMISSION_ROLE_LEVELS.barman]:        'Barman / Serveur(se) Restaurant',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) d\'Accueil / Conciergerie',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Cuisinier(ère)',
    [PERMISSION_ROLE_LEVELS.commis]:        'Commis / Employé d\'Étage',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Plongeur / Stagiaire',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Réceptionniste' },
    { value: 'barman',          label: 'Serveur(se)' },
    { value: 'chef_cuisinier',  label: 'Chef Exécutif' },
    { value: 'cuisinier',       label: 'Cuisinier(ère)' },
    { value: 'sous_chef',       label: 'Responsable de Service' },
    { value: 'sommelier',       label: 'Sommelier / Concierge' },
    { value: 'chef_rang',       label: 'Maître d\'Hôtel' },
    { value: 'hotesse',         label: 'Hôte(sse) d\'Accueil' },
    { value: 'commis',          label: 'Employé d\'Étage' },
    { value: 'plongeur',        label: 'Stagiaire' },
    { value: 'manager',         label: 'Chef de Réception' },
    { value: 'directeur',       label: 'Directeur d\'Établissement' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Directeur Général' },
];

export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / DG. Accès total à la gestion de l\'établissement : hébergement, restauration, finances, personnel.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur d\'Établissement. Supervise toutes les opérations et les équipes departments.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Chef de Réception / Manager. Gère les arrivées, départs, planning et incidents.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef Exécutif. Responsable de toute la production culinaire de l\'hôtel.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Sous-Chef / Responsable de Service. Coordonne un service ou un département.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Contrôleur. Gestion financière, facturation groupes et exports.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Sommelier / Concierge Senior. Expert cave et service de conciergerie premium.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Maître d\'Hôtel / Responsable Étage. Coordination des équipes en service.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Réceptionniste. Accueil clients, check-in/check-out, gestion des chambres.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Barman / Serveur(se). Service en bar et en salle restaurant de l\'hôtel.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) / Conciergerie. Accueil, informations touristiques, réservations externes.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Cuisinier(ère). Production culinaire sur son poste en cuisine d\'hôtel.',
    [PERMISSION_ROLE_LEVELS.commis]:        'Commis / Employé d\'Étage. Mise en place, service des chambres, entretien.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Plongeur / Stagiaire. Entretien cuisine et introduction aux métiers hôteliers.',
};

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
    { level: PERMISSION_ROLE_LEVELS.commis,          weight: 0.6 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.4 },
];
