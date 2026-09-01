import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCashDrawer } from '@/modules/ops/service/restaurant/pos/hooks/useCashDrawer';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { empireAudit } from '@/lib/audit';

describe('V3-POS-08: Cash Drawer & End-of-Day Reconciliation Flow (Microunits)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('maintains exact microunits balance across SKIM, DROP and SALE transactions', () => {
    const { result } = renderHook(() =>
      useCashDrawer('drawer-01', 'tenant-alpha', 'op-manager', 'directeur', 100_000_000) // 100 €
    );

    expect(result.current.expectedAmountInMicrounits).toBe(100_000_000);

    // Dépôt de 50 €
    act(() => {
      result.current.openCounter('DROP');
    });
    act(() => {
      result.current.handleValidateCount(50_000_000, 0);
    });
    expect(result.current.expectedAmountInMicrounits).toBe(150_000_000);

    // Prélèvement de 30 €
    act(() => {
      result.current.openCounter('SKIM');
    });
    act(() => {
      result.current.handleValidateCount(30_000_000, 0);
    });
    expect(result.current.expectedAmountInMicrounits).toBe(120_000_000);
  });

  it('logs high severity audit on significant cash discrepancy (> 5 €)', async () => {
    const auditSpy = vi.spyOn(empireAudit, 'log');

    const { result } = renderHook(() =>
      useCashDrawer('drawer-01', 'tenant-alpha', 'op-manager', 'directeur', 150_000_000)
    );

    act(() => {
      result.current.openCounter('EOD_CLOSE');
    });

    // Counted 140 € instead of 150 € (discrepancy = -10 € = -10_000_000 µ)
    await act(async () => {
      await result.current.handleValidateCount(140_000_000, -10_000_000);
    });

    expect(auditSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'finance',
        action: 'CASH_DRAWER_COUNTED',
        severity: 'high',
      })
    );
  });

  it('emits cash_drawer.opened_unauthorized durable event on security alert', async () => {
    const emitSpy = vi.spyOn(NexusEventBus, 'emitDurable').mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      useCashDrawer('drawer-01', 'tenant-alpha', 'op-manager', 'directeur')
    );

    await act(async () => {
      await result.current.triggerUnauthorizedOpen();
    });

    expect(emitSpy).toHaveBeenCalledWith(
      'cash_drawer.opened_unauthorized',
      expect.objectContaining({
        drawerId: 'drawer-01',
        operatorId: 'op-manager',
        tenantId: 'tenant-alpha',
      })
    );
  });
});
