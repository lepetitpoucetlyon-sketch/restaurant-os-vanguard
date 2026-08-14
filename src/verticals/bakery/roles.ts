import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'bakery';

/**
 * Libellés RBAC — verticale Boulangerie / Pâtisserie.
 * Niveau 100 = Propriétaire de la boulangerie (PAS le super admin MCC).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / Maître Boulanger',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice)',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable de Boutique',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef Pâtissier / Chef Boulanger',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Second Pâtissier / Second Boulanger',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Chocolatier / Spécialiste Confiserie',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Pâtissier Confirmé(e)',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Vendeur(se)',
    [PERMISSION_ROLE_LEVELS.barman]:        'Boulanger(ère)',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) de Boutique',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Tourier(ère) / Viennoisier(ère)',
    [PERMISSION_ROLE_LEVELS.commis]:        'Commis Pâtissier',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Apprenti(e)',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Vendeur(se)' },
    { value: 'barman',          label: 'Boulanger(ère)' },
    { value: 'chef_cuisinier',  label: 'Chef Pâtissier' },
    { value: 'cuisinier',       label: 'Tourier(ère)' },
    { value: 'sous_chef',       label: 'Second Pâtissier' },
    { value: 'sommelier',       label: 'Chocolatier' },
    { value: 'chef_rang',       label: 'Pâtissier Confirmé(e)' },
    { value: 'hotesse',         label: 'Hôte(sse) de Boutique' },
    { value: 'commis',          label: 'Commis Pâtissier' },
    { value: 'plongeur',        label: 'Apprenti(e)' },
    { value: 'manager',         label: 'Responsable de Boutique' },
    { value: 'directeur',       label: 'Directeur(trice)' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Propriétaire' },
];

export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Maître Boulanger / Propriétaire. Accès total à la gestion de la boulangerie : production, ventes, finances, équipe.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice). Supervise l\'ensemble de l\'établissement et des équipes.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable de Boutique. Gère les ventes, les plannings et les stocks.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Chef Pâtissier / Chef Boulanger. Responsable de la création et de la production.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Second Pâtissier. Seconde le chef et gère un ou plusieurs postes de production.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable. Accès aux données de caisse, marges et exports comptables.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Chocolatier / Spécialiste Confiserie. Expert en produits de luxe et confiserie fine.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Pâtissier Confirmé(e). Autonome sur son poste, gère ses recettes et son planning.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Vendeur(se). Conseil clientèle, vente et encaissement en boutique.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Boulanger(ère). Production quotidienne de pains et viennoiseries.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) de Boutique. Accueil client, vitrine et caisse.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Tourier(ère). Spécialiste des pâtes feuilletées et travaux de façonnage.',
    [PERMISSION_ROLE_LEVELS.commis]:        'Commis Pâtissier. Assistance à la production sous supervision du chef.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Apprenti(e). En formation alternance, découverte des métiers de la boulangerie.',
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
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.4 },
];
