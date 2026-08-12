import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'bakery';

export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]:     'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:       'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:         'Responsable',
    [PERMISSION_ROLE_LEVELS.comptable]:       'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:       'Responsable de Production',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:  'Chef Boulanger / Pâtissier',
    [PERMISSION_ROLE_LEVELS.serveur]:         'Vendeur(se)',
    [PERMISSION_ROLE_LEVELS.cuisinier]:       'Boulanger / Pâtissier',
    [PERMISSION_ROLE_LEVELS.hotesse]:         'Assistant(e) Vente',
    [PERMISSION_ROLE_LEVELS.plongeur]:        'Apprenti(e)',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'seller',           label: 'Vendeur(se)' },
    { value: 'baker',            label: 'Boulanger' },
    { value: 'pastry_chef',      label: 'Pâtissier' },
    { value: 'production_head',  label: 'Responsable production' },
    { value: 'cashier',          label: 'Caissier(ère)' },
    { value: 'manager',          label: 'Responsable' },
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
