'use client';

import { useState, useEffect } from 'react';
import { menuEngineeringService } from '@/modules/commerce';
import type { IMenuEngineeringReport, MenuItemCategory } from '@/modules/commerce';
import { useTenant } from '@/shared/hooks/useTenant';
import { TrendingUp, Star, DollarSign, HelpCircle, AlertOctagon } from 'lucide-react';
import { BentoGrid, BentoCell, StatCard } from '@/shared/components/ui';

const CATEGORY_LABELS: Record<MenuItemCategory, string> = {
  star: '⭐ Star',
  'plow-horse': '🐴 Vache à lait',
  puzzle: '🧩 Puzzle',
  dog: '🐶 Poids mort',
};

const CATEGORY_COLOR: Record<MenuItemCategory, string> = {
  star: '#22c55e',
  'plow-horse': '#3b82f6',
  puzzle: '#f59e0b',
  dog: '#ef4444',
};

export function MenuEngineeringDashboard() {
  const { activeTenantId } = useTenant();
  const [report, setReport] = useState<IMenuEngineeringReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    menuEngineeringService
      .computeReport({ tenantId: activeTenantId, periodStart: start, periodEnd: end })
      .then(setReport)
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-text-muted">
        <div className="w-5 h-5 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
        <span className="text-sm font-semibold">Calcul de l'ingénierie des menus…</span>
      </div>
    );
  }
  if (!report) return null;

  return (
    <div className="p-6 lg:p-8 space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-accent" />
            <h1 className="text-2xl font-black text-text-primary">Menu Engineering</h1>
          </div>
          <p className="text-sm text-text-muted">
            Période du {report.periodStart} au {report.periodEnd} —{' '}
            <span className="font-bold text-text-primary">{report.items.length}</span> plats analysés (Matrice BCG)
          </p>
        </div>
      </div>

      {/* BCG 4-Quadrant Bento Summary */}
      <BentoGrid layout="asymmetric-4">
        <BentoCell span={1}>
          <StatCard
            label="⭐ Stars"
            value={String(report.items.filter(i => i.category === 'star').length)}
            icon={<Star className="w-5 h-5" />}
            intent="success"
          />
        </BentoCell>
        <BentoCell span={1}>
          <StatCard
            label="🐴 Vaches à Lait"
            value={String(report.items.filter(i => i.category === 'plow-horse').length)}
            icon={<DollarSign className="w-5 h-5" />}
            intent="brand"
          />
        </BentoCell>
        <BentoCell span={1}>
          <StatCard
            label="🧩 Puzzles"
            value={String(report.items.filter(i => i.category === 'puzzle').length)}
            icon={<HelpCircle className="w-5 h-5" />}
            intent="warning"
          />
        </BentoCell>
        <BentoCell span={1}>
          <StatCard
            label="🐶 Poids Morts"
            value={String(report.items.filter(i => i.category === 'dog').length)}
            icon={<AlertOctagon className="w-5 h-5" />}
            intent="danger"
          />
        </BentoCell>
      </BentoGrid>

      <div className="bg-surface-card dark:bg-bg-secondary rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-primary/50 dark:bg-bg-tertiary/50 text-left text-text-muted font-bold text-xs uppercase tracking-wider">
                <th className="py-3.5 px-4">Plat</th>
                <th className="py-3.5 px-4 text-right">Vendu</th>
                <th className="py-3.5 px-4 text-right">Popularité</th>
                <th className="py-3.5 px-4 text-right">Food Cost %</th>
                <th className="py-3.5 px-4 text-right">Marge (€)</th>
                <th className="py-3.5 px-4">Catégorie</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {report.items.map(item => (
                <tr key={item.productId} className="hover:bg-bg-tertiary/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-text-primary">{item.name}</td>
                  <td className="py-3 px-4 text-right font-medium text-text-secondary">{item.quantitySold}</td>
                  <td className="py-3 px-4 text-right font-medium text-text-secondary">{item.popularityIndex.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-medium text-text-secondary">{item.foodCostPercent.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-black text-accent">
                    {(item.contributionMarginInMicrounits / 1_000_000).toFixed(2)} €
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="px-2.5 py-1 rounded-lg text-white text-xs font-bold shadow-sm inline-block"
                      style={{ background: CATEGORY_COLOR[item.category] }}
                    >
                      {CATEGORY_LABELS[item.category]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
