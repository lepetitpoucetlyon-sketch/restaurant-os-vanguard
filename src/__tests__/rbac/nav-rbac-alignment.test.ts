import { describe, it, expect } from 'vitest';
import { NAV_SECTIONS, filterByRole, filterNavSections } from '@/config/navConfig';
import { PERMISSION_ROLE_LEVELS, PermissionRole } from '@/kernel/contracts/rbac';
import { DEFAULT_PAGE_ACCESS } from '@/shared/schemas/rbac.schemas';

describe('Alignement Navigation vs DEFAULT_PAGE_ACCESS (Loi 8 & 12)', () => {
    const roles: PermissionRole[] = [
        'plongeur',
        'hotesse',
        'cuisinier',
        'barman',
        'serveur',
        'chef_cuisinier',
        'chef_rang',
        'comptable',
        'manager',
        'directeur',
        'admin',
    ];

    it('aucun rôle ne voit dans la navigation un lien menant à AccessDenied', () => {
        const tenantSections = filterNavSections(NAV_SECTIONS, 'tenant');
        const violations: Array<{ role: string; label: string; href: string }> = [];

        for (const role of roles) {
            const level = PERMISSION_ROLE_LEVELS[role];
            const visibleSections = filterByRole(tenantSections, level, role);

            for (const section of visibleSections) {
                for (const item of section.items) {
                    const cleanRoute = item.href
                        .split('?')[0]
                        .replace(/^\//, '')
                        .replace(/-/g, '_');

                    const allowedRoles = DEFAULT_PAGE_ACCESS[cleanRoute];
                    if (allowedRoles && !allowedRoles.includes(role)) {
                        violations.push({
                            role,
                            label: item.label,
                            href: item.href,
                        });
                    }
                }
            }
        }

        expect(violations).toEqual([]);
    });
});
