'use client';

import { useState, useEffect } from 'react';
import { menuEngineeringService } from '@/modules/commerce';
import type { IMenuEngineeringReport, MenuItemCategory } from '@/modules/commerce';
import { useTenant } from '@/shared/hooks/useTenant';

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

  if (loading) return <div className="p-6 text-sm text-gray-500">Calcul en cours…</div>;
  if (!report) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Menu Engineering</h1>
      <p className="text-sm text-gray-500">
        Période {report.periodStart} → {report.periodEnd} —{' '}
        {report.items.length} plats analysés
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Plat</th>
              <th className="pb-2 pr-4 text-right">Vendu</th>
              <th className="pb-2 pr-4 text-right">Popularité</th>
              <th className="pb-2 pr-4 text-right">Coût %</th>
              <th className="pb-2 pr-4 text-right">Marge (€)</th>
              <th className="pb-2">Catégorie</th>
            </tr>
          </thead>
          <tbody>
            {report.items.map(item => (
              <tr key={item.productId} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{item.name}</td>
                <td className="py-2 pr-4 text-right">{item.quantitySold}</td>
                <td className="py-2 pr-4 text-right">{item.popularityIndex.toFixed(1)}%</td>
                <td className="py-2 pr-4 text-right">{item.foodCostPercent.toFixed(1)}%</td>
                <td className="py-2 pr-4 text-right">
                  {(item.contributionMarginInMicrounits / 1_000_000).toFixed(2)} €
                </td>
                <td className="py-2">
                  <span
                    className="px-2 py-0.5 rounded text-white text-xs font-medium"
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
  );
}
