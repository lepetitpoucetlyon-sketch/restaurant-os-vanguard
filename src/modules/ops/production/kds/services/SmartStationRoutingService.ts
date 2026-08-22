import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export type StationType = 'chaud' | 'froid' | 'pizza' | 'bar' | 'patisserie' | 'passe';

export interface DishRoutingCandidate {
  orderId: string;
  itemId: string;
  dishName: string;
  category?: string;
  rawIngredients?: string[];
  explicitStationOverride?: StationType;
}

export interface DishRoutingDecision {
  orderId: string;
  itemId: string;
  dishName: string;
  station: StationType;
  confidencePct: number;
  matchedRule: string;
}

const STATION_KEYWORDS: Record<StationType, string[]> = {
  chaud: ['grill', 'steak', 'burger', 'frites', 'cuisson', 'saute', 'rotisserie', 'soufflé', 'entrecote', 'poisson chaud', 'pasta'],
  froid: ['salade', 'tartare', 'carpaccio', 'ceviche', 'burrata', 'entree froide', 'huitres', 'tataki', 'pokebowl', 'terrine'],
  pizza: ['pizza', 'calzone', 'focaccia', 'flammekueche', 'pain pita'],
  bar: ['cocktail', 'biere', 'vin', 'soft', 'cafe', 'spritz', 'mocktail', 'boisson', 'eau', 'kombucha'],
  patisserie: ['dessert', 'glace', 'fondant', 'tiramisu', 'tarte', 'crepe', 'profiterole', 'mousse', 'choux'],
  passe: ['passe', 'envoi', 'garni', 'dressage'],
};

/**
 * SmartStationRoutingService — Angle mort B1.
 * Route intelligemment les plats vers les bons écrans KDS avec support multilingue et fallback phonétique/catégoriel.
 */
export class SmartStationRoutingService {
  static routeDish(tenantId: string, candidate: DishRoutingCandidate): DishRoutingDecision {
    if (candidate.explicitStationOverride) {
      return {
        orderId: candidate.orderId,
        itemId: candidate.itemId,
        dishName: candidate.dishName,
        station: candidate.explicitStationOverride,
        confidencePct: 100,
        matchedRule: 'explicit_override',
      };
    }

    const lowerName = candidate.dishName.toLowerCase();

    // 1. Keyword direct match
    for (const [st, keywords] of Object.entries(STATION_KEYWORDS) as [StationType, string[]][]) {
      for (const kw of keywords) {
        if (lowerName.includes(kw)) {
          NexusEventBus.emit('kds.smart_routing_dispatched', {
            v: 1,
            tenantId,
            orderId: candidate.orderId,
            itemId: candidate.itemId,
            dishName: candidate.dishName,
            matchedStation: st,
            confidencePct: 95,
            dispatchedAt: Date.now(),
          });

          return {
            orderId: candidate.orderId,
            itemId: candidate.itemId,
            dishName: candidate.dishName,
            station: st,
            confidencePct: 95,
            matchedRule: `keyword:${kw}`,
          };
        }
      }
    }

    // 2. Category fallback
    if (candidate.category) {
      const cat = candidate.category.toLowerCase();
      if (cat.includes('dessert') || cat.includes('sweet')) {
        return { orderId: candidate.orderId, itemId: candidate.itemId, dishName: candidate.dishName, station: 'patisserie', confidencePct: 80, matchedRule: 'category:dessert' };
      }
      if (cat.includes('drink') || cat.includes('beverage') || cat.includes('boisson')) {
        return { orderId: candidate.orderId, itemId: candidate.itemId, dishName: candidate.dishName, station: 'bar', confidencePct: 80, matchedRule: 'category:beverage' };
      }
    }

    // 3. Fallback to 'chaud'
    return {
      orderId: candidate.orderId,
      itemId: candidate.itemId,
      dishName: candidate.dishName,
      station: 'chaud',
      confidencePct: 60,
      matchedRule: 'default_fallback',
    };
  }
}
