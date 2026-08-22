import { Nexus } from '@/lib/nexus/NexusAdapter';
import { toMicrounits, type Microunits } from '@/shared/schemas/primitives';

export type MenuItemCategory = 'star' | 'plow-horse' | 'puzzle' | 'dog';

export interface IMenuEngineeringItem {
  productId: string;
  name: string;
  quantitySold: number;
  priceInMicrounits: Microunits;
  foodCostInMicrounits: Microunits;
  contributionMarginInMicrounits: Microunits;
  foodCostPercent: number;
  popularityIndex: number;
  category: MenuItemCategory;
}

export interface IMenuEngineeringReport {
  periodStart: string;
  periodEnd: string;
  items: IMenuEngineeringItem[];
  avgContributionMarginInMicrounits: Microunits;
  avgPopularityIndex: number;
}

interface ComputeParams {
  tenantId: string;
  periodStart: string;
  periodEnd: string;
}

function classifyItem(
  popIndex: number,
  marginInMicrounits: number,
  avgPop: number,
  avgMargin: number,
): MenuItemCategory {
  const highPop = popIndex >= avgPop;
  const highMargin = marginInMicrounits >= avgMargin;

  if (highPop && highMargin) return 'star';
  if (highPop && !highMargin) return 'plow-horse';
  if (!highPop && highMargin) return 'puzzle';
  return 'dog';
}

class MenuEngineeringService {
  async computeReport({ tenantId, periodStart, periodEnd }: ComputeParams): Promise<IMenuEngineeringReport> {
    const [orders, products] = await Promise.all([
      Nexus.adapter.query<Record<string, unknown>>(`tenants/${tenantId}/orders`),
      Nexus.adapter.query<Record<string, unknown>>(`tenants/${tenantId}/products`),
    ]);

    const productMap = new Map<string, Record<string, unknown>>(
      products.map((p: Record<string, unknown>) => [p.id as string, p]),
    );

    const periodOrders = orders.filter((o: Record<string, unknown>) => {
      const d = (o.createdAt as string | undefined)?.slice(0, 10) ?? '';
      return d >= periodStart && d <= periodEnd;
    });

    const sold = new Map<string, { qty: number; priceInMicrounits: number }>();
    for (const order of periodOrders) {
      const lines = (order.lines ?? order.items ?? []) as Array<{
        productId: string;
        quantity: number;
        priceInMicrounits?: number;
      }>;
      for (const line of lines) {
        const existing = sold.get(line.productId) ?? { qty: 0, priceInMicrounits: line.priceInMicrounits ?? 0 };
        sold.set(line.productId, { qty: existing.qty + (line.quantity ?? 1), priceInMicrounits: existing.priceInMicrounits });
      }
    }

    const totalQty = [...sold.values()].reduce((s, v) => s + v.qty, 0) || 1;

    const rawItems: Omit<IMenuEngineeringItem, 'category'>[] = [];
    for (const [productId, { qty, priceInMicrounits }] of sold.entries()) {
      const product = productMap.get(productId);
      const foodCostInMicrounits = toMicrounits((product?.foodCostInMicrounits as number | undefined) ?? 0);
      const safePrice = toMicrounits(priceInMicrounits);
      const contributionMarginInMicrounits = toMicrounits(safePrice - foodCostInMicrounits);
      const foodCostPercent = safePrice > 0 ? (foodCostInMicrounits / safePrice) * 100 : 0;
      const popularityIndex = (qty / totalQty) * 100;
      rawItems.push({
        productId,
        name: (product?.name as string | undefined) ?? productId,
        quantitySold: qty,
        priceInMicrounits: safePrice,
        foodCostInMicrounits,
        contributionMarginInMicrounits,
        foodCostPercent,
        popularityIndex,
      });
    }

    const avgContributionMarginInMicrounits = toMicrounits(
      Math.round(
        rawItems.length > 0
          ? rawItems.reduce((s, i) => s + i.contributionMarginInMicrounits, 0) / rawItems.length
          : 0
      )
    );

    const avgPopularityIndex =
      rawItems.length > 0 ? rawItems.reduce((s, i) => s + i.popularityIndex, 0) / rawItems.length : 0;

    const items: IMenuEngineeringItem[] = rawItems.map(item => ({
      ...item,
      category: classifyItem(
        item.popularityIndex,
        item.contributionMarginInMicrounits,
        avgPopularityIndex,
        avgContributionMarginInMicrounits,
      ),
    }));

    return { periodStart, periodEnd, items, avgContributionMarginInMicrounits, avgPopularityIndex };
  }
}

export const menuEngineeringService = new MenuEngineeringService();
