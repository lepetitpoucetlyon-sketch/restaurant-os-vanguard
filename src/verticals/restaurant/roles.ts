import type { PlatformVariant } from '@nexus/contracts';
import { PERMISSION_ROLE_LEVELS } from '@/kernel/nexus/contracts/permissions.types';

export const VERTICAL_ID: PlatformVariant = 'restaurant';

/**
 * Libellés des niveaux RBAC pour la verticale restaurant.
 * Les valeurs numériques de PERMISSION_ROLE_LEVELS sont invariantes —
 * seuls les libellés changent d'une verticale à l'autre.
 */
export const roleLabels: Record<number, string> = {
    [PERMISSION_ROLE_LEVELS.super_admin]: 'Super Administrateur',
    [PERMISSION_ROLE_LEVELS.directeur]:   'Directeur',
    [PERMISSION_ROLE_LEVELS.manager]:     'Manager',
    [PERMISSION_ROLE_LEVELS.comptable]:   'Comptable',
    [PERMISSION_ROLE_LEVELS.chef_rang]:   'Chef de Rang',
    [PERMISSION_ROLE_LEVELS.chef_cuisinier]: 'Chef Cuisinier',
    [PERMISSION_ROLE_LEVELS.serveur]:     'Serveur(se)',
    [PERMISSION_ROLE_LEVELS.cuisinier]:   'Cuisinier / Barman',
    [PERMISSION_ROLE_LEVELS.hotesse]:     'Hôte(sse) d\'accueil',
    [PERMISSION_ROLE_LEVELS.plongeur]:    'Plongeur',
};

/** Suggestions de rôles pour la création rapide d'un membre du personnel. */
export const roleSuggestions: { value: string; label: string }[] = [
    { value: 'server',        label: 'Serveur(se)' },
    { value: 'bartender',     label: 'Barman / Barmaid' },
    { value: 'kitchen_chef',  label: 'Chef de cuisine' },
    { value: 'kitchen_line',  label: 'Cuisinier' },
    { value: 'host',          label: 'Hôte(sse) d\'accueil' },
    { value: 'floor_manager', label: 'Responsable de salle' },
    { value: 'manager',       label: 'Directeur' },
    { value: 'admin',         label: 'Administrateur' },
];

/** Poids de distribution des pourboires par niveau RBAC. */
export const tipWeightsByLevel: { level: number; weight: number }[] = [
    { level: PERMISSION_ROLE_LEVELS.manager,         weight: 1.5 },
    { level: PERMISSION_ROLE_LEVELS.chef_cuisinier,  weight: 1.3 },
    { level: PERMISSION_ROLE_LEVELS.chef_rang,       weight: 1.2 },
    { level: PERMISSION_ROLE_LEVELS.serveur,         weight: 1.0 },
    { level: PERMISSION_ROLE_LEVELS.cuisinier,       weight: 0.9 },
    { level: PERMISSION_ROLE_LEVELS.hotesse,         weight: 0.8 },
    { level: PERMISSION_ROLE_LEVELS.plongeur,        weight: 0.6 },
];
