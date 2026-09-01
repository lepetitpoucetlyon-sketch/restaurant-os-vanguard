'use client';

import React, { useState } from 'react';
import { Wrench, Car, Clock, CheckCircle2, AlertTriangle, User, Plus, Search } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface RepairJob {
  id: string; // OR-2026-XXXX
  licensePlate: string;
  vehicleModel: string;
  customerName: string;
  operationType: 'REVISION' | 'BRAKES' | 'DIAGNOSTIC' | 'TIRES' | 'ENGINE';
  bayId: string;
  mechanic: string;
  scheduledTime: string;
  durationHours: number;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'WAITING_PARTS' | 'READY_DELIVERY' | 'COMPLETED';
}

const INITIAL_JOBS: RepairJob[] = [
  { id: 'OR-2026-0811', licensePlate: 'GH-452-KL', vehicleModel: 'Peugeot 3008 1.5 BlueHDi', customerName: 'M. Eric Mercier', operationType: 'REVISION', bayId: 'Pont 01 (2 Colonnes)', mechanic: 'Karim (Chef Atelier)', scheduledTime: '08:30', durationHours: 2.0, status: 'IN_PROGRESS' },
  { id: 'OR-2026-0812', licensePlate: 'AB-891-CD', vehicleModel: 'Renault Clio V TCe 90', customerName: 'Mme Nathalie Roux', operationType: 'BRAKES', bayId: 'Pont 02 (Ciseaux)', mechanic: 'David (Mécanicien)', scheduledTime: '10:30', durationHours: 1.5, status: 'SCHEDULED' },
  { id: 'OR-2026-0813', licensePlate: 'EF-123-GH', vehicleModel: 'Volkswagen Golf 8 2.0 TDI', customerName: 'Flotte BTP Lyonnaise', operationType: 'DIAGNOSTIC', bayId: 'Zone Diagnostic Valise', mechanic: 'Karim (Chef Atelier)', scheduledTime: '14:00', durationHours: 1.0, status: 'WAITING_PARTS' },
  { id: 'OR-2026-0814', licensePlate: 'IJ-456-KL', vehicleModel: 'Toyota Yaris Hybride', customerName: 'M. Patrick Simon', operationType: 'TIRES', bayId: 'Espace Pneumatiques', mechanic: 'David (Mécanicien)', scheduledTime: '15:30', durationHours: 0.75, status: 'READY_DELIVERY' },
];

export function WorkshopSchedulingPage() {
  const { activeTenantId } = useTenant();
  const [jobs, setJobs] = useState<RepairJob[]>(INITIAL_JOBS);
  const [search, setSearch] = useState('');

  const filtered = jobs.filter(j =>
    j.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
    j.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
    j.customerName.toLowerCase().includes(search.toLowerCase())
  );

  const inProgressCount = jobs.filter(j => j.status === 'IN_PROGRESS').length;
  const readyCount = jobs.filter(j => j.status === 'READY_DELIVERY').length;
  const waitingPartsCount = jobs.filter(j => j.status === 'WAITING_PARTS').length;

  const handleUpdateStatus = (id: string, newStatus: RepairJob['status']) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status: newStatus } : j));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🔧"}</span>
            <h1 className="text-xl font-bold font-serif">{"Planning Atelier & Ordres de Réparation (OR)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Affectation des ponts élévateurs, suivi des diagnostics valise OBD et délivrance des véhicules."}
          </p>
        </div>

        <button
          onClick={() => alert("Création d'un Ordre de Réparation...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Nouvel Ordre de Réparation"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 text-orange-500" />
            {"Véhicules sur les ponts"}
          </p>
          <p className="text-2xl font-bold font-mono text-orange-600">{inProgressCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {"Prêts pour restitution"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{readyCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {"Attente pièces détachées"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{waitingPartsCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {"Taux d'occupation atelier"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{"92.0 %"}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par immatriculation, modèle de véhicule ou client..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-orange-500 focus:outline-none"
        />
      </div>

      {/* Cartes des Véhicules en Atelier */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(job => {
          const statusBadge = {
            SCHEDULED: { label: 'Programmé', bg: 'bg-zinc-500/10 text-zinc-600' },
            IN_PROGRESS: { label: 'Sur le pont (En cours)', bg: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 font-bold' },
            WAITING_PARTS: { label: 'Attente livraison pièces', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
            READY_DELIVERY: { label: 'Prêt pour restitution', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold' },
            COMPLETED: { label: 'Facturé & Restitué', bg: 'bg-blue-500/10 text-blue-600' },
          }[job.status];

          return (
            <div key={job.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2.5 py-1 rounded bg-surface-base border border-border font-bold text-text-primary">
                      {job.licensePlate}
                    </span>
                    <span className="font-mono text-[11px] text-text-muted">{job.id}</span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-orange-500" />
                    {job.vehicleModel}
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    {"Client :"} <strong className="text-text-secondary">{job.customerName}</strong>
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-base border border-border/60 text-xs space-y-1">
                  <p className="font-semibold text-text-primary">
                    {"Intervention :"} {job.operationType} ({job.durationHours}h)
                  </p>
                  <p className="text-[11px] text-text-muted">
                    {"Poste :"} {job.bayId} · <User className="w-3 h-3 inline" /> {job.mechanic}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                <span className="text-xs text-text-muted flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  {"Prévu à"} {job.scheduledTime}
                </span>

                <div className="flex items-center gap-2">
                  {job.status === 'SCHEDULED' && (
                    <button
                      onClick={() => handleUpdateStatus(job.id, 'IN_PROGRESS')}
                      className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {"Monter sur le pont"}
                    </button>
                  )}
                  {job.status === 'IN_PROGRESS' && (
                    <button
                      onClick={() => handleUpdateStatus(job.id, 'READY_DELIVERY')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {"Terminer réparation"}
                    </button>
                  )}
                  {job.status === 'READY_DELIVERY' && (
                    <button
                      onClick={() => handleUpdateStatus(job.id, 'COMPLETED')}
                      className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {"Restituer les clés"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
