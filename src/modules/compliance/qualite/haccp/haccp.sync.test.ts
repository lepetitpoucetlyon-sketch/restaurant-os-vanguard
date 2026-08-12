import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PlatformVariant } from '@nexus/contracts';

vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: {
    getTenantPath: (coll: string, tid: string) => `tenants/${tid}/${coll}`,
    adapter: {
      onSnapshot: vi.fn(() => () => undefined),
    },
  },
}));

vi.mock('@/store/nexusNodeFactory', () => ({ updateNexusNode: vi.fn() }));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn() } }));
vi.mock('./store/complianceAtoms', () => ({
  hygieneLabelsNodeAtom: {},
  maintenanceLogsNodeAtom: {},
}));

import { HACCPSyncService } from './haccp.sync';
import { Nexus } from '@/lib/nexus/NexusAdapter';

describe('HACCPSyncService — §8.6 Vague 1 gate culinaire', () => {
  const fakeStore = { get: vi.fn(), set: vi.fn(), sub: vi.fn() } as unknown as Parameters<
    typeof HACCPSyncService.init
  >[1];

  beforeEach(() => {
    HACCPSyncService.stop();
    vi.mocked(Nexus.adapter.onSnapshot).mockClear();
  });

  it('ouvre 2 abonnements pour une verticale culinaire (restaurant)', () => {
    HACCPSyncService.init('t1', fakeStore, 'restaurant' satisfies PlatformVariant);
    expect(vi.mocked(Nexus.adapter.onSnapshot)).toHaveBeenCalledTimes(2);
  });

  it('ouvre 2 abonnements pour hotel + bakery', () => {
    HACCPSyncService.init('t2', fakeStore, 'hotel');
    HACCPSyncService.init('t3', fakeStore, 'bakery');
    expect(vi.mocked(Nexus.adapter.onSnapshot)).toHaveBeenCalledTimes(4);
  });

  it("n'ouvre AUCUN abonnement pour garage/salon/clinic/retail/custom", () => {
    const nonCulinary: PlatformVariant[] = ['garage', 'salon', 'clinic', 'retail', 'custom'];
    for (const v of nonCulinary) {
      HACCPSyncService.init(`t-${v}`, fakeStore, v);
    }
    expect(vi.mocked(Nexus.adapter.onSnapshot)).toHaveBeenCalledTimes(0);
  });

  it("défaut variant = 'restaurant' → comportement historique préservé", () => {
    HACCPSyncService.init('t-default', fakeStore);
    expect(vi.mocked(Nexus.adapter.onSnapshot)).toHaveBeenCalledTimes(2);
  });
});
