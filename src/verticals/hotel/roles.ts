import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'hotel';

export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]:     'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:       'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:         'Manager',
    [PERMISSION_ROLE_LEVELS.comptable]:       'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:       'Chef de Réception',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:  'Chef de Cuisine',
    [PERMISSION_ROLE_LEVELS.serveur]:         'Réceptionniste',
    [PERMISSION_ROLE_LEVELS.cuisinier]:       'Cuisinier / Barman',
    [PERMISSION_ROLE_LEVELS.hotesse]:         'Concierge / Hôte(sse)',
    [PERMISSION_ROLE_LEVELS.plongeur]:        'Valet / Femme de chambre',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'receptionist',   label: 'Réceptionniste' },
    { value: 'concierge',      label: 'Concierge' },
    { value: 'housekeeping',   label: 'Femme de chambre' },
    { value: 'bellboy',        label: 'Valet' },
    { value: 'kitchen_chef',   label: 'Chef de cuisine' },
    { value: 'bartender',      label: 'Barman / Barmaid' },
    { value: 'front_manager',  label: 'Chef de réception' },
    { value: 'manager',        label: 'Directeur' },
    { value: 'admin',          label: 'Administrateur' },
];

export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.3 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.9 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.8 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.6 },
];
