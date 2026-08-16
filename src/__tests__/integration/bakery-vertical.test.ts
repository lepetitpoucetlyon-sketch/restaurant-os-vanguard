import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BakeryVertical } from '@/verticals/bakery/BakeryVertical';
import { BakeryOpsAdapter, BakeryLogisticsAdapter, BakeryIntelligenceAdapter } from '@/verticals/bakery/adapters';
import type { ICoreContext } from '@/shared/plugins/IVerticalPlugin';

describe('🥖 Verticale Boulangerie & Pâtisserie — Industrialisation Batch Baking & Traçabilité', () => {
  const registeredRoutes = new Map<string, any>();
  const registeredEventHandlers = new Map<string, (payload: any) => void>();

  const mockCoreContext: ICoreContext = {
    registerRoute: (path: string, component: any) => {
      registeredRoutes.set(path, component);
    },
    registerStoreAtom: (_key: string, _atom: any) => {},
    registerEventHandler: (eventName: string, handler: (payload: any) => void) => {
      registeredEventHandlers.set(eventName, handler);
    },
    registerRbacConfig: (_config: any) => {},
    getRegisteredRoutes: () => Array.from(registeredRoutes.keys()),
    getRegisteredAtoms: () => [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    registeredRoutes.clear();
    registeredEventHandlers.clear();
  });

  it('1. Initialise la verticale Boulangerie et enregistre les routes spécialisées', async () => {
    const bakery = new BakeryVertical();
    expect(bakery.id).toBe('bakery');
    expect(bakery.name).toBe('Bakery OS');

    await bakery.initialize(mockCoreContext);

    expect(registeredRoutes.has('/production')).toBe(true);
    expect(registeredRoutes.has('/preorders')).toBe(true);
    expect(registeredRoutes.has('/display-stock')).toBe(true);
    expect(registeredRoutes.has('/allergens')).toBe(true);
  });

  it('2. Traite le démarrage d’une fournée (batch_started) avec déduction d’ingrédients', async () => {
    const bakery = new BakeryVertical();
    await bakery.initialize(mockCoreContext);

    const emitIngredientConsumedSpy = vi.spyOn(BakeryLogisticsAdapter, 'emitIngredientConsumed').mockImplementation(() => {});

    const batchStartHandler = registeredEventHandlers.get('bakery.batch_started');
    expect(batchStartHandler).toBeDefined();

    batchStartHandler?.({
      tenantId: 'tenant_boulangerie_01',
      batchId: 'batch_baguette_tradition_001',
      recipe: 'Baguette de Tradition Française',
      quantity: 120, // 120 baguettes
      ovenId: 'four_sol_01',
      startedAt: new Date().toISOString(),
    });

    expect(emitIngredientConsumedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant_boulangerie_01',
        batchId: 'batch_baguette_tradition_001',
      })
    );
  });

  it('3. Traite la fin de cuisson (batch_completed) avec incrémentation vitrine et analytics', async () => {
    const bakery = new BakeryVertical();
    await bakery.initialize(mockCoreContext);

    const emitMetricsSpy = vi.spyOn(BakeryIntelligenceAdapter, 'emitMetricsSnapshot').mockImplementation(() => {});
    const emitBatchCompletedSpy = vi.spyOn(BakeryOpsAdapter, 'emitBatchCompleted').mockImplementation(() => {});

    const batchCompletedHandler = registeredEventHandlers.get('bakery.batch_completed');
    expect(batchCompletedHandler).toBeDefined();

    const completedAt = '2026-08-16T06:30:00.000Z';
    batchCompletedHandler?.({
      tenantId: 'tenant_boulangerie_01',
      batchId: 'batch_croissant_beurre_002',
      recipe: 'Croissant Pur Beurre AOP',
      yield: 80, // 80 croissants sortis du four
      completedAt,
    });

    expect(emitMetricsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant_boulangerie_01',
        date: '2026-08-16',
        batchesProduced: 1,
      })
    );

    expect(emitBatchCompletedSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: 'tenant_boulangerie_01',
        batchId: 'batch_croissant_beurre_002',
        recipe: 'Croissant Pur Beurre AOP',
        yield: 80,
      })
    );
  });
});
