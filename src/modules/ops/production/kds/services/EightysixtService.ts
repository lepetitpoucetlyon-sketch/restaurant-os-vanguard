/**
 * L9 — 86 brutal ingrédient cascade.
 *
 * Quand un chef met en "86" un ingrédient (rupture), toutes les recettes qui
 * l'utilisent doivent être automatiquement désactivées. Actuellement le chef
 * doit désactiver 6 plats à la main — erreur de 20 % en rush de service.
 *
 * Ce service :
 * 1. Calcule les plats impactés (pur, testable)
 * 2. Désactive les plats dans Nexus + émet l'event KDS pour refresh temps réel
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L9 (HAUT).
 */
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';
import { AuditLogger } from '@/modules/compliance';

export interface DishRecipe {
  dishId: string;
  name: string;
  ingredientIds: string[];
  status: 'active' | 'inactive' | 'eightysixed';
}

export interface EightysixtResult {
  ingredientId: string;
  ingredientName: string;
  affectedDishes: Array<{ dishId: string; name: string }>;
  blockedAt: number;
}

export class EightysixtService {
  /** Pure: trouve les plats affectés sans IO */
  static findAffectedDishes(ingredientId: string, dishes: DishRecipe[]): DishRecipe[] {
    return dishes.filter(d => d.ingredientIds.includes(ingredientId) && d.status === 'active');
  }

  static async eightysix(input: {
    tenantId: string;
    ingredientId: string;
    ingredientName: string;
    blockedBy: string;
    now?: number;
  }): Promise<EightysixtResult> {
    const now = input.now ?? Date.now();

    const allDishes = await Nexus.adapter.query<DishRecipe>(
      `tenants/${input.tenantId}/dishes`,
    ) ?? [];

    const affected = this.findAffectedDishes(input.ingredientId, allDishes);

    await Promise.all(
      affected.map(dish =>
        Nexus.adapter.set(`tenants/${input.tenantId}/dishes/${dish.dishId}`, {
          ...dish,
          status: 'eightysixed',
          eightysixedAt: now,
          eightysixedReason: `ingredient_unavailable:${input.ingredientId}`,
        }),
      ),
    );

    await Nexus.adapter.set(
      `tenants/${input.tenantId}/ingredients/${input.ingredientId}`,
      { status: 'eightysixed', eightysixedAt: now, blockedBy: input.blockedBy },
    );

    await AuditLogger.logAction(
      input.blockedBy,
      'INGREDIENT_EIGHTYSIXTED',
      input.ingredientId,
      { ingredientName: input.ingredientName, affectedDishCount: affected.length },
    ).catch(() => null);

    await NexusEventBus.emit('ops.ingredient_eightysixted', {
      v: 1,
      tenantId: input.tenantId,
      ingredientId: input.ingredientId,
      ingredientName: input.ingredientName,
      affectedDishIds: affected.map(d => d.dishId),
      blockedBy: input.blockedBy,
      eightysixedAt: now,
    });

    return {
      ingredientId: input.ingredientId,
      ingredientName: input.ingredientName,
      affectedDishes: affected.map(d => ({ dishId: d.dishId, name: d.name })),
      blockedAt: now,
    };
  }
}
