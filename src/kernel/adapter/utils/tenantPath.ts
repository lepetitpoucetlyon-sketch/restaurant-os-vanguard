const SUZERAIN_IDS = new Set(['restaurant-os', 'main']);

/**
 * Check if tenant ID is a suzerain/platform master tenant.
 */
export const isSuzerainTenant = (id: string | null | undefined): boolean => {
    if (!id) return false;
    return SUZERAIN_IDS.has(id);
};

/**
 * Builds a tenant-scoped path or a global path for suzerain tenants.
 */
export function buildTenantPath(tenantId: string | null | undefined, ...segments: string[]): string {
    const path = segments.filter(Boolean).join('/');
    if (!tenantId || isSuzerainTenant(tenantId)) return path;
    return `tenants/${tenantId}/${path}`;
}
