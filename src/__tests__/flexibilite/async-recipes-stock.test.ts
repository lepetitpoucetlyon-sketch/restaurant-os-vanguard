import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { registerStockDeductionHandler } from '@/shared/eventBus/handlers/StockDeductionHandler';
import { registerRecipeReconciliationHandler } from '@/shared/eventBus/handlers/RecipeReconciliationHandler';
import { IdempotencyGuard } from '@/shared/eventBus/IdempotencyGuard';

describe('Lot 2 — Stocks tolérants au négatif & Fiches techniques asynchrones (M1/M2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    NexusEventBus.resetForTesting();
    IdempotencyGuard.clearMemoryCache();
  });

  it('Tolérance au stock négatif : décrémente en négatif et émet stock.negative_alert sans bloquer', async () => {
    const store: Record<string, unknown> = {
      'tenants/resto-1/stockItems/saumon': {
        quantity: 2,
        reorderThreshold: 5,
      },
      'tenants/resto-1/products/p-saumon': {
        linkedStockItemId: 'saumon',
      },
    };

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      return (store[path] as never) ?? null;
    });

    vi.spyOn(Nexus.adapter, 'increment').mockImplementation(async (path: string, field: string, amount: number) => {
      const item = (store[path] ?? {}) as Record<string, number>;
      item[field] = (item[field] ?? 0) + amount;
      store[path] = item;
    });

    vi.spyOn(Nexus.adapter, 'update').mockImplementation(async (path: string, val: unknown) => {
      store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
    });

    let alertEmitted: unknown = null;
    NexusEventBus.on('stock.negative_alert', async (payload) => {
      alertEmitted = payload;
    });

    const unsub = registerStockDeductionHandler();

    // Vente de 5 saumons alors qu'il n'en reste que 2 en stock
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'ord-saumon-1',
      tenantId: 'resto-1',
      operatorId: 'serveur-1',
      paymentMode: 'cb',
      totalInMicrounits: 50_000_000 as never,
      items: [{ productId: 'p-saumon', name: 'Pavé de Saumon', quantity: 5, unitPriceInMicrounits: 10_000_000 }] as never,
      tableId: 't-1',
    });
    await new Promise((r) => setTimeout(r, 50));

    const updatedSaumon = store['tenants/resto-1/stockItems/saumon'] as { quantity: number; isNegative: boolean };
    expect(updatedSaumon.quantity).toBe(-3); // 2 - 5 = -3
    expect(updatedSaumon.isNegative).toBe(true);

    expect(alertEmitted).toBeDefined();
    expect((alertEmitted as { deficit: number }).deficit).toBe(3);

    unsub();
  });

  it('Recette asynchrone : met en attente la déduction puis la réconcilie à la création de la recette', async () => {
    const store: Record<string, unknown> = {
      // Produit sans recette initialement
      'tenants/resto-1/products/burger-futur': {
        name: 'Burger Éphémère',
      },
      'tenants/resto-1/stockItems/steak-hache': {
        quantity: 50,
      },
      'tenants/resto-1/stockItems/pain-bun': {
        quantity: 50,
      },
    };

    const pendingList: Array<Record<string, unknown>> = [];

    vi.spyOn(Nexus.adapter, 'get').mockImplementation(async (path: string) => {
      return (store[path] as never) ?? null;
    });

    vi.spyOn(Nexus.adapter, 'set').mockImplementation(async (path: string, val: unknown) => {
      store[path] = val;
      if (path.includes('pending_stock_deductions')) {
        pendingList.push(val as Record<string, unknown>);
      }
    });

    vi.spyOn(Nexus.adapter, 'update').mockImplementation(async (path: string, val: unknown) => {
      store[path] = { ...(store[path] as Record<string, unknown> ?? {}), ...(val as Record<string, unknown>) };
      if (path.includes('pending_stock_deductions')) {
        const id = path.split('/').pop();
        const found = pendingList.find((p) => p.id === id);
        if (found) Object.assign(found, val);
      }
    });

    vi.spyOn(Nexus.adapter, 'query').mockImplementation(async (path: string, options?: { where?: Array<{ field: string; operator: string; value: unknown }> }) => {
      if (path.includes('pending_stock_deductions')) {
        return pendingList.filter((item) => {
          if (!options?.where) return true;
          return options.where.every((w) => item[w.field] === w.value);
        }) as never;
      }
      return [] as never;
    });

    vi.spyOn(Nexus.adapter, 'increment').mockImplementation(async (path: string, field: string, amount: number) => {
      const item = (store[path] ?? {}) as Record<string, number>;
      item[field] = (item[field] ?? 0) + amount;
      store[path] = item;
    });

    const unsubStock = registerStockDeductionHandler();
    const unsubReconcil = registerRecipeReconciliationHandler();

    // 1. Vente de 3 burgers sans fiche technique
    await NexusEventBus.emit('order.paid', {
      v: 1,
      orderId: 'ord-burger-1',
      tenantId: 'resto-1',
      operatorId: 'serveur-1',
      paymentMode: 'cb',
      totalInMicrounits: 45_000_000 as never,
      items: [{ productId: 'burger-futur', name: 'Burger Éphémère', quantity: 3, unitPriceInMicrounits: 15_000_000 }] as never,
      tableId: 't-1',
    });
    await new Promise((r) => setTimeout(r, 50));

    // Vérifier que la déduction est en attente
    const pendingKey = 'tenants/resto-1/pending_stock_deductions/pending_deduct_ord-burger-1_burger-futur';
    const pending = store[pendingKey] as { status: string; quantity: number };
    expect(pending).toBeDefined();
    expect(pending.status).toBe('pending');
    expect(pending.quantity).toBe(3);

    // Les stocks d'ingrédients n'ont pas encore bougé
    expect((store['tenants/resto-1/stockItems/steak-hache'] as { quantity: number }).quantity).toBe(50);

    // 2. Le chef crée la recette 2 jours après
    store['tenants/resto-1/recipes/recipe-burger-1'] = {
      id: 'recipe-burger-1',
      name: 'Recette Burger Éphémère',
      ingredients: [
        { ingredientId: 'steak-hache', name: 'Steak Haché', quantity: 1 },
        { ingredientId: 'pain-bun', name: 'Pain Bun', quantity: 1 },
      ],
    };

    let reconciledEvent: unknown = null;
    NexusEventBus.on('stock.deductions_reconciled', async (payload) => {
      reconciledEvent = payload;
    });

    await NexusEventBus.emit('recipe.created', {
      v: 1,
      tenantId: 'resto-1',
      productId: 'burger-futur',
      recipeId: 'recipe-burger-1',
    });
    await new Promise((r) => setTimeout(r, 50));

    // 3. Rapprochement automatique effectué !
    // La déduction en attente est marquée 'reconciled'
    const updatedPending = store[pendingKey] as { status: string; reconciledRecipeId: string };
    expect(updatedPending.status).toBe('reconciled');
    expect(updatedPending.reconciledRecipeId).toBe('recipe-burger-1');

    // Les stocks ont été décrétés rétroactivement : 50 - 3 = 47
    expect((store['tenants/resto-1/stockItems/steak-hache'] as { quantity: number }).quantity).toBe(47);
    expect((store['tenants/resto-1/stockItems/pain-bun'] as { quantity: number }).quantity).toBe(47);

    expect(reconciledEvent).toBeDefined();
    expect((reconciledEvent as { reconciledCount: number }).reconciledCount).toBe(1);

    unsubStock();
    unsubReconcil();
  });
});
