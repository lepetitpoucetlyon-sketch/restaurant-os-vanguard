import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUnsavedChanges } from '@/shared/hooks/useUnsavedChanges';

describe('useUnsavedChanges Hook', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('adds beforeunload event listener when isDirty is true', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useUnsavedChanges({ isDirty: true }));

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));

    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('does not add beforeunload listener when isDirty is false', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

    renderHook(() => useUnsavedChanges({ isDirty: false }));

    expect(addEventListenerSpy).not.toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('confirmNavigation returns true directly when isDirty is false', () => {
    const confirmSpy = vi.spyOn(window, 'confirm');

    const { result } = renderHook(() => useUnsavedChanges({ isDirty: false }));

    const allowed = result.current.confirmNavigation();
    expect(allowed).toBe(true);
    expect(confirmSpy).not.toHaveBeenCalled();
  });

  it('confirmNavigation asks user confirmation when isDirty is true', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const { result } = renderHook(() => useUnsavedChanges({ isDirty: true }));

    const allowed = result.current.confirmNavigation();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(allowed).toBe(true);
  });
});
