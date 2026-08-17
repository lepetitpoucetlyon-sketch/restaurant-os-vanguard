import type { Order } from "@/modules/ops";

export interface DayRevenue {
  label: string;
  totalEur: number;
  count: number;
}

export interface TopProduct {
  name: string;
  count: number;
}

export interface FrequencyBucket {
  label: string;
  avgSpendEur: number;
  customerCount: number;
}

export interface AnalyticsData {
  revenueByDay: DayRevenue[];
  topProducts: TopProduct[];
  spendByFrequency: FrequencyBucket[];
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export function aggregateOrders(orders: Order[]): AnalyticsData {
  // 1. Revenue by day of week
  const dayTotals: Record<number, { totalMu: number; count: number }> = {};
  for (let d = 0; d < 7; d++) dayTotals[d] = { totalMu: 0, count: 0 };

  // 2. Top products
  const productCounts: Record<string, { name: string; count: number }> = {};

  // 3. Per-customer spending for frequency analysis
  const customerSpend: Record<string, { total: number; orders: number }> = {};

  const paid = orders.filter((o) => o.status === "paid" || o.status === "served");

  for (const order of paid) {
    const day = new Date(order.createdAt).getDay();
    const mu = order.totalInMicrounits ?? ((order.totalInCents ?? 0) * 10_000);
    dayTotals[day].totalMu += mu;
    dayTotals[day].count += 1;

    // Products
    for (const item of order.items) {
      const key = item.productId ?? item.name;
      if (!productCounts[key]) {
        productCounts[key] = { name: item.name, count: 0 };
      }
      productCounts[key].count += item.quantity;
    }

    // Customer frequency
    const cid = order.customerId ?? "__anon__";
    if (!customerSpend[cid]) customerSpend[cid] = { total: 0, orders: 0 };
    customerSpend[cid].total += mu / 1_000_000;
    customerSpend[cid].orders += 1;
  }

  const revenueByDay: DayRevenue[] = DAY_LABELS.map((label, i) => ({
    label,
    totalEur: dayTotals[i].totalMu / 1_000_000,
    count: dayTotals[i].count,
  }));

  const topProducts: TopProduct[] = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Frequency buckets: 1 visit, 2-5, 6+
  const buckets: FrequencyBucket[] = [
    { label: "1 visite", avgSpendEur: 0, customerCount: 0 },
    { label: "2–5 visites", avgSpendEur: 0, customerCount: 0 },
    { label: "6+ visites", avgSpendEur: 0, customerCount: 0 },
  ];
  const bucketsRaw: { totalSpend: number; count: number }[] = [
    { totalSpend: 0, count: 0 },
    { totalSpend: 0, count: 0 },
    { totalSpend: 0, count: 0 },
  ];

  for (const { total, orders: n } of Object.values(customerSpend)) {
    const bi = n === 1 ? 0 : n <= 5 ? 1 : 2;
    bucketsRaw[bi].totalSpend += total;
    bucketsRaw[bi].count += 1;
  }

  for (let i = 0; i < 3; i++) {
    buckets[i].customerCount = bucketsRaw[i].count;
    buckets[i].avgSpendEur = bucketsRaw[i].count > 0
      ? bucketsRaw[i].totalSpend / bucketsRaw[i].count
      : 0;
  }

  return { revenueByDay, topProducts, spendByFrequency: buckets };
}
