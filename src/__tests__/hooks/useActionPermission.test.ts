import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useActionPermission } from '@/shared/hooks/useActionPermission';

import * as NexusCoreProvider from '@/shared/providers/NexusCoreProvider';

// Removed vi.mock in favor of spyOn

describe('useActionPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access to unknown actions', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: { role: 'serveur' } } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'unknown_action'));
    expect(result.current.allowed).toBe(true);
  });

  it('denies access if user is not authenticated', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: null } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('authentifié');
  });

  it('allows manager to refund (requiresPin = true)', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: { role: 'manager' } } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(true);
  });

  it('denies serveur to refund', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: { role: 'serveur' } } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('Niveau insuffisant');
  });

  it('allows chef_rang to apply discount (requiresPin = false)', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: { role: 'chef_rang' } } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'apply_discount_percent'));
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(false);
  });

  it('denies serveur to apply discount', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: { role: 'serveur' } } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'apply_discount_percent'));
    expect(result.current.allowed).toBe(false);
  });

  it('allows super_admin to do manager actions', () => {
    vi.spyOn(NexusCoreProvider, 'useAuth').mockReturnValue({ currentUser: { role: 'super_admin' } } as any);
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(true);
  });
});
