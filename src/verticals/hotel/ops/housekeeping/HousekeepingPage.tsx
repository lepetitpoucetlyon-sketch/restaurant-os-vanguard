'use client';

import React, { useState } from 'react';
import { BedDouble, CheckCircle2, AlertTriangle, Clock, Sparkles, User, RefreshCw } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface RoomHousekeeping {
  id: string;
  roomNumber: string;
  floor: number;
  type: 'DOUBLE' | 'SUITE' | 'SINGLE' | 'PENTHOUSE';
  serviceType: 'departure_clean' | 'stayover' | 'deep_clean' | 'turndown';
  status: 'dirty' | 'in_progress' | 'inspected_clean' | 'maintenance';
  assignedTo: string;
  priority: 'vip' | 'early_arrival' | 'standard';
  notes?: string;
}

const INITIAL_ROOMS: RoomHousekeeping[] = [
  { id: 'rm-101', roomNumber: '101', floor: 1, type: 'DOUBLE', serviceType: 'departure_clean', status: 'dirty', assignedTo: 'Fatou D.', priority: 'early_arrival', notes: 'Arrivée prévue à 13h00' },
  { id: 'rm-102', roomNumber: '102', floor: 1, type: 'SINGLE', serviceType: 'stayover', status: 'in_progress', assignedTo: 'Fatou D.', priority: 'standard' },
  { id: 'rm-201', roomNumber: '201', floor: 2, type: 'SUITE', serviceType: 'departure_clean', status: 'inspected_clean', assignedTo: 'Marie L.', priority: 'vip', notes: 'Champagne d\'accueil déposé' },
  { id: 'rm-202', roomNumber: '202', floor: 2, type: 'DOUBLE', serviceType: 'stayover', status: 'dirty', assignedTo: 'Marie L.', priority: 'standard' },
  { id: 'rm-301', roomNumber: '301', floor: 3, type: 'PENTHOUSE', serviceType: 'deep_clean', status: 'maintenance', assignedTo: 'Équipe Tech', priority: 'standard', notes: 'Vérification climatisation' },
];

export function HousekeepingPage() {
  const { activeTenantId } = useTenant();
  const [rooms, setRooms] = useState<RoomHousekeeping[]>(INITIAL_ROOMS);
  const [floorFilter, setFloorFilter] = useState<string>('all');

  const filtered = rooms.filter(r => floorFilter === 'all' || String(r.floor) === floorFilter);

  const cleanCount = rooms.filter(r => r.status === 'inspected_clean').length;
  const inProgressCount = rooms.filter(r => r.status === 'in_progress').length;
  const dirtyCount = rooms.filter(r => r.status === 'dirty').length;

  const handleUpdateStatus = (id: string, newStatus: RoomHousekeeping['status']) => {
    setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🏨"}</span>
            <h1 className="text-xl font-bold font-serif">{"Gouvernante Générale & Entretien des Chambres (Housekeeping)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Attribution des étages, suivi des nettoyages à blanc/recouches et inspection qualité PMS."}
          </p>
        </div>

        <button
          onClick={() => setRooms(INITIAL_ROOMS)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface-card hover:bg-surface-hover text-xs font-medium transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-muted" />
          {"Actualiser statuts"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            {"Chambres prêtes (Inspectées)"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{cleanCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {"En cours de nettoyage"}
          </p>
          <p className="text-2xl font-bold font-mono text-blue-600">{inProgressCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            {"À faire (Départs / Recouches)"}
          </p>
          <p className="text-2xl font-bold font-mono text-amber-600">{dirtyCount}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-500" />
            {"Score qualité inspection"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">{"99.2 %"}</p>
        </div>
      </div>

      {/* Filtre Étages */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Tous les étages' },
          { id: '1', label: 'Étage 1' },
          { id: '2', label: 'Étage 2' },
          { id: '3', label: 'Étage 3' },
        ].map(fl => (
          <button
            key={fl.id}
            onClick={() => setFloorFilter(fl.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              floorFilter === fl.id
                ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {fl.label}
          </button>
        ))}
      </div>

      {/* Grille des Chambres */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(room => {
          const statusBadge = {
            dirty: { label: 'À nettoyer', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300' },
            in_progress: { label: 'Nettoyage en cours', bg: 'bg-blue-500/15 text-blue-700 dark:text-blue-300' },
            inspected_clean: { label: 'Propre & Inspectée', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' },
            maintenance: { label: 'Maintenance / HS', bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300' },
          }[room.status];

          const serviceLabel = {
            departure_clean: 'Départ (À blanc)',
            stayover: 'Recouche client',
            deep_clean: 'Nettoyage approfondi',
            turndown: 'Couverture du soir',
          }[room.serviceType];

          return (
            <div key={room.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-text-primary flex items-center gap-1">
                      <BedDouble className="w-4 h-4 text-blue-500" />
                      {"Ch. "} {room.roomNumber}
                    </span>
                    <span className="text-[10px] text-text-muted uppercase">({room.type})</span>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-text-muted">
                  <p className="font-medium text-text-secondary">{"Service : "}{serviceLabel}</p>
                  <p className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {"Assigné à : "}<strong className="text-text-primary">{room.assignedTo}</strong>
                  </p>
                </div>

                {room.notes && (
                  <p className="text-[11px] bg-surface-base p-2 rounded border border-border/70 text-text-secondary">
                    {room.notes}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-1.5">
                {room.status === 'dirty' && (
                  <button
                    onClick={() => handleUpdateStatus(room.id, 'in_progress')}
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors"
                  >
                    {"Démarrer"}
                  </button>
                )}
                {room.status === 'in_progress' && (
                  <button
                    onClick={() => handleUpdateStatus(room.id, 'inspected_clean')}
                    className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors"
                  >
                    {"Valider inspection"}
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
