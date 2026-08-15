import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KDSCourseSequencingEngine } from '@/modules/ops/production/kds/services/KDSCourseSequencingEngine';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import type { CartItem } from '@/modules/ops/workflow/engine/types';

describe('KDS — Séquençage des Plats & Envoi de la suite (Fire Next Course)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('devrait initialiser les entrées en FIRED et les plats/desserts en HOLD', async () => {
    const items = [
      { cartId: 'c1', productId: 'p1', name: 'Soupe à l oignon', quantity: 2, unitPriceInMicrounits: 9000000, course: 'entree' },
      { cartId: 'c2', productId: 'p2', name: 'Entrecôte grillée', quantity: 2, unitPriceInMicrounits: 26000000, course: 'plat' },
      { cartId: 'c3', productId: 'p3', name: 'Crème brûlée', quantity: 2, unitPriceInMicrounits: 8000000, course: 'dessert' },
    ] as unknown as CartItem[];

    const res = await KDSCourseSequencingEngine.initializeOrderCourses(
      'bistro-paris',
      'ord-4001',
      'tbl-7',
      items
    );

    expect(res.courses.entree.status).toBe('FIRED');
    expect(res.courses.plat.status).toBe('HOLD');
    expect(res.courses.dessert.status).toBe('HOLD');
  });

  it('devrait gérer la demande d envoi de suite puis le tir (FIRED) avec émission des événements', async () => {
    const fireEventSpy = vi.fn();
    const reqEventSpy = vi.fn();

    NexusEventBus.on('ops.course.fired', fireEventSpy, { id: 'test-kds-fire' });
    NexusEventBus.on('ops.course.next_requested', reqEventSpy, { id: 'test-kds-req' });

    const items = [
      { cartId: 'c1', productId: 'p1', name: 'Carpaccio', quantity: 1, unitPriceInMicrounits: 12000000, course: 'entree' },
      { cartId: 'c2', productId: 'p2', name: 'Pavé de saumon', quantity: 1, unitPriceInMicrounits: 22000000, course: 'plat' },
    ] as unknown as CartItem[];

    await KDSCourseSequencingEngine.initializeOrderCourses(
      'bistro-paris',
      'ord-4002',
      'tbl-3',
      items
    );

    // 1. La serveuse demande la suite pour la table 3
    const requested = await KDSCourseSequencingEngine.requestNextCourse(
      'bistro-paris',
      'ord-4002',
      'plat',
      'serveur-thomas'
    );

    expect(requested.nextRequestedCourse).toBe('plat');
    expect(reqEventSpy).toHaveBeenCalledTimes(1);

    // 2. Le chef envoie la cuisson des plats
    const fired = await KDSCourseSequencingEngine.fireCourse(
      'bistro-paris',
      'ord-4002',
      'plat',
      'chef-michel'
    );

    expect(fired.courses.plat.status).toBe('FIRED');
    expect(fired.nextRequestedCourse).toBeUndefined();
    expect(fireEventSpy).toHaveBeenCalledTimes(1);
  });
});
