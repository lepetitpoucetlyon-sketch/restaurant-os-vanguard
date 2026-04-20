import { lepetitpoucetConfig } from './lepetitpoucet';
import { bistrolyonConfig } from './bistrolyon';
import { urbanburgerConfig } from './urbanburger';
import { TenantConfig } from '@/types';

const tenantRegistry: Record<string, TenantConfig> = {
    'lepetitpoucet': lepetitpoucetConfig,
    'bistrolyon': bistrolyonConfig,
    'urbanburger': urbanburgerConfig,
};

/**
 * Charge dynamiquement la configuration d'une instance.
 * @param tenantId L'identifiant de l'instance
 * @returns TenantConfig ou null si l'instance n'existe pas
 */
export function getTenantConfig(tenantId: string): TenantConfig | null {
    return tenantRegistry[tenantId] || null;
}

export function getAllTenants(): TenantConfig[] {
    return Object.values(tenantRegistry);
}

export * from '@/types';
