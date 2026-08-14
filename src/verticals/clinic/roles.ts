import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'clinic';

/**
 * Libellés RBAC — verticale Clinique / Cabinet Médical.
 * Niveau 100 = Propriétaire / Médecin Chef (PAS le super admin MCC).
 *
 * Note : la hiérarchie médicale ne change pas les niveaux numériques —
 * seuls les libellés diffèrent. Les accès aux données médicales sont
 * gérés au niveau applicatif (HACCP/registre → dossiers patients).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Médecin Chef / Propriétaire',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice) Médical(e)',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable Administratif',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Médecin Spécialiste',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Médecin Généraliste',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Contrôleur de Gestion',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Infirmier(ère) Coordinateur',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Infirmier(ère) Diplômé(e)',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Assistant(e) Médical(e)',
    [PERMISSION_ROLE_LEVELS.barman]:        'Aide-Soignant(e)',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Secrétaire Médicale / Accueil',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Technicien(ne) de Santé',
    [PERMISSION_ROLE_LEVELS.commis]:        'Agent de Service',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Stagiaire / Étudiant(e)',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'serveur',         label: 'Assistant(e) Médical(e)' },
    { value: 'barman',          label: 'Aide-Soignant(e)' },
    { value: 'chef_cuisinier',  label: 'Médecin Spécialiste' },
    { value: 'cuisinier',       label: 'Technicien(ne) de Santé' },
    { value: 'sous_chef',       label: 'Médecin Généraliste' },
    { value: 'sommelier',       label: 'Infirmier(ère) Coordinateur' },
    { value: 'chef_rang',       label: 'Infirmier(ère) Diplômé(e)' },
    { value: 'hotesse',         label: 'Secrétaire Médicale' },
    { value: 'commis',          label: 'Agent de Service' },
    { value: 'plongeur',        label: 'Étudiant(e) / Stagiaire' },
    { value: 'manager',         label: 'Responsable Administratif' },
    { value: 'directeur',       label: 'Directeur(trice) Médical(e)' },
    { value: 'comptable',       label: 'Comptable' },
    { value: 'proprietaire',    label: 'Médecin Chef' },
];

export const roleDescriptions: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.proprietaire]:  'Médecin Chef / Propriétaire. Accès total à la gestion du cabinet : agenda, équipes, finances, conformité.',
    [PERMISSION_ROLE_LEVELS.directeur]:     'Directeur(trice) Médical(e). Supervise l\'activité médicale et administrative.',
    [PERMISSION_ROLE_LEVELS.manager]:       'Responsable Administratif. Coordination administrative, plannings et ressources.',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:'Médecin Spécialiste. Expertise spécialisée, chef de service, activité complexe.',
    [PERMISSION_ROLE_LEVELS.sous_chef]:     'Médecin Généraliste. Consultations, prescriptions, suivi patient.',
    [PERMISSION_ROLE_LEVELS.comptable]:     'Comptable / Contrôleur. Facturation sécurité sociale, exports comptables.',
    [PERMISSION_ROLE_LEVELS.sommelier]:     'Infirmier(ère) Coordinateur. Coordination des soins, liaison médecin-patient.',
    [PERMISSION_ROLE_LEVELS.chef_rang]:     'Infirmier(ère) Diplômé(e). Soins infirmiers, administration des traitements.',
    [PERMISSION_ROLE_LEVELS.serveur]:       'Assistant(e) Médical(e). Assistance aux praticiens, préparation des consultations.',
    [PERMISSION_ROLE_LEVELS.barman]:        'Aide-Soignant(e). Soins de confort, aide aux déplacements et à l\'hygiène.',
    [PERMISSION_ROLE_LEVELS.hotesse]:       'Secrétaire Médicale. Accueil, prise de RDV, dossiers patients.',
    [PERMISSION_ROLE_LEVELS.cuisinier]:     'Technicien(ne) de Santé. Examens techniques (labo, radio) sur prescription.',
    [PERMISSION_ROLE_LEVELS.commis]:        'Agent de Service. Entretien, stérilisation, logistique du cabinet.',
    [PERMISSION_ROLE_LEVELS.plongeur]:      'Stagiaire / Étudiant(e). Observation et apprentissage en milieu médical.',
};

/** Pas de pourboires en milieu médical — table vide par convention. */
export const tipWeightsByLevel: { level: number; weight: number }[] = [];
