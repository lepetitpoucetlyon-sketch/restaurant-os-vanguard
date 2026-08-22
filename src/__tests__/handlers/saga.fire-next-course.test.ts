import { describe, it, expect, vi, beforeEach } from 'vitest';
import { registerFireNextCourseHandler } from '@/shared/eventBus/handlers/FireNextCourseHandler';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { empireAudit } from '@/lib/audit';

vi.mock('@/shared/eventBus/NexusEventBus', () => ({
  NexusEventBus: { on: vi.fn(), emit: vi.fn() },
}));
vi.mock('@/lib/nexus/NexusAdapter', () => ({
  Nexus: { adapter: { set: vi.fn() } },
}));
vi.mock('@/lib/audit', () => ({
  empireAudit: { log: vi.fn() },
}));
vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn() },
}));

describe('Chantier 3 : Event-Bus Contracts & Idempotence', () => {
  let handlerCallback: (payload: any) => Promise<void>;

  beforeEach(() => {
    vi.clearAllMocks();
    (NexusEventBus.on as any).mockImplementation((event: string, callback: any) => {
      if (event === 'kds.fire_next_course') { handlerCallback = callback; }
      return () => {}; 
    });
    registerFireNextCourseHandler();
  });

  it('doit traiter kds.fire_next_course, persister, et cascader le nouvel event (Saga)', async () => {
    const payload = { tenantId: 't-123', orderId: 'order-456', course: 2, stationId: 'st-A', firedBy: 'chef-john', firedAt: Date.now() };
    await handlerCallback(payload);

    expect(Nexus.adapter.set).toHaveBeenCalledTimes(1);
    expect(Nexus.adapter.set).toHaveBeenCalledWith(
      'tenants/t-123/kdsFireLog/order-456_course2',
      expect.objectContaining({ orderId: 'order-456', course: 2 })
    );
    expect(NexusEventBus.emit).toHaveBeenCalledTimes(1);
    expect(NexusEventBus.emit).toHaveBeenCalledWith('kds.course_fired', { v: 1, tenantId: 't-123', orderId: 'order-456', course: 2 });
    expect(empireAudit.log).toHaveBeenCalledWith(expect.objectContaining({ action: 'KDS_COURSE_FIRED' }));
  });

  it('BONUS 1 : Idempotence de l\'Event Bus - Rejouer un event réseau ne doit pas corrompre l\'état', async () => {
    const payload = { tenantId: 't-999', orderId: 'order-777', course: 1, stationId: 'st-B', firedBy: 'chef-jane', firedAt: Date.now() };
    await handlerCallback(payload); 
    await handlerCallback(payload); 

    expect(Nexus.adapter.set).toHaveBeenCalledTimes(2);
    expect(Nexus.adapter.set).toHaveBeenLastCalledWith(
      'tenants/t-999/kdsFireLog/order-777_course1',
      expect.objectContaining({ orderId: 'order-777' })
    );
  });
});