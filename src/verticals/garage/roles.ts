import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'garage';

export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]:     'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:       'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:         'Chef d\'Atelier',
    [PERMISSION_ROLE_LEVELS.comptable]:       'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:       'Réceptionnaire Senior',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:  'Chef Technicien',
    [PERMISSION_ROLE_LEVELS.serveur]:         'Technicien',
    [PERMISSION_ROLE_LEVELS.cuisinier]:       'Mécanicien / Carrossier',
    [PERMISSION_ROLE_LEVELS.hotesse]:         'Magasinier / Accueil',
    [PERMISSION_ROLE_LEVELS.plongeur]:        'Apprenti',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'technician',       label: 'Technicien' },
    { value: 'mechanic',         label: 'Mécanicien' },
    { value: 'body_repair',      label: 'Carrossier' },
    { value: 'receptionist',     label: 'Réceptionnaire' },
    { value: 'parts_manager',    label: 'Magasinier Pièces' },
    { value: 'workshop_manager', label: 'Chef d\'Atelier' },
    { value: 'accountant',       label: 'Comptable' },
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
