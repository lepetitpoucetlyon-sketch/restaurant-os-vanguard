'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { OccupancyAnalyticsService } from '../domain/OccupancyAnalyticsService';
import type { IOccupancyReport, IDeskBooking } from '../domain/types';

export function DeskMapPage() {
  const { activeTenantId } = useTenant();
  const [report, setReport] = useState<IOccupancyReport | null>(null);
  const [bookings, setBookings] = useState<IDeskBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    Promise.all([
      OccupancyAnalyticsService.computeOccupancyReport(activeTenantId, start, end),
      OccupancyAnalyticsService.listBookings(activeTenantId),
    ])
      .then(([r, b]) => {
        setReport(r);
        setBookings(b);
      })
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Calcul en cours…</div>;
  if (!report) return null;

  // Part des bureaux privés dans les réservations (mix produit — pilotage tarifaire)
  const privateOfficeSharePct = bookings.length
    ? (bookings.filter(b => b.deskType === 'private-office').length / bookings.length) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Plan Bureaux & Salles</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Réservations (mois)" value={report.totalBookings} />
        <StatCard label="Check-ins" value={report.checkedInCount} />
        <StatCard label="No-shows" value={report.noShowCount} />
        <StatCard label="Taux d'occupation" value={`${report.occupancyRatePct.toFixed(1)}%`} />
        <StatCard label="Part bureaux privés" value={`${privateOfficeSharePct.toFixed(1)}%`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Bureau</th>
              <th className="pb-2 pr-4">Type</th>
              <th className="pb-2 pr-4">Membre</th>
              <th className="pb-2 pr-4">Créneau</th>
              <th className="pb-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{b.deskLabel}</td>
                <td className="py-2 pr-4">{b.deskType}</td>
                <td className="py-2 pr-4">{b.memberName}</td>
                <td className="py-2 pr-4">
                  {new Date(b.startsAt).toLocaleString('fr-FR')} → {new Date(b.endsAt).toLocaleTimeString('fr-FR')}
                </td>
                <td className="py-2">{b.status}</td>
              </tr>
            ))}
            {bookings.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-center text-gray-400">Aucune réservation de bureau.</td></tr>
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
