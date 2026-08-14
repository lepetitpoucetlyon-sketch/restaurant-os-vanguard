import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'garage';

/**
 * Libellés RBAC — verticale Garage / Automobile.
 * Niveau 100 = Propriétaire du garage (PAS le super admin MCC).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / Gérant',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice) Technique',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable Atelier / Chef d\'Équipe',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef Mécanicien / Technicien Senior',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Sous-Chef d\'Atelier',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Secrétaire de Direction',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Expert Carrosserie / Électronicien',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Mécanicien Confirmé(e)',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Conseiller(ère) Commercial(e)',
    [PERMISSION_ROLE_LEVELS.barman]:        'Mécanicien(ne)',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) d\'Accueil / Réceptionniste',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Technicien(ne) Automobile',
    [PERMISSION_ROLE_LEVELS.commis]:        'Aide-Mécanicien / Assistant(e)',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Apprenti(e) / Stagiaire',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Conseiller(ère) Commercial(e)' },
    { value: 'barman',          label: 'Mécanicien(ne)' },
    { value: 'chef_cuisinier',  label: 'Chef Mécanicien' },
    { value: 'cuisinier',       label: 'Technicien(ne)' },
    { value: 'sous_chef',       label: 'Sous-Chef d\'Atelier' },
    { value: 'sommelier',       label: 'Expert Carrosserie' },
    { value: 'chef_rang',       label: 'Mécanicien Confirmé(e)' },
    { value: 'hotesse',         label: 'Réceptionniste' },
    { value: 'commis',          label: 'Aide-Mécanicien' },
    { value: 'plongeur',        label: 'Apprenti(e)' },
    { value: 'manager',         label: 'Responsable Atelier' },
    { value: 'directeur',       label: 'Directeur(trice) Technique' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Propriétaire' },
];

export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / Gérant. Accès total à la gestion du garage : ordres de réparation, facturation, équipe, stock.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice) Technique. Supervision de l\'atelier et de la qualité des interventions.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable Atelier / Chef d\'Équipe. Coordination des interventions et des mécaniciens.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef Mécanicien / Technicien Senior. Expert technique, diagnostics complexes et formations.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Sous-Chef d\'Atelier. Coordination d\'un sous-groupe, révisions et contrôles.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Secrétaire de Direction. Facturation, devis, exports comptables.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Expert Carrosserie / Électronicien. Spécialiste en remise en état carrosserie ou électronique.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Mécanicien Confirmé(e). Interventions en autonomie, tutorat des apprentis.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Conseiller(ère) Commercial(e). Accueil clients, devis et suivi des ordres de réparation.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Mécanicien(ne). Entretien courant, révisions, remplacement de pièces.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) d\'Accueil / Réceptionniste. Gestion des rendez-vous et accueil clientèle.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Technicien(ne) Automobile. Interventions spécifiques (climatisation, géométrie, etc.).',
    [PERMISSION_ROLE_LEVELS.commis]:        'Aide-Mécanicien / Assistant(e). Assistance sur les interventions sous supervision.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Apprenti(e) / Stagiaire. Formation aux métiers de la mécanique automobile.',
};

export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.4 },
    { level: PERMISSION_ROLE_LEVELS.sous_chef,       weight: 1.3 },
    { level: PERMISSION_ROLE_LEVELS.sommelier,       weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.1 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.barman,          weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.9 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.7 },
    { level: PERMISSION_ROLE_LEVELS.commis,          weight: 0.5 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.3 },
];
