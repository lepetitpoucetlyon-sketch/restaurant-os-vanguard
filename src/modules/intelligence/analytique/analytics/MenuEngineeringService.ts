/**
 * L69 — Menu Engineering (matrice BCG Kasavana-Smith).
 *
 * La matrice Menu Engineering classe chaque plat selon 2 axes :
 *   - Popularité (% de commandes vs moyenne)
 *   - Marge contribution (prix de vente - coût matière)
 *
 * 4 catégories :
 *   - Stars     : haute popularité + haute marge → conserver, mettre en avant
 *   - Plowhorses: haute popularité + faible marge → repricing ou réduction coût
 *   - Puzzles   : faible popularité + haute marge → repositionner, formation staff
 *   - Dogs      : faible popularité + faible marge → envisager retrait de carte
 *
 * Cf. docs/anglemort-restaurant-mcc.md § L69.
 */

export type MenuCategory = 'star' | 'plowhorse' | 'puzzle' | 'dog';

export interface DishPerformance {
  dishId: string;
  name: string;
  ordersCount: number;
  sellingPriceInMicrounits: number;
  foodCostInMicrounits: number;
}

export interface MenuEngineeringResult {
  dishId: string;
  name: string;
  category: MenuCategory;
  contributionMarginInMicrounits: number;
  contributionMarginPct: number;
  popularityPct: number;
  isHighPopularity: boolean;
  isHighMargin: boolean;
}

export class MenuEngineeringService {
  static analyze(dishes: DishPerformance[]): MenuEngineeringResult[] {
    if (dishes.length === 0) return [];

    const totalOrders = dishes.reduce((s, d) => s + d.ordersCount, 0);
    const avgOrderShare = 1 / dishes.length;

    const margins = dishes.map(d => d.sellingPriceInMicrounits - d.foodCostInMicrounits);
    const avgMargin = margins.reduce((s, m) => s + m, 0) / dishes.length;

    return dishes.map((d, i) => {
      const margin = margins[i];
      const popularityPct = totalOrders > 0 ? (d.ordersCount / totalOrders) * 100 : 0;
      const isHighPopularity = totalOrders > 0 && (d.ordersCount / totalOrders) >= avgOrderShare;
      const isHighMargin = margin >= avgMargin;
      const contributionMarginPct = d.sellingPriceInMicrounits > 0
        ? (margin / d.sellingPriceInMicrounits) * 100
        : 0;

      let category: MenuCategory;
      if (isHighPopularity && isHighMargin) category = 'star';
      else if (isHighPopularity && !isHighMargin) category = 'plowhorse';
      else if (!isHighPopularity && isHighMargin) category = 'puzzle';
      else category = 'dog';

      return {
        dishId: d.dishId,
        name: d.name,
        category,
        contributionMarginInMicrounits: margin,
        contributionMarginPct: Math.round(contributionMarginPct * 10) / 10,
        popularityPct: Math.round(popularityPct * 10) / 10,
        isHighPopularity,
        isHighMargin,
      };
    });
  }

  static summarize(results: MenuEngineeringResult[]): Record<MenuCategory, number> {
    return {
      star: results.filter(r => r.category === 'star').length,
      plowhorse: results.filter(r => r.category === 'plowhorse').length,
      puzzle: results.filter(r => r.category === 'puzzle').length,
      dog: results.filter(r => r.category === 'dog').length,
    };
  }
}
