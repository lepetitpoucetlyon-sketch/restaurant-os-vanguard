'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { Bed, AlertTriangle, CheckCircle2, User, Clock, ShieldCheck, RefreshCw } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface ClinicBed {
  id: string;
  roomNumber: string;
  bedCode: string;
  unit: 'AMBULATOIRE' | 'HOSPITALISATION' | 'SURVEILLANCE' | 'REPOS';
  status: 'OCCUPIED' | 'AVAILABLE' | 'CLEANING_HDS' | 'RESERVED';
  patientName?: string;
  admissionDate?: string;
  expectedDischarge?: string;
}



export function BedManagementPage() {
  const { activeTenantId } = useTenant();
  const {
    data: beds,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<ClinicBed>('clinicBeds', { tenantId: activeTenantId ?? undefined });
  const [unitFilter, setUnitFilter] = useState<string>('all');

  const filtered = beds.filter(b => unitFilter === 'all' || b.unit === unitFilter);

  const occupiedCount = beds.filter(b => b.status === 'OCCUPIED').length;
  const availableCount = beds.filter(b => b.status === 'AVAILABLE').length;
  const cleaningCount = beds.filter(b => b.status === 'CLEANING_HDS').length;

  const handleUpdateStatus = async (id: string, newStatus: ClinicBed['status']) => {
    await update(id, { status: newStatus } as Partial<ClinicBed>);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🛏️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Gestion des Lits & Unités de Soins Ambulatoires"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Taux d'occupation en temps réel, rotation des boxes ambulatoires et bionettoyage certifié HDS."}
          </p>
        </div>

        <button
          onClick={() => void refresh()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          {"Actualiser lits"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Bed className="w-3.5 h-3.5 text-emerald-500" />
            {"Lits disponibles"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{availableCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-500" />
            {"Lits occupés"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{occupiedCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {"Bionettoyage en cours"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{cleaningCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            {"Taux d'occupation global"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((occupiedCount / beds.length) * 100).toFixed(0)} %
          </p>
        </div>
      </div>

      {/* Filtres Unités */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Toutes les unités' },
          { id: 'AMBULATOIRE', label: 'Chirurgie Ambulatoire' },
          { id: 'HOSPITALISATION', label: 'Hospitalisation' },
          { id: 'SURVEILLANCE', label: 'Surveillance Post-Intervention' },
        ].map(u => (
          <button
            key={u.id}
            onClick={() => setUnitFilter(u.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              unitFilter === u.id
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {u.label}
          </button>
        ))}
      </div>

      {/* Grille des Lits */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(bed => {
          const statusBadge = {
            AVAILABLE: { label: 'Disponible & Désinfecté', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
            OCCUPIED: { label: 'Occupé', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold' },
            CLEANING_HDS: { label: 'Protocole Bionettoyage', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
            RESERVED: { label: 'Réservé pour bloc', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300' },
          }[bed.status];

          return (
            <div key={bed.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-emerald-600" />
                      {bed.roomNumber} · <span className="font-mono text-xs text-text-muted">{bed.bedCode}</span>
                    </h3>
                    <p className="text-[10px] text-text-muted uppercase tracking-wider">{bed.unit}</p>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                {bed.patientName && (
                  <div className="p-2.5 rounded-lg bg-surface-base border border-border/60 text-xs space-y-1">
                    <p className="font-semibold text-text-primary">{bed.patientName}</p>
                    <p className="text-[11px] text-text-muted">
                      {"Admission :"} {bed.admissionDate} · {"Sortie prévue :"} {bed.expectedDischarge}
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-1.5">
                {bed.status === 'OCCUPIED' && (
                  <button
                    onClick={() => handleUpdateStatus(bed.id, 'CLEANING_HDS')}
                    className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-medium transition-colors"
                  >
                    {"Libérer lit"}
                  </button>
                )}
                {bed.status === 'CLEANING_HDS' && (
                  <button
                    onClick={() => handleUpdateStatus(bed.id, 'AVAILABLE')}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors"
                  >
                    {"Valider désinfection"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
