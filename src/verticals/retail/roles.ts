import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'retail';

export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]:     'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:       'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:         'Responsable Magasin',
    [PERMISSION_ROLE_LEVELS.comptable]:       'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:       'Responsable Rayon',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]:  'Chef Caissier',
    [PERMISSION_ROLE_LEVELS.serveur]:         'Vendeur(se)',
    [PERMISSION_ROLE_LEVELS.cuisinier]:       'Magasinier / Hôte(sse) caisse',
    [PERMISSION_ROLE_LEVELS.hotesse]:         'Assistant(e) vente',
    [PERMISSION_ROLE_LEVELS.plongeur]:        'Employé(e) polyvalent',
};

export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'seller',           label: 'Vendeur(se)' },
    { value: 'cashier',          label: 'Hôte(sse) caisse' },
    { value: 'stock_keeper',     label: 'Magasinier' },
    { value: 'section_manager',  label: 'Responsable rayon' },
    { value: 'head_cashier',     label: 'Chef caissier' },
    { value: 'store_manager',    label: 'Responsable magasin' },
    { value: 'manager',          label: 'Directeur' },
    { value: 'admin',            label: 'Administrateur' },
];

export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.1 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.8 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.7 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.5 },
];
