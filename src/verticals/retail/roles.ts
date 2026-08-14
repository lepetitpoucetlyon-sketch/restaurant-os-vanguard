import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'retail';

/**
 * Libellés RBAC — verticale Commerce de Détail / Retail.
 * Niveau 100 = Propriétaire du commerce (PAS le super admin MCC).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / Gérant',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice) de Magasin',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable Rayon / Chef de Secteur',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Responsable Achats / Category Manager',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Adjoint(e) au Responsable',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Contrôleur de Gestion',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Expert Produit / Conseiller Technique',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Chef d\'Équipe Vente',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Vendeur(se) Conseil',
    [PERMISSION_ROLE_LEVELS.barman]:        'Vendeur(se)',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) de Caisse',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Employé(e) Libre-Service',
    [PERMISSION_ROLE_LEVELS.commis]:        'Assistant(e) Vente',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Stagiaire / Apprenti(e)',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Vendeur(se) Conseil' },
    { value: 'barman',          label: 'Vendeur(se)' },
    { value: 'chef_cuisinier',  label: 'Responsable Achats' },
    { value: 'cuisinier',       label: 'Employé(e) Libre-Service' },
    { value: 'sous_chef',       label: 'Adjoint(e) Responsable' },
    { value: 'sommelier',       label: 'Expert Produit' },
    { value: 'chef_rang',       label: 'Chef d\'Équipe' },
    { value: 'hotesse',         label: 'Hôte(sse) de Caisse' },
    { value: 'commis',          label: 'Assistant(e) Vente' },
    { value: 'plongeur',        label: 'Stagiaire' },
    { value: 'manager',         label: 'Responsable Rayon' },
    { value: 'directeur',       label: 'Directeur(trice)' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Propriétaire' },
];

export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Propriétaire / Gérant. Accès total à la gestion du commerce : achats, ventes, personnel, comptabilité.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice) de Magasin. Pilote les performances et l\'ensemble des équipes.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable Rayon / Chef de Secteur. Gère son rayon, les stocks et les plannings.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Responsable Achats. Référencement produits, négociation fournisseurs, assortiment.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Adjoint(e) au Responsable. Supplée le manager, gère les incidents et les retours.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Contrôleur. Tableaux de bord financiers, caisse, exports comptables.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Expert Produit / Conseiller Technique. Expert reconnu sur une famille de produits.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Chef d\'Équipe Vente. Encadre les vendeurs et coordonne le service client.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Vendeur(se) Conseil. Accompagnement client, démonstration produit, encaissement.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Vendeur(se). Tenue du rayon, mise en rayon, vente.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Hôte(sse) de Caisse. Encaissement, accueil, traitement des retours.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Employé(e) Libre-Service. Mise en rayon, facing, gestion des DLC.',
    [PERMISSION_ROLE_LEVELS.commis]:        'Assistant(e) Vente. Renfort rayon sous supervision du vendeur confirmé.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Stagiaire / Apprenti(e). Découverte du métier du commerce de détail.',
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
    { level: PERMISSION_ROLE_LEVELS.commis,          weight: 0.5 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.3 },
];
