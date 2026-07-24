"use client";

import { useState, useEffect } from "react";
import { BarChart2, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import type { Order } from "@/domain/schemas/orders";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DayRevenue {
  label: string;
  totalEur: number;
  count: number;
}

interface TopProduct {
  name: string;
  count: number;
}

interface FrequencyBucket {
  label: string;
  avgSpendEur: number;
  customerCount: number;
}

interface AnalyticsData {
  revenueByDay: DayRevenue[];
  topProducts: TopProduct[];
  spendByFrequency: FrequencyBucket[];
}

const DAY_LABELS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

// ---------------------------------------------------------------------------
// Data aggregation
// ---------------------------------------------------------------------------

function aggregateOrders(orders: Order[]): AnalyticsData {
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

// ---------------------------------------------------------------------------
// Pure SVG/CSS bar charts (no external lib)
// ---------------------------------------------------------------------------

function BarChartSVG({
  data,
  valueKey,
  labelKey,
  color = "#c5a059",
  formatValue,
}: {
  data: Record<string, number | string>[];
  valueKey: string;
  labelKey: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const values = data.map((d) => Number(d[valueKey]));
  const max = Math.max(...values, 0.01);
  const W = 500;
  const H = 120;
  const barW = Math.floor(W / data.length) - 6;
  const fmt = formatValue ?? ((v: number) => v.toFixed(0));

  return (
    <svg viewBox={`0 0 ${W} ${H + 32}`} width="100%" aria-hidden="true">
      {data.map((d, i) => {
        const v = Number(d[valueKey]);
        const barH = max > 0 ? (v / max) * H : 0;
        const x = i * (W / data.length) + 3;
        const y = H - barH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={barH}
              rx={4}
              fill={color}
              opacity={barH === 0 ? 0.15 : 0.85}
            />
            {/* value label on top */}
            {barH > 0 && (
              <text
                x={x + barW / 2}
                y={Math.max(y - 4, 8)}
                textAnchor="middle"
                fontSize={9}
                fill={color}
                fontFamily="monospace"
              >
                {fmt(v)}
              </text>
            )}
            {/* x-axis label */}
            <text
              x={x + barW / 2}
              y={H + 18}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(255,255,255,0.4)"
              fontFamily="sans-serif"
            >
              {String(d[labelKey])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function HorizontalBarsSVG({
  items,
  max,
  color = "#c5a059",
}: {
  items: { label: string; value: number }[];
  max: number;
  color?: string;
}) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => {
        const pct = max > 0 ? (item.value / max) * 100 : 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
              style={{ background: `${color}22`, color }}
            >
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-text-primary font-medium truncate pr-2">{item.label}</span>
                <span className="text-text-muted font-mono shrink-0">{item.value}×</span>
              </div>
              <div className="h-1.5 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, background: color }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function BasketAnalysis() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const orders = await Nexus.adapter.query<Order>("orders", {
          limit: 500,
          orderBy: { field: "createdAt", direction: "desc" },
        }).catch(() => [] as Order[]);
        if (cancelled) return;
        setData(aggregateOrders(orders));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-text-muted">
        <Loader2 className="w-5 h-5 animate-spin mr-2" />
        Analyse des commandes...
      </div>
    );
  }

  if (!data) return null;

  const maxProduct = data.topProducts.length > 0 ? data.topProducts[0].count : 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-action-primary/10 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-action-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-text-primary">Analyse du Panier</h2>
          <p className="text-xs text-text-muted">Basé sur les 500 dernières commandes</p>
        </div>
      </div>

      {/* Chart 1: Revenue by day of week */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-action-primary" />
          <h3 className="text-sm font-semibold text-text-primary">CA par jour de la semaine</h3>
        </div>
        {data.revenueByDay.every((d) => d.totalEur === 0) ? (
          <p className="text-xs text-text-muted text-center py-6">Aucune donnée disponible</p>
        ) : (
          <BarChartSVG
            data={data.revenueByDay.map((d) => ({ label: d.label, value: d.totalEur }))}
            valueKey="value"
            labelKey="label"
            formatValue={(v) => `${v.toFixed(0)}€`}
          />
        )}
      </div>

      {/* Chart 2: Top 5 products */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <ShoppingBag className="w-4 h-4 text-action-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Top 5 produits commandés</h3>
        </div>
        {data.topProducts.length === 0 ? (
          <p className="text-xs text-text-muted text-center py-6">Aucune donnée disponible</p>
        ) : (
          <HorizontalBarsSVG
            items={data.topProducts.map((p) => ({ label: p.name, value: p.count }))}
            max={maxProduct}
          />
        )}
      </div>

      {/* Chart 3: Average spend by visit frequency */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="w-4 h-4 text-action-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Dépense moy. par fréquence de visite</h3>
        </div>
        {data.spendByFrequency.every((b) => b.avgSpendEur === 0) ? (
          <p className="text-xs text-text-muted text-center py-6">Aucune donnée disponible</p>
        ) : (
          <div className="space-y-3">
            {data.spendByFrequency.map((bucket, i) => {
              const maxSpend = Math.max(...data.spendByFrequency.map((b) => b.avgSpendEur), 0.01);
              const pct = (bucket.avgSpendEur / maxSpend) * 100;
              return (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-text-muted w-20 shrink-0">{bucket.label}</span>
                  <div className="flex-1 h-5 rounded-lg bg-border overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-action-primary transition-all duration-700 flex items-center justify-end pr-2"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 20 && (
                        <span className="text-[10px] font-mono font-bold text-white whitespace-nowrap">
                          {bucket.avgSpendEur.toFixed(0)}€
                        </span>
                      )}
                    </div>
                  </div>
                  {pct <= 20 && (
                    <span className="text-[10px] font-mono text-text-muted w-10 shrink-0">
                      {bucket.avgSpendEur.toFixed(0)}€
                    </span>
                  )}
                  <span className="text-[10px] text-text-muted w-16 shrink-0 text-right">
                    {bucket.customerCount} client{bucket.customerCount !== 1 ? "s" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
