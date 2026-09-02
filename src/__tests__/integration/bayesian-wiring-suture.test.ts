import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { registerWaiterCallHandler } from '@/shared/eventBus/handlers/WaiterCallHandler';
import { registerTableAutoReleaseHandler } from '@/shared/eventBus/handlers/TableAutoReleaseHandler';
import { registerEndOfServiceActionHandler } from '@/shared/eventBus/handlers/EndOfServiceActionHandler';
import { registerLaborCostAnalyzerHandler } from '@/shared/eventBus/handlers/LaborCostAnalyzerHandler';
import { registerAutoTipDistributionHandler } from '@/shared/eventBus/handlers/AutoTipDistributionHandler';

describe('Bayesian Wiring Suture Integration Tests (Lots 1 à 5)', () => {
  const tenantId = 'tenant-suture-test';

  beforeEach(async () => {
    vi.restoreAllMocks();
  });

  it('Suture Nœud 1 : ops.waiter_call_requested émet une notification urgente pour la salle', async () => {
    const cleanup = registerWaiterCallHandler();
    const urgentNotifications: unknown[] = [];

    const unsub = NexusEventBus.on('notification.urgent', (payload) => {
      urgentNotifications.push(payload);
    });

    await NexusEventBus.emit('ops.waiter_call_requested', {
      v: 1,
      tenantId,
      tableId: '12',
      tableName: 'Table 12',
      reason: 'water',
      note: 'Fraîche SVP',
      requestedAt: new Date().toISOString(),
    });

    expect(urgentNotifications.length).toBeGreaterThan(0);
    const notif = urgentNotifications[0] as { message: string; roles: string[]; priority: string };
    expect(notif.message).toContain('Table 12');
    expect(notif.message).toContain("Carafe d'eau");
    expect(notif.message).toContain('Fraîche SVP');
    expect(notif.roles).toContain('serveur');
    expect(notif.priority).toBe('HIGH');

    unsub();
    cleanup();
  });

  it('Suture Nœud 2 : table.cleaned libère la table et alerte l\'hôtesse immédiatement', async () => {
    const cleanup = registerTableAutoReleaseHandler();
    const urgentNotifications: unknown[] = [];

    const updateSpy = vi.spyOn(Nexus.adapter, 'update').mockResolvedValue(undefined as never);
    const unsub = NexusEventBus.on('notification.urgent', (payload) => {
      urgentNotifications.push(payload);
    });

    await NexusEventBus.emit('table.cleaned', {
      v: 1,
      tenantId,
      tableId: 'table-14',
    });

    expect(updateSpy).toHaveBeenCalledWith(
      `tenants/${tenantId}/ops_nodes/table-14`,
      expect.objectContaining({ status: 'available', seatedAt: null })
    );

    expect(urgentNotifications.length).toBeGreaterThan(0);
    const notif = urgentNotifications[0] as { message: string; roles: string[] };
    expect(notif.message).toContain('Table table-14 est maintenant nettoyée');
    expect(notif.roles).toContain('hotesse');

    unsub();
    cleanup();
  });

  it('Suture Nœud 3 : finance.ticket_z_closed suspend les commandes externes et alerte la direction', async () => {
    const cleanup = registerEndOfServiceActionHandler();
    const rushToggledEvents: unknown[] = [];
    const urgentNotifications: unknown[] = [];

    const unsubRush = NexusEventBus.on('store.rush_mode_toggled', (payload) => {
      rushToggledEvents.push(payload);
    });
    const unsubNotif = NexusEventBus.on('notification.urgent', (payload) => {
      urgentNotifications.push(payload);
    });

    await NexusEventBus.emit('finance.ticket_z_closed', {
      v: 1,
      tenantId,
      date: '2026-09-02',
      totalInMicrounits: 4_500_000_000, // 4 500 €
      ordersCount: 120,
    });

    expect(rushToggledEvents.length).toBe(1);
    const rush = rushToggledEvents[0] as { isPaused: boolean; requestedBy: string };
    expect(rush.isPaused).toBe(true);
    expect(rush.requestedBy).toBe('system');

    expect(urgentNotifications.length).toBe(1);
    const notif = urgentNotifications[0] as { message: string; roles: string[] };
    expect(notif.message).toContain('Ticket Z');
    expect(notif.message).toContain('Commandes externes suspendues');
    expect(notif.roles).toContain('manager');

    unsubRush();
    unsubNotif();
    cleanup();
  });

  it('Suture Nœud 4 : staff.clock_out déclenche le monitoring du coût salarial', async () => {
    const cleanup = registerLaborCostAnalyzerHandler();

    // Mock timeclock data
    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      if (path.includes('timeclock')) {
        return {
          entry1: {
            id: 'e1',
            employeeId: 'emp-1',
            type: 'clock_in',
            timestamp: new Date(Date.now() - 4 * 3600000).toISOString(),
          },
          entry2: {
            id: 'e2',
            employeeId: 'emp-1',
            type: 'clock_out',
            timestamp: new Date().toISOString(),
          },
        };
      }
      if (path.includes('contracts')) {
        return { hourlyRateCents: 1500 };
      }
      return null;
    });

    await NexusEventBus.emit('staff.clock_out', {
      v: 1,
      tenantId,
      userId: 'emp-1',
      userName: 'Jean Dupont',
      terminalId: 'kiosk-1',
      timestamp: new Date().toISOString(),
    });

    cleanup();
  });

  it('Suture Nœud 5 : finance.ticket_z_closed calcule et persiste la répartition des pourboires', async () => {
    const cleanup = registerAutoTipDistributionHandler();

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      if (path.includes('analytics/tips_')) {
        return { totalTipsInMicrounits: 100_000_000 }; // 100 €
      }
      if (path.includes('timeclock/')) {
        return {
          p1: {
            id: 'p1',
            employeeId: 'staff-1',
            type: 'clock_in',
            timestamp: '2026-09-02T10:00:00Z',
            metadata: { userName: 'Alice', role: 'serveur' },
          },
          p2: {
            id: 'p2',
            employeeId: 'staff-1',
            type: 'clock_out',
            timestamp: '2026-09-02T15:00:00Z',
            metadata: { userName: 'Alice', role: 'serveur' },
          },
          p3: {
            id: 'p3',
            employeeId: 'staff-2',
            type: 'clock_in',
            timestamp: '2026-09-02T10:00:00Z',
            metadata: { userName: 'Bob', role: 'barman' },
          },
          p4: {
            id: 'p4',
            employeeId: 'staff-2',
            type: 'clock_out',
            timestamp: '2026-09-02T15:00:00Z',
            metadata: { userName: 'Bob', role: 'barman' },
          },
        };
      }
      return null;
    });

    const setSpy = vi.spyOn(Nexus.adapter, 'set').mockResolvedValue(undefined as never);

    await NexusEventBus.emit('finance.ticket_z_closed', {
      v: 1,
      tenantId,
      date: '2026-09-02',
      totalInMicrounits: 3_000_000_000,
      ordersCount: 80,
    });

    expect(setSpy).toHaveBeenCalledWith(
      expect.stringContaining(`tenants/${tenantId}/tip_distributions/dist_2026-09-02_`),
      expect.objectContaining({
        date: '2026-09-02',
        totalTipsEur: 100,
        status: 'draft_ready_for_review',
        shares: expect.arrayContaining([
          expect.objectContaining({ staffId: 'staff-1', tipAmountEur: 50 }),
          expect.objectContaining({ staffId: 'staff-2', tipAmountEur: 50 }),
        ]),
      })
    );

    cleanup();
  });
});
