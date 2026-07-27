import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useActionPermission } from '@/shared/hooks/useActionPermission';

const mockUseAuth = vi.fn();

vi.mock('@/shared/providers/NexusCoreProvider', () => ({
  useAuth: () => mockUseAuth(),
}));

describe('useActionPermission', () => {
  it('allows access to unknown actions', () => {
    mockUseAuth.mockReturnValue({ currentUser: { role: 'serveur' } });
    const { result } = renderHook(() => useActionPermission('pos', 'unknown_action'));
    expect(result.current.allowed).toBe(true);
  });

  it('denies access if user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('authentifié');
  });

  it('allows manager to refund (requiresPin = true)', () => {
    mockUseAuth.mockReturnValue({ currentUser: { role: 'manager' } });
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(true);
  });

  it('denies serveur to refund', () => {
    mockUseAuth.mockReturnValue({ currentUser: { role: 'serveur' } });
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(false);
    expect(result.current.reason).toContain('Niveau insuffisant');
  });

  it('allows chef_rang to apply discount (requiresPin = false)', () => {
    mockUseAuth.mockReturnValue({ currentUser: { role: 'chef_rang' } });
    const { result } = renderHook(() => useActionPermission('pos', 'apply_discount_percent'));
    expect(result.current.allowed).toBe(true);
    expect(result.current.requiresPin).toBe(false);
  });

  it('denies serveur to apply discount', () => {
    mockUseAuth.mockReturnValue({ currentUser: { role: 'serveur' } });
    const { result } = renderHook(() => useActionPermission('pos', 'apply_discount_percent'));
    expect(result.current.allowed).toBe(false);
  });

  it('allows super_admin to do manager actions', () => {
    mockUseAuth.mockReturnValue({ currentUser: { role: 'super_admin' } });
    const { result } = renderHook(() => useActionPermission('pos', 'refund'));
    expect(result.current.allowed).toBe(true);
  });
});
