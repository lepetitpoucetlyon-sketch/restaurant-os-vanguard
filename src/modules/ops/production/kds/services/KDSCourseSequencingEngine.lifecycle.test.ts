import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Hoisted mocks (house pattern — voir src/__tests__/helpers/saga.*.test.ts) ──
const { mockGet, mockSet, mockEmit, store } = vi.hoisted(() => {
  const store = new Map<string, unknown>();
  return {
    store,
    mockGet: vi.fn(async (path: string) => store.get(path) ?? null),
    mockSet: vi.fn(async (path: string, value: unknown) => {
      store.set(path, value);
    }),
    mockEmit: vi.fn(async () => {}),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { KDSCourseSequencingEngine } from './KDSCourseSequencingEngine';
import type { CartItem } from '../../../workflow/engine/types';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  store.clear();
  vi.spyOn(Nexus.adapter, 'get').mockImplementation(mockGet as typeof Nexus.adapter.get);
  vi.spyOn(Nexus.adapter, 'set').mockImplementation(mockSet as typeof Nexus.adapter.set);
  vi.spyOn(NexusEventBus, 'emit').mockImplementation(mockEmit as typeof NexusEventBus.emit);
});

afterEach(() => {
  vi.restoreAllMocks();
});

function cartItem(overrides: Partial<CartItem> & Pick<CartItem, 'cartId' | 'course'>): CartItem {
  return {
    productId: 'prod_1',
    categoryId: 'cat_1',
    name: 'Item',
    quantity: 1,
    unitPriceInMicrounits: 1_000_000,
    taxRate: '0.10',
    discountInMicrounits: 0,
    modifiers: [],
    ...overrides,
  } as CartItem;
}

/**
 * 🌀 CHANTIER 1 — State Machine Testing (cycle de vie)
 *
 * Cible réelle : KDSCourseSequencingEngine (src/modules/ops/production/kds/services),
 * seul moteur de cycle de vie "commande" du repo qui (a) persiste un état via
 * Nexus.adapter et (b) émet des events métier vérifiables.
 *
 * ⚠️ Écart assumé vs la demande initiale : il n'existe dans ce repo AUCUNE garde de
 * transition qui rejette une action métier "illégale" (ex: enchaîner deux fois le
 * même service, ou lancer le dessert avant l'entrée) — `fireCourse`/`requestNextCourse`
 * écrivent l'état de façon optimiste, sans validation de séquence. Le seul rejet
 * réellement implémenté est défensif : agir sur une commande dont le séquençage
 * n'existe plus (ticket clôturé/supprimé, race condition MAJ concurrente). C'est ce
 * cas — réel et vérifiable — qui sert de "action illégale" ci-dessous, plutôt que de
 * fabriquer une garde métier qui n'existe pas dans le code.
 */
describe('🌀 KDSCourseSequencingEngine — Cycle de vie du séquençage plats', () => {
  const tenantId = 'tenant_bistrot';
  const orderId = 'order_42';

  it('état initial : le premier service non vide est FIRED, les autres HOLD', async () => {
    const items: CartItem[] = [
      cartItem({ cartId: 'l1', course: 'entree' }),
      cartItem({ cartId: 'l2', course: 'plat' }),
    ];

    const ticket = await KDSCourseSequencingEngine.initializeOrderCourses(tenantId, orderId, 'table_5', items);

    expect(ticket.courses.entree.status).toBe('FIRED');
    expect(ticket.courses.entree.items).toHaveLength(1);
    expect(ticket.courses.plat.status).toBe('HOLD');
    expect(ticket.courses.dessert.status).toBe('HOLD');
    expect(mockSet).toHaveBeenCalledWith(`tenants/${tenantId}/kdsCourses/${orderId}`, expect.any(Object));
  });

  it('action légale : la salle demande la suite, la cuisine lance le plat → transitions + events corrects', async () => {
    const items: CartItem[] = [
      cartItem({ cartId: 'l1', course: 'entree' }),
      cartItem({ cartId: 'l2', course: 'plat' }),
    ];
    await KDSCourseSequencingEngine.initializeOrderCourses(tenantId, orderId, 'table_5', items);

    const afterRequest = await KDSCourseSequencingEngine.requestNextCourse(tenantId, orderId, 'plat', 'salle_1');
    expect(afterRequest.nextRequestedCourse).toBe('plat');
    expect(mockEmit).toHaveBeenCalledWith(
      'ops.course.next_requested',
      expect.objectContaining({ tenantId, orderId, requestedCourse: 'plat', requestedBy: 'salle_1' })
    );

    const afterFire = await KDSCourseSequencingEngine.fireCourse(tenantId, orderId, 'plat', 'chef_1');
    expect(afterFire.courses.plat.status).toBe('FIRED');
    // La demande en attente est purgée une fois le service effectivement lancé.
    expect(afterFire.nextRequestedCourse).toBeUndefined();
    expect(mockEmit).toHaveBeenCalledWith(
      'ops.course.fired',
      expect.objectContaining({ tenantId, orderId, course: 'plat', firedBy: 'chef_1' })
    );
    expect(mockEmit).toHaveBeenCalledWith(
      'kds.fire_next_course',
      expect.objectContaining({ tenantId, orderId, course: 2, firedBy: 'chef_1' }) // plat = 2e service
    );
  });

  it('action illégale (ticket inexistant) : le domaine rejette explicitement l\'action', async () => {
    // Aucun `initializeOrderCourses` préalable — le séquençage n'existe pas dans Nexus.
    await expect(
      KDSCourseSequencingEngine.fireCourse(tenantId, 'order_ghost', 'plat', 'chef_1')
    ).rejects.toThrow('Séquençage introuvable pour la commande order_ghost');

    await expect(
      KDSCourseSequencingEngine.requestNextCourse(tenantId, 'order_ghost', 'dessert', 'salle_1')
    ).rejects.toThrow('Séquençage introuvable pour la commande order_ghost');

    // Aucun effet de bord : ni persistance ni event émis pour une action rejetée.
    expect(mockSet).not.toHaveBeenCalled();
    expect(mockEmit).not.toHaveBeenCalled();
  });
});
