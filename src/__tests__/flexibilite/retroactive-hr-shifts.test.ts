import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RetroactiveTimeClockService } from '@/modules/human/effectifs/hr/services/RetroactiveTimeClockService';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';

describe('Lot 5 — RH Rétroactif & Pointages Rapprochés (M5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
  });

  it('Pointer le vendredi pour le mardi : isole occurredAt vs recordedAt, rattache à la bonne journée et calcule la durée nette', async () => {
    const store: Record<string, unknown> = {};

    vi.spyOn(Nexus.adapter, 'set').mockImplementation(async (path: string, val: unknown) => {
      store[path] = val;
    });

    let regularizedEvent: unknown = null;
    NexusEventBus.on('hr.shift_regularized', async (payload) => {
      regularizedEvent = payload;
    });

    // Shift réel : Mardi 1er Septembre de 09h00 à 17h00 (avec 45min de pause)
    const shiftStart = '2026-09-01T07:00:00.000Z'; // 09h00 Paris (UTC+2)
    const shiftEnd = '2026-09-01T15:00:00.000Z';   // 17h00 Paris (UTC+2)

    // Régularisation par le manager
    const shift = await RetroactiveTimeClockService.recordRetroactiveShift({
      tenantId: 'bistro-paris',
      employeeId: 'emp-serveur-lucas',
      shiftStartIso: shiftStart,
      shiftEndIso: shiftEnd,
      breakDurationMinutes: 45,
      reason: 'Oubli de badgeage badgeuse en panne',
      managerId: 'mgr-alexandre',
    });

    // Vérifications :
    // 1. Rattachement strict au mardi 2026-09-01
    expect(shift.businessDay).toBe('2026-09-01');

    // 2. Durée nette : 8h = 480 min - 45 min pause = 435 minutes
    expect(shift.durationMinutes).toBe(435);

    // 3. Détection de rétroactivité (écart > 12h)
    expect(shift.isRetroactive).toBe(true);
    expect(shift.approvedByManagerId).toBe('mgr-alexandre');

    // 4. Persistence des pointages dans la collection du jour réel
    expect(store[`tenants/bistro-paris/timeclock/2026-09-01/${shift.id}_in`]).toBeDefined();
    expect(store[`tenants/bistro-paris/timeclock/2026-09-01/${shift.id}_out`]).toBeDefined();

    // 5. Événement bus émis
    expect(regularizedEvent).toBeDefined();
    expect((regularizedEvent as { durationMinutes: number }).durationMinutes).toBe(435);
    expect((regularizedEvent as { isRetroactive: boolean }).isRetroactive).toBe(true);
  });

  it('Exige impérativement un visa manager pour toute régularisation (Loi 12 RBAC)', async () => {
    await expect(
      RetroactiveTimeClockService.recordRetroactiveShift({
        tenantId: 'bistro-paris',
        employeeId: 'emp-serveur-lucas',
        shiftStartIso: '2026-09-01T07:00:00.000Z',
        shiftEndIso: '2026-09-01T15:00:00.000Z',
        reason: 'Auto-pointage sans manager',
        managerId: '', // Vide !
      })
    ).rejects.toThrow(/Visa managérial requis/);
  });
});
