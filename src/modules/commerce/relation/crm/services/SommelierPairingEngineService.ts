import { NexusEventBus } from '@/shared/eventBus/NexusEventBus';

export interface WinePairingCandidate {
  wineSku: string;
  wineName: string;
  appellation: string;
  vintage: string;
  bottlesInStock: number;
  glassPriceInMicrounits: number;
  tags: string[]; // ['tannique', 'fruite', 'mineral', 'boise']
}

export interface DishProfile {
  dishSku: string;
  dishName: string;
  dishCategory: 'viande_rouge' | 'poisson_blanc' | 'crustaces' | 'volaille' | 'dessert_chocolat';
}

export interface SommelierRecommendation {
  dishSku: string;
  recommendedWine: WinePairingCandidate;
  sommelierTastingNote: string;
}

/**
 * SommelierPairingEngineService — Angle mort T73.
 * Sommelier numérique d'accords mets-vins au POS :
 * Recommande les références de vins en stock réel en cave qui subliment le plat sélectionné par le serveur.
 */
export class SommelierPairingEngineService {
  static recommendPairing(
    tenantId: string,
    orderId: string,
    dish: DishProfile,
    cellarWines: WinePairingCandidate[]
  ): SommelierRecommendation | null {
    const availableWines = cellarWines.filter(w => w.bottlesInStock > 0);
    if (availableWines.length === 0) return null;

    let match = availableWines[0];
    if (dish.dishCategory === 'viande_rouge') {
      match = availableWines.find(w => w.tags.includes('tannique') || w.tags.includes('boise')) || match;
    } else if (dish.dishCategory === 'poisson_blanc' || dish.dishCategory === 'crustaces') {
      match = availableWines.find(w => w.tags.includes('mineral') || w.tags.includes('fruite')) || match;
    }

    NexusEventBus.emit('commerce.sommelier_pairing_suggested', {
      v: 1,
      tenantId,
      orderId,
      dishSku: dish.dishSku,
      recommendedWineSku: match.wineSku,
      suggestedAt: Date.now(),
    });

    return {
      dishSku: dish.dishSku,
      recommendedWine: match,
      sommelierTastingNote: `Accord parfait avec ${dish.dishName} : ${match.wineName} (${match.appellation} ${match.vintage}).`,
    };
  }
}
