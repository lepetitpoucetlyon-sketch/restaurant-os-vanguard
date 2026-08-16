import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KDSPacingEngine } from './KDSPacingEngine';
import { empireAudit } from '@/lib/audit';

describe('⏱️ KDSPacingEngine — Flow Rate Pacing & Régulation Surchauffe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 'tenant_rush_lyon';

  it('devrait maintenir le flux normal si le retard moyen est <= 20 minutes', () => {
    const status = KDSPacingEngine.evaluatePacing(tenantId, 12);

    expect(status.isThrottled).toBe(false);
    expect(status.averageDelayMinutes).toBe(12);
    expect(status.maxOrdersPerWindow).toBe(50);
    expect(status.throttleDurationSeconds).toBe(0);
  });

  it('devrait activer le bridage automatique si le retard moyen dépasse 20 minutes', () => {
    const spyAudit = vi.spyOn(empireAudit, 'log');

    const status = KDSPacingEngine.evaluatePacing(tenantId, 25);

    expect(status.isThrottled).toBe(true);
    expect(status.averageDelayMinutes).toBe(25);
    expect(status.maxOrdersPerWindow).toBe(5);
    expect(status.throttleDurationSeconds).toBe(600);

    expect(spyAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        module: 'ops',
        action: 'KDS_PACING_THROTTLE_ACTIVATED',
        severity: 'high',
        details: expect.objectContaining({
          tenantId,
          averageKDSDelayMinutes: 25,
          maxOrdersPerWindow: 5,
        }),
      })
    );
  });
});
