'use client';

import { useState, useEffect } from 'react';
import { useTenant } from '@/shared/hooks/useTenant';
import { CareLoadAnalyticsService } from '../domain/CareLoadAnalyticsService';
import type { ICareLoadReport, IPetRecord } from '../domain/types';

export function PetRecordsPage() {
  const { activeTenantId } = useTenant();
  const [report, setReport] = useState<ICareLoadReport | null>(null);
  const [patients, setPatients] = useState<IPetRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeTenantId) return;
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const end = today.toISOString().slice(0, 10);

    Promise.all([
      CareLoadAnalyticsService.computeCareLoadReport(activeTenantId, start, end),
      CareLoadAnalyticsService.listPatients(activeTenantId),
    ])
      .then(([r, p]) => {
        setReport(r);
        setPatients(p);
      })
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  if (loading) return <div className="p-6 text-sm text-gray-500">Calcul en cours…</div>;
  if (!report) return null;

  // Taux d'identification ICAD (puce) — KPI de conformité réglementaire vétérinaire
  const chippedPct = patients.length
    ? (patients.filter(p => p.chipId).length / patients.length) * 100
    : 0;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Animaux & Propriétaires</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Patients" value={report.totalPatients} />
        <StatCard label="Consultations (mois)" value={report.totalConsultations} />
        <StatCard label="Moy. consult./patient" value={report.avgConsultationsPerPatient.toFixed(1)} />
        <StatCard label="Rappels vaccins dus" value={report.vaccinesDueCount} />
        <StatCard label="% pucés (ICAD)" value={`${chippedPct.toFixed(0)}%`} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2 pr-4">Animal</th>
              <th className="pb-2 pr-4">Espèce</th>
              <th className="pb-2 pr-4">Propriétaire</th>
              <th className="pb-2">Dernière consultation</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="py-2 pr-4 font-medium">{p.petName}</td>
                <td className="py-2 pr-4">{p.species}</td>
                <td className="py-2 pr-4">{p.ownerName}</td>
                <td className="py-2">{p.lastConsultationAt ?? '—'}</td>
              </tr>
            ))}
            {patients.length === 0 && (
              <tr><td colSpan={4} className="py-4 text-center text-gray-400">Aucun animal enregistré.</td></tr>
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
