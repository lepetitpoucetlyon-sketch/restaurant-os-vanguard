import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'clinic';

/**
 * ⚠️ Clinic verrouillée tant que §8.2 PII + §7.6 RGPD art. 9 ne sont pas
 * complètement traités (données de santé dans ServiceSubject).
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]:     'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:       'Directeur Médical',
    [PERMISSION_ROLE_LEVELS.manager]:         'Médecin Responsable',
    [PERMISSION_ROLE_LEVELS.comptable]:       'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:       'Infirmier(ère) en Chef',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:  'Praticien Senior',
    [PERMISSION_ROLE_LEVELS.serveur]:         'Praticien / Infirmier(ère)',
    [PERMISSION_ROLE_LEVELS.cuisinier]:       'Aide-soignant(e)',
    [PERMISSION_ROLE_LEVELS.hotesse]:         'Secrétaire Médicale',
    [PERMISSION_ROLE_LEVELS.plongeur]:        'Stagiaire',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'practitioner',   label: 'Praticien / Médecin' },
    { value: 'nurse',          label: 'Infirmier(ère)' },
    { value: 'care_assistant', label: 'Aide-soignant(e)' },
    { value: 'secretary',      label: 'Secrétaire médicale' },
    { value: 'senior_doctor',  label: 'Praticien senior' },
    { value: 'head_nurse',     label: 'Infirmier(ère) en chef' },
    { value: 'manager',        label: 'Directeur médical' },
    { value: 'admin',          label: 'Administrateur' },
];

export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.3 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.8 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.7 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.5 },
];
