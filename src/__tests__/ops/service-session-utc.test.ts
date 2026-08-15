import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServiceSessionService } from '@/modules/ops/workflow/engine/services/ServiceSessionService';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('Invariant #4 : Isolation Temporelle UTC Absolue (Anti-DST) & Sessions de Service', () => {

  beforeEach(async () => {
    vi.clearAllMocks();
    await Nexus.adapter.delete('tenants/brasserie-empire/activeServiceSession');
  });

  it('devrait calculer la durée exacte d un shift en UTC absolu sans distorsion DST (heure d été)', () => {
    // Cas critique : Shift pendant la nuit du changement d'heure
    const startUtc = '2026-03-29T21:00:00.000Z';
    const endUtc = '2026-03-30T04:30:00.000Z'; // 7h30 de travail réelles

    const result = ServiceSessionService.calculateShiftDurationUtc(startUtc, endUtc);

    expect(result.durationMs).toBe(7.5 * 60 * 60 * 1000);
    expect(result.decimalHours).toBe(7.5);
    expect(result.formatted).toBe('7h 30m');
  });

  it('devrait rattacher une commande nocturne passée à 02h30 du matin à la date métier de la veille', () => {
    // 16 Août à 02h30 UTC (service du 15 Août au soir)
    const nightOrderTime = new Date('2026-08-16T02:30:00.000Z').getTime();
    const businessDate = ServiceSessionService.getComputedBusinessDate(nightOrderTime);

    expect(businessDate).toBe('2026-08-15');
  });

  it('devrait gérer le cycle complet d une session de service (Open -> Get Active -> Close)', async () => {
    const tenantId = 'brasserie-empire';

    // 1. Ouverture de session
    const session = await ServiceSessionService.openSession(
      tenantId,
      'dinner',
      'manager-lucas',
      '2026-08-15'
    );

    expect(session.status).toBe('OPEN');
    expect(session.serviceType).toBe('dinner');
    expect(session.businessDate).toBe('2026-08-15');

    // 2. Récupération session active
    const active = await ServiceSessionService.getActiveSession(tenantId);
    expect(active).not.toBeNull();
    expect(active?.id).toBe(session.id);

    // 3. Clôture de session
    const closed = await ServiceSessionService.closeSession(tenantId, session.id, 'manager-lucas', {
      ordersCount: 42,
      totalRevenueInMicrounits: 1540000000,
    });

    expect(closed.status).toBe('CLOSED');
    expect(closed.ordersCount).toBe(42);

    // La session active ne doit plus exister
    const activeAfterClose = await ServiceSessionService.getActiveSession(tenantId);
    expect(activeAfterClose).toBeNull();
  });
});
