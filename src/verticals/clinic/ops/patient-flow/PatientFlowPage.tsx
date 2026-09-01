'use client';

import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import React, { useState } from 'react';
import { User, Clock, Stethoscope, CheckCircle2, AlertCircle, Plus, Search, ShieldCheck } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface PatientVisit {
  id: string;
  patientName: string;
  nirMasked: string; // Secu 1 85 ...
  practitioner: string;
  specialty: string;
  arrivalTime: string;
  consultationType: 'CONSULTATION' | 'URGENCE' | 'CONTROLE' | 'TELECONSULTATION';
  status: 'WAITING_ROOM' | 'IN_CONSULTATION' | 'EXAMS' | 'BILLING' | 'DISCHARGED';
}



export function PatientFlowPage() {
  const { activeTenantId } = useTenant();
  const {
    data: patients,
    isLoading,
    update,
    refresh,
  } = useSovereignCollection<PatientVisit>('patientVisits', { tenantId: activeTenantId ?? undefined });
  const [search, setSearch] = useState('');

  const filtered = patients.filter(p =>
    p.patientName.toLowerCase().includes(search.toLowerCase()) ||
    p.practitioner.toLowerCase().includes(search.toLowerCase()) ||
    p.nirMasked.includes(search)
  );

  const waitingCount = patients.filter(p => p.status === 'WAITING_ROOM').length;
  const inConsultCount = patients.filter(p => p.status === 'IN_CONSULTATION').length;
  const inExamsCount = patients.filter(p => p.status === 'EXAMS').length;

  const handleAdvanceStatus = async (id: string, nextStatus: PatientVisit['status']) => {
    await update(id, { status: nextStatus } as Partial<PatientVisit>);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🏥"}</span>
            <h1 className="text-xl font-bold font-serif">{"File Active & Parcours Patient (HDS)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"File d'attente en temps réel, orientation cabinet/examens et respect de la confidentialité HDS."}
          </p>
        </div>

        <button
          onClick={() => alert("Admission rapide patient...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Admettre un patient"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            {"En salle d'attente"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{waitingCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-emerald-500" />
            {"En consultation"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{inConsultCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {"Temps d'attente moyen"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{"11 min"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-500" />
            {"Conformité HDS / PII"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"100 %"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom de patient, praticien ou N° Sécurité Sociale..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Grille Parcours Patients */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(pat => {
          const statusBadge = {
            WAITING_ROOM: { label: 'En salle d\'attente', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
            IN_CONSULTATION: { label: 'En cabinet médecin', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold' },
            EXAMS: { label: 'Examens / Soins', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
            BILLING: { label: 'Facturation / Sortie', bg: 'bg-purple-500/15 text-purple-700 dark:text-purple-300' },
            DISCHARGED: { label: 'Sortie validée', bg: 'bg-zinc-500/10 text-zinc-600' },
          }[pat.status];

          return (
            <div key={pat.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-text-primary">{pat.patientName}</h3>
                    <p className="font-mono text-[11px] text-text-muted">{pat.nirMasked}</p>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-base border border-border/60 text-xs space-y-1">
                  <p className="font-semibold text-text-primary flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
                    {pat.practitioner}
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {"Motif :"} {pat.consultationType} ({pat.specialty}) · {"Arrivée à"} {pat.arrivalTime}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-1.5">
                {pat.status === 'WAITING_ROOM' && (
                  <button
                    onClick={() => handleAdvanceStatus(pat.id, 'IN_CONSULTATION')}
                    className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors"
                  >
                    {"Appeler en cabinet"}
                  </button>
                )}
                {pat.status === 'IN_CONSULTATION' && (
                  <button
                    onClick={() => handleAdvanceStatus(pat.id, 'BILLING')}
                    className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium transition-colors"
                  >
                    {"Terminer consultation"}
                  </button>
                )}
                {pat.status === 'BILLING' && (
                  <button
                    onClick={() => handleAdvanceStatus(pat.id, 'DISCHARGED')}
                    className="px-2.5 py-1 rounded bg-accent text-text-on-accent text-[11px] font-medium transition-colors"
                  >
                    {"Valider FSE & sortie"}
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
