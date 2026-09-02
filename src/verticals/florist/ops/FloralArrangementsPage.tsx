'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { FlowerFreshnessService } from '../domain/FlowerFreshnessService';
import type { IFreshnessReport, IFlowerArrangement } from '../domain/types';

export function FloralArrangementsPage() {
  const { activeTenantId } = useTenant();
  const [report, setReport] = useState<IFreshnessReport | null>(null);
  const [arrangements, setArrangements] = useState<IFlowerArrangement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    Promise.all([
      FlowerFreshnessService.computeFreshnessReport(activeTenantId, start, end),
      FlowerFreshnessService.listArrangements(activeTenantId),
    ])
      .then(([r, a]) => {
        setReport(r);
        setArrangements(a);
      })
      .catch((e) => console.error('[FloralArrangementsPage]', e))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Calcul en cours…</div>;
  if (!report) return null;

  // CA des compositions livrées ce mois (chiffre d'affaires réalisé)
  const deliveredRevenueInMicrounits = arrangements
    .filter(a => a.status === 'delivered')
    .reduce((sum, a) => sum + a.priceInMicrounits, 0);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Compositions & Fraîcheur du Stock</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Lots reçus (mois)" value={report.totalLots} />
        <StatCard label="Frais" value={report.freshCount} />
        <StatCard label="Bientôt fanés" value={report.expiringSoonCount} />
        <StatCard label="Taux de perte" value={`${report.wastageRatePct.toFixed(1)}%`} />
        <StatCard label="CA livré (mois)" value={`${(deliveredRevenueInMicrounits / 1_000_000).toFixed(0)} €`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Composition</th>
              <th className="pb-2 pr-4">Fleuriste</th>
              <th className="pb-2 pr-4">Tiges</th>
              <th className="pb-2 pr-4">Prix</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {arrangements.map(a => (
              <tr key={a.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{a.recipeName}</td>
                <td className="py-2 pr-4">{a.floristName}</td>
                <td className="py-2 pr-4">{a.stemsUsed}</td>
                <td className="py-2 pr-4">{(a.priceInMicrounits / 1_000_000).toFixed(2)} €</td>
                <td className="py-2">{a.status}</td>
              </tr>
            ))}
            {arrangements.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400">Aucune composition enregistrée.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
