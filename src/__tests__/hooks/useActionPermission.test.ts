import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import React from 'react';

import { useActionPermission } from '@/shared/hooks/useActionPermission';
import { NexusCoreContext } from '@/shared/providers/NexusCoreContext';
import type { PermissionRole } from '@nexus/contracts/permissions.types';

// Mock policyEngine — évite des effets de bord lors du chargement du module compliance
vi.mock('@/modules/compliance', () => ({
    policyEngine: { check: vi.fn(() => ({ allowed: true })) },
    useQuality: vi.fn(() => ({ alerts: [] })),
}));

/** Wrapper qui injecte un utilisateur factice dans NexusCoreContext */
const getWrapper = (role: PermissionRole | null) => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
        const value = {
            auth: { currentUser: role ? { id: 'u1', role, tenantId: 't1' } : null },
            settings: {} as any,
            notif: {} as any,
            lang: 'fr' as any,
            tenant: { activeTenantId: 't1' } as any,
            ui: {} as any,
            fleet: {} as any,
        } as any;
        return React.createElement(NexusCoreContext.Provider, { value }, children);
    };
};

describe('useActionPermission', () => {
    it('action non déclarée : fail-open (tout utilisateur auth)', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'unknown_action'),
            { wrapper: getWrapper('serveur') }
        );
        expect(result.current.allowed).toBe(true);
    });

    it('refuse si non authentifié', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'refund'),
            { wrapper: getWrapper(null) }
        );
        expect(result.current.allowed).toBe(false);
        expect(result.current.reason).toContain('authentifié');
    });

    it('manager peut rembourser (requiresPin = true)', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'refund'),
            { wrapper: getWrapper('manager') }
        );
        expect(result.current.allowed).toBe(true);
        expect(result.current.requiresPin).toBe(true);
    });

    it('serveur ne peut pas rembourser', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'refund'),
            { wrapper: getWrapper('serveur') }
        );
        expect(result.current.allowed).toBe(false);
        expect(result.current.reason).toContain('Niveau insuffisant');
    });

    it('chef_rang peut appliquer une remise (requiresPin = false)', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'apply_discount_percent'),
            { wrapper: getWrapper('chef_rang') }
        );
        expect(result.current.allowed).toBe(true);
        expect(result.current.requiresPin).toBe(false);
    });

    it('serveur ne peut pas appliquer une remise', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'apply_discount_percent'),
            { wrapper: getWrapper('serveur') }
        );
        expect(result.current.allowed).toBe(false);
    });

    it('directeur hérite des droits manager (niveau supérieur)', () => {
        const { result } = renderHook(
            () => useActionPermission('pos', 'refund'),
            { wrapper: getWrapper('directeur') }
        );
        expect(result.current.allowed).toBe(true);
        expect(result.current.requiresPin).toBe(true);
    });
});
