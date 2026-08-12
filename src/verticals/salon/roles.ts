import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'salon';

export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]:     'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:       'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:         'Manager',
    [PERMISSION_ROLE_LEVELS.comptable]:       'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:       'Responsable Salon',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:  'Senior Styliste',
    [PERMISSION_ROLE_LEVELS.serveur]:         'Styliste',
    [PERMISSION_ROLE_LEVELS.cuisinier]:       'Coloriste / Coiffeur(se)',
    [PERMISSION_ROLE_LEVELS.hotesse]:         'Assistant(e)',
    [PERMISSION_ROLE_LEVELS.plongeur]:        'Apprenti(e)',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'stylist',          label: 'Styliste' },
    { value: 'senior_stylist',   label: 'Senior Styliste' },
    { value: 'colorist',         label: 'Coloriste' },
    { value: 'assistant',        label: 'Assistant(e)' },
    { value: 'receptionist',     label: 'Réceptionniste' },
    { value: 'salon_manager',    label: 'Responsable salon' },
    { value: 'manager',          label: 'Directeur' },
    { value: 'admin',            label: 'Administrateur' },
];

export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.3 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.1 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.9 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.7 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.5 },
];
