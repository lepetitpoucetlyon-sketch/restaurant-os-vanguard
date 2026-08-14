import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'salon';

/**
 * Libellés RBAC — verticale Salon de coiffure / beauté.
 * Niveau 100 = Propriétaire du salon (PAS le super admin MCC).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire du Salon',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice)',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable de Salon',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Senior Styliste / Formateur',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Chef d\'Équipe Stylisme',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Expert Coloriste / Conseil',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Styliste Confirmé(e)',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Styliste',
    [PERMISSION_ROLE_LEVELS.barman]:        'Coloriste',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Réceptionniste',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Coiffeur(se)',
    [PERMISSION_ROLE_LEVELS.commis]:        'Assistant(e) Coiffure',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Apprenti(e)',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Styliste' },
    { value: 'barman',          label: 'Coloriste' },
    { value: 'chef_cuisinier',  label: 'Senior Styliste' },
    { value: 'cuisinier',       label: 'Coiffeur(se)' },
    { value: 'sous_chef',       label: 'Chef d\'équipe' },
    { value: 'sommelier',       label: 'Expert Coloriste' },
    { value: 'chef_rang',       label: 'Styliste Confirmé(e)' },
    { value: 'hotesse',         label: 'Réceptionniste' },
    { value: 'commis',          label: 'Assistant(e)' },
    { value: 'plongeur',        label: 'Apprenti(e)' },
    { value: 'manager',         label: 'Responsable de Salon' },
    { value: 'directeur',       label: 'Directeur(trice)' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Propriétaire' },
];

export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire du salon. Accès total à toutes les fonctions : planning, caisse, fidélité, finances.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice). Supervision complète des équipes et de la performance du salon.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable de salon. Gère les plannings, les stocks de produits et les équipes.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Senior Styliste / Formateur. Expert reconnu, forme les équipes et gère les clients complexes.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Chef d\'Équipe Stylisme. Coordonne les postes et assure la qualité de service.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable. Accède aux données de caisse, TVA et exports comptables.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Expert Coloriste / Conseil. Expertise technique couleur, conseil client premium.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Styliste Confirmé(e). Autonome sur sa clientèle, tutorat des junior.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Styliste. Réalise les prestations coupe/coiffure de son portefeuille client.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Coloriste. Spécialisé(e) dans les techniques de coloration.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Réceptionniste. Gère l\'accueil, la prise de RDV et l\'encaissement.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Coiffeur(se). Exécute les prestations de base sous supervision.',
    [PERMISSION_ROLE_LEVELS.commis]:        'Assistant(e) Coiffure. Mise en place, shampooings, assistance à l\'équipe.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Apprenti(e). En formation, accompagne les professionnels confirmés.',
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
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.7 },
    { level: PERMISSION_ROLE_LEVELS.commis,          weight: 0.6 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,         weight: 0.4 },
];
