import { lepetitpoucetConfig } from './lepetitpoucet';
import { bistrolyonConfig } from './bistrolyon';
import { urbanburgerConfig } from './urbanburger';
import { TenantConfig } from '@nexus/contracts';

const tenantRegistry: Record<string, TenantConfig> = {
    'lepetitpoucet': lepetitpoucetConfig,
    'bistrolyon': bistrolyonConfig,
    'urbanburger': urbanburgerConfig,
};

/**
 * Charge la configuration d'une instance.
 * Lookup statique d'abord, puis fallback Firestore pour les tenants dynamiques.
 */
export function getTenantConfig(tenantId: string): TenantConfig | null {
    return tenantRegistry[tenantId] || null;
}

/**
 * Version async — lookup statique puis fallback Firestore.
 * À utiliser côté serveur ou dans les Server Components.
 */
export async function getTenantConfigAsync(tenantId: string): Promise<TenantConfig | null> {
    const static_ = tenantRegistry[tenantId];
    if (static_) return static_;

    try {
        const { Nexus } = await import('@/lib/nexus/NexusAdapter');
        const doc = await Nexus.adapter.get<TenantConfig>(`tenants/${tenantId}/tenantConfig`);
        return doc ?? null;
    } catch {
        return null;
    }
}

export function getAllTenants(): TenantConfig[] {
    return Object.values(tenantRegistry);
}

export * from '@nexus/contracts';
