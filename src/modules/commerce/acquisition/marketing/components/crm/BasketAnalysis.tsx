"use client";

import { useState, useEffect } from "react";
import { BarChart2, ShoppingBag, TrendingUp, Loader2 } from "lucide-react";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import type { Order } from "@/modules/ops";

import {
  type AnalyticsData,
  aggregateOrders,
} from "./basket-analysis/basketAnalysisAggregator";
import { useLanguage } from "@/shared/hooks";
import {
  BarChartSVG,
  HorizontalBarsSVG,
} from "./basket-analysis/BasketCharts";

export function BasketAnalysis() {
    const { t } = useLanguage();
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
          <p className="text-xs text-text-muted">{t('commerce.crm.basketBasis')}</p>
        </div>
      </div>

      {/* Chart 1: Revenue by day of week */}
      <div className="p-5 rounded-2xl bg-surface-card border border-border">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-action-primary" />
          <h3 className="text-sm font-semibold text-text-primary">CA par jour de la semaine</h3>
        </div>
        {data.revenueByDay.every((d) => d.totalEur === 0) ? (
          <p className="text-xs text-text-muted text-center py-6">{t('commerce.crm.noData')}</p>
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
          <h3 className="text-sm font-semibold text-text-primary">{t('commerce.crm.top5Products')}</h3>
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
          <h3 className="text-sm font-semibold text-text-primary">{t('commerce.crm.avgSpendByFrequency')}</h3>
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
                        <span className="text-nano font-mono font-bold text-text-primary whitespace-nowrap">
                          {bucket.avgSpendEur.toFixed(0)}€
                        </span>
                      )}
                    </div>
                  </div>
                  {pct <= 20 && (
                    <span className="text-nano font-mono text-text-muted w-10 shrink-0">
                      {bucket.avgSpendEur.toFixed(0)}€
                    </span>
                  )}
                  <span className="text-nano text-text-muted w-16 shrink-0 text-right">
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
