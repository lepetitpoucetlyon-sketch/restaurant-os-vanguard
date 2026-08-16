import { describe, it, expect, vi, beforeEach } from 'vitest';
import { KDSCourseSequencingEngine } from './KDSCourseSequencingEngine';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { CartItem } from '@/modules/ops/workflow/engine/types';

describe('👨‍🍳 KDSCourseSequencingEngine — Séquençage & Cadençage Cuisine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const tenantId = 'tenant_bistrot_paris';
  const orderId = 'ord_kds_777';
  const tableId = 'tbl_5';

  const mockItems = [
    { cartId: 'c1', name: 'Tartare de Saumon', quantity: 2, course: 'entree' },
    { cartId: 'c2', name: 'Côte de Bœuf Grillée', quantity: 2, course: 'plat' },
    { cartId: 'c3', name: 'Millefeuille Vanille', quantity: 2, course: 'dessert' },
  ] as unknown as CartItem[];

  it('devrait initialiser les courses avec l\'entrée passée en FIRED et le plat/dessert en HOLD', async () => {
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);

    const ticketCourses = await KDSCourseSequencingEngine.initializeOrderCourses(
      tenantId,
      orderId,
      tableId,
      mockItems
    );

    expect(ticketCourses.orderId).toBe(orderId);
    expect(ticketCourses.tableId).toBe(tableId);
    expect(ticketCourses.courses.entree.status).toBe('FIRED');
    expect(ticketCourses.courses.entree.items.length).toBe(1);
    expect(ticketCourses.courses.plat.status).toBe('HOLD');
    expect(ticketCourses.courses.plat.items.length).toBe(1);
    expect(ticketCourses.courses.dessert.status).toBe('HOLD');

    expect(spySet).toHaveBeenCalledWith(
      `tenants/${tenantId}/kdsCourses/${orderId}`,
      expect.objectContaining({
        orderId,
      })
    );
  });

  it('devrait passer directement le plat en FIRED si aucune entrée n\'est commandée', async () => {
    const itemsWithoutEntree = [
      { cartId: 'cp', name: 'Burger Maison', quantity: 1, course: 'plat' },
      { cartId: 'cd', name: 'Fondant Chocolat', quantity: 1, course: 'dessert' },
    ] as unknown as CartItem[];

    vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);

    const ticketCourses = await KDSCourseSequencingEngine.initializeOrderCourses(
      tenantId,
      orderId,
      tableId,
      itemsWithoutEntree
    );

    expect(ticketCourses.courses.entree.items.length).toBe(0);
    expect(ticketCourses.courses.plat.status).toBe('FIRED');
    expect(ticketCourses.courses.dessert.status).toBe('HOLD');
  });

  it('devrait envoyer la suite (fireCourse) et émettre ops.course.fired et kds.fire_next_course', async () => {
    const existingTicket = {
      orderId,
      tableId,
      tenantId,
      courses: {
        entree: { course: 'entree', status: 'READY', items: [] },
        plat: { course: 'plat', status: 'HOLD', items: [] },
        dessert: { course: 'dessert', status: 'HOLD', items: [] },
      },
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingTicket);
    const spySet = vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);
    const spyEmit = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined as never);

    const updated = await KDSCourseSequencingEngine.fireCourse(
      tenantId,
      orderId,
      'plat',
      'chef_thomas'
    );

    expect(updated.courses.plat.status).toBe('FIRED');
    expect(typeof updated.courses.plat.firedAt).toBe('number');
    expect(spySet).toHaveBeenCalled();

    expect(spyEmit).toHaveBeenCalledWith(
      'ops.course.fired',
      expect.objectContaining({
        tenantId,
        orderId,
        course: 'plat',
        firedBy: 'chef_thomas',
      })
    );
  });

  it('devrait enregistrer la demande de suite par la salle (requestNextCourse)', async () => {
    const existingTicket = {
      orderId,
      tableId,
      tenantId,
      courses: {
        entree: { course: 'entree', status: 'SERVED', items: [] },
        plat: { course: 'plat', status: 'HOLD', items: [] },
        dessert: { course: 'dessert', status: 'HOLD', items: [] },
      },
    };

    vi.spyOn(Nexus.adapter, 'get').mockResolvedValueOnce(existingTicket);
    vi.spyOn(Nexus.adapter, 'set').mockResolvedValueOnce(undefined);
    const spyEmit = vi.spyOn(NexusEventBus, 'emit').mockResolvedValue(undefined as never);

    const updated = await KDSCourseSequencingEngine.requestNextCourse(
      tenantId,
      orderId,
      'plat',
      'srv_marine'
    );

    expect(updated.nextRequestedCourse).toBe('plat');
    expect(typeof updated.requestedAt).toBe('number');

    expect(spyEmit).toHaveBeenCalledWith(
      'ops.course.next_requested',
      expect.objectContaining({
        tenantId,
        orderId,
        requestedCourse: 'plat',
        requestedBy: 'srv_marine',
      })
    );
  });
});
