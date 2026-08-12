import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';

import { useActionPermission } from '@/kernel/hooks/useActionPermission';
import { NexusCoreContext } from '@/kernel/providers/NexusCoreContext';
import type { PermissionRole } from '@nexus/contracts/permissions.types';

describe('useActionPermission', () => {
  const getWrapper = (role: PermissionRole | null) => {
    return function Wrapper({ children }: { children: React.ReactNode }) {
      return React.createElement(NexusCoreContext.Provider, {
        value: {
          auth: { currentUser: role ? { role } : null, verifyPermissionAction: vi.fn() } as any,
          settings: {} as any,
          notif: {} as any,
          lang: 'fr'
        } as any
      }, children);
    };
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access to unknown actions', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'unknown_action'), { wrapper: getWrapper('serveur') });
    expect(result.current.allowed).toBe(true);
  });

  it('denies access if user is not authenticated', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'refund'), { wrapper: getWrapper(null) });
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('authentifié');
  });

  it('allows manager to refund (requiresPin = true)', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'refund'), { wrapper: getWrapper('manager') });
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(true);
  });

  it('denies serveur to refund', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'refund'), { wrapper: getWrapper('serveur') });
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('Niveau insuffisant');
  });

  it('allows chef_rang to apply discount (requiresPin = false)', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'apply_discount_percent'), { wrapper: getWrapper('chef_rang') });
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(false);
  });

  it('denies serveur to apply discount', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'apply_discount_percent'), { wrapper: getWrapper('serveur') });
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('Niveau insuffisant');
  });

  it('allows super_admin to do manager actions', () => {
    const { result } = renderHook(() => useActionPermission('pos', 'refund'), { wrapper: getWrapper('super_admin') });
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(true);
  });
});
