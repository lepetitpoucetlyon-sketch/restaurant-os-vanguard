import { describe, it, expect } from 'vitest';
import { isSuzerainTenant, buildTenantPath } from '@/lib/nexus/utils/tenantPath';

describe('tenantPath utilities', () => {
    describe('isSuzerainTenant', () => {
        it('returns true for restaurant-os and main', () => {
            expect(isSuzerainTenant('restaurant-os')).toBe(true);
            expect(isSuzerainTenant('main')).toBe(true);
        });

        it('returns false for regular tenant IDs or empty inputs', () => {
            expect(isSuzerainTenant('bistroduport')).toBe(false);
            expect(isSuzerainTenant('garage-1')).toBe(false);
            expect(isSuzerainTenant('')).toBe(false);
            expect(isSuzerainTenant(null)).toBe(false);
            expect(isSuzerainTenant(undefined)).toBe(false);
        });
    });

    describe('buildTenantPath', () => {
        it('returns unscoped path for suzerain tenants', () => {
            expect(buildTenantPath('restaurant-os', 'ingredients')).toBe('ingredients');
            expect(buildTenantPath('main', 'nonConformities', 'nc-123')).toBe('nonConformities/nc-123');
        });

        it('returns unscoped path if tenantId is missing or empty', () => {
            expect(buildTenantPath('', 'ingredients')).toBe('ingredients');
            expect(buildTenantPath(null, 'cleaningRecords')).toBe('cleaningRecords');
        });

        it('returns tenant-scoped path for normal tenants', () => {
            expect(buildTenantPath('bistroduport', 'ingredients')).toBe('tenants/bistroduport/ingredients');
            expect(buildTenantPath('garage-42', 'nonConformities', 'nc-99')).toBe('tenants/garage-42/nonConformities/nc-99');
        });
    });
});
