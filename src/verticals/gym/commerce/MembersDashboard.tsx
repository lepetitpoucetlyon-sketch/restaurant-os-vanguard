'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { MembershipAnalyticsService } from '../domain/MembershipAnalyticsService';
import type { IMembershipChurnReport, IMembership } from '../domain/types';

export function MembersDashboard() {
  const { activeTenantId } = useTenant();
  const [report, setReport] = useState<IMembershipChurnReport | null>(null);
  const [memberships, setMemberships] = useState<IMembership[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    Promise.all([
      MembershipAnalyticsService.computeChurnReport(activeTenantId, start, end),
      MembershipAnalyticsService.listMemberships(activeTenantId),
    ])
      .then(([r, m]) => {
        setReport(r);
        setMemberships(m);
      })
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Calcul en cours…</div>;
  if (!report) return null;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Membres & Abonnements</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Actifs" value={report.activeCount} />
        <StatCard label="Gelés" value={report.frozenCount} />
        <StatCard label="Taux de churn" value={`${report.churnRatePct.toFixed(1)}%`} />
        <StatCard label="Revenu récurrent mensuel" value={`${(report.monthlyRecurringRevenueInMicrounits / 1_000_000).toFixed(0)} €`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Membre</th>
              <th className="pb-2 pr-4">Plan</th>
              <th className="pb-2 pr-4">Statut</th>
              <th className="pb-2">Expire le</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map(m => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{m.memberName}</td>
                <td className="py-2 pr-4">{m.plan}</td>
                <td className="py-2 pr-4">{m.status}</td>
                <td className="py-2">{m.expiresAt}</td>
              </tr>
            ))}
            {memberships.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucun adhérent enregistré.</td></tr>
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
