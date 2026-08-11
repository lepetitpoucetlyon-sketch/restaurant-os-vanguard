/**
 * MenuEngineeringHandler — Intelligence 9.1 : calcul BCG matrice menu
 *
 * Écoute `intelligence.menu_engineering_requested`, récupère les données de ventes
 * et de food cost, calcule la matrice BCG (Stars / Plowhorses / Puzzles / Dogs)
 * et émet `intelligence.bcg_calculated` avec le résultat.
 *
 * Matrice BCG menu (méthode Miller) :
 *   Stars     : popularité ≥ seuil ET marge ≥ seuil
 *   Plowhorses: popularité ≥ seuil ET marge < seuil
 *   Puzzles   : popularité < seuil ET marge ≥ seuil
 *   Dogs      : popularité < seuil ET marge < seuil
 */
import { NexusEventBus } from '../NexusEventBus';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { logger } from '@/lib/logger';
import { empireAudit } from '@/lib/audit';

interface ProductSalesData {
  productId: string;
  productName: string;
  salesCount: number;
  priceInMicrounits: number;
  foodCostInMicrounits: number;
}

function calculateBCGMatrix(products: ProductSalesData[]): {
  stars: string[]; plowhorses: string[]; puzzles: string[]; dogs: string[];
} {
  if (products.length === 0) return { stars: [], plowhorses: [], puzzles: [], dogs: [] };

  const totalSales = products.reduce((s, p) => s + p.salesCount, 0);
  const avgSalesCount = totalSales / products.length;

  // Marge brute = (prix - food cost) / prix
  const margins = products.map(p => ({
    id: p.productId,
    name: p.productName,
    salesCount: p.salesCount,
    margin: p.priceInMicrounits > 0
      ? (p.priceInMicrounits - p.foodCostInMicrounits) / p.priceInMicrounits
      : 0,
  }));

  const avgMargin = margins.reduce((s, m) => s + m.margin, 0) / margins.length;

  const stars: string[] = [];
  const plowhorses: string[] = [];
  const puzzles: string[] = [];
  const dogs: string[] = [];

  for (const m of margins) {
    const highPopularity = m.salesCount >= avgSalesCount;
    const highMargin = m.margin >= avgMargin;

    if (highPopularity && highMargin) stars.push(m.id);
    else if (highPopularity && !highMargin) plowhorses.push(m.id);
    else if (!highPopularity && highMargin) puzzles.push(m.id);
    else dogs.push(m.id);
  }

  return { stars, plowhorses, puzzles, dogs };
}

export function registerMenuEngineeringHandler(): () => void {
  return NexusEventBus.on(
    'intelligence.menu_engineering_requested',
    async (payload) => {
      const { tenantId, periodDays } = payload;

      try {
        const periodStart = new Date(Date.now() - periodDays * 86400_000).toISOString();

        // Récupérer les lignes de vente avec food cost
        const products = await Nexus.adapter.query<ProductSalesData>(
          `tenants/${tenantId}/products`,
          { where: [{ field: 'active', operator: '==', value: true }] }
        );

        // Enrichir avec le volume de ventes de la période
        const salesMap = new Map<string, number>();
        const orderItems = await Nexus.adapter.query<{ productId: string; quantity: number; placedAt?: string }>(
          `tenants/${tenantId}/orderLines`,
          {
            where: [{ field: 'placedAt', operator: '>=', value: periodStart }],
            limit: 5000,
          }
        ).catch(() => [] as { productId: string; quantity: number }[]);

        for (const line of orderItems) {
          salesMap.set(line.productId, (salesMap.get(line.productId) ?? 0) + (line.quantity ?? 1));
        }

        const enriched: ProductSalesData[] = products.map(p => ({
          productId: p.productId,
          productName: p.productName,
          salesCount: salesMap.get(p.productId) ?? 0,
          priceInMicrounits: p.priceInMicrounits,
          foodCostInMicrounits: p.foodCostInMicrounits,
        }));

        const bcg = calculateBCGMatrix(enriched);
        const calculatedAt = new Date().toISOString();

        // Persister le résultat
        const resultId = `bcg_${tenantId}_${Date.now()}`;
        await Nexus.adapter.set(
          `tenants/${tenantId}/menuEngineeringResults/${resultId}`,
          {
            id: resultId,
            periodDays,
            periodStart,
            ...bcg,
            calculatedAt,
            productCount: products.length,
          }
        );

        // Émettre le résultat
        await NexusEventBus.emit('intelligence.bcg_calculated', {
          tenantId,
          ...bcg,
          calculatedAt,
        });

        logger.info(
          `[MenuEngineering] BCG calculé — Stars:${bcg.stars.length} Plowhorses:${bcg.plowhorses.length} Puzzles:${bcg.puzzles.length} Dogs:${bcg.dogs.length}`
        );

        empireAudit.log({
          module: 'system',
          action: 'MENU_ENGINEERING_CALCULATED',
          details: { periodDays, productCount: products.length, stars: bcg.stars.length, dogs: bcg.dogs.length },
          severity: 'low',
          timestamp: new Date(),
        });
      } catch (err) {
        logger.error('[MenuEngineering] Erreur calcul BCG', err);
        throw err;
      }
    },
    { id: 'menu-engineering', priority: 'BACKGROUND' }
  );
}
