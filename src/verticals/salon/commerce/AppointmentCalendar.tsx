'use client';

import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, User, Scissors, Plus, CheckCircle2, Sparkles, Phone } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';

interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  stylistName: string;
  service: string;
  startTime: string;
  durationMinutes: number;
  priceInMicrounits: number;
  cabin: string;
  status: 'confirmed' | 'in_progress' | 'completed' | 'no_show';
}

const INITIAL_APPOINTMENTS: Appointment[] = [
  { id: 'apt-1', clientName: 'Mme Clara Martin', clientPhone: '06 11 22 33 44', stylistName: 'Élodie (Coloriste)', service: 'Balayage Signature & Soin Olaplex', startTime: '09:00', durationMinutes: 120, priceInMicrounits: 145_000_000, cabin: 'Fauteuil 01', status: 'completed' },
  { id: 'apt-2', clientName: 'M. Alexandre B.', clientPhone: '06 44 55 66 77', stylistName: 'Julien (Barbier)', service: 'Coupe Ciseaux & Taille Barbe Vapeur', startTime: '11:00', durationMinutes: 45, priceInMicrounits: 48_000_000, cabin: 'Espace Barbier', status: 'in_progress' },
  { id: 'apt-3', clientName: 'Mme Camille D.', clientPhone: '07 88 99 00 11', stylistName: 'Sarah (Esthéticienne)', service: 'Soin Visage Hydrafacial & Modelage', startTime: '14:00', durationMinutes: 60, priceInMicrounits: 110_000_000, cabin: 'Cabine Spa 1', status: 'confirmed' },
  { id: 'apt-4', clientName: 'Mme Inès K.', clientPhone: '06 77 66 55 44', stylistName: 'Élodie (Coloriste)', service: 'Brushing & Soin Botanique', startTime: '15:30', durationMinutes: 45, priceInMicrounits: 45_000_000, cabin: 'Fauteuil 02', status: 'confirmed' },
];

export function AppointmentCalendar() {
  const { activeTenantId } = useTenant();
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [selectedStylist, setSelectedStylist] = useState<string>('all');

  const filtered = appointments.filter(a => selectedStylist === 'all' || a.stylistName.includes(selectedStylist));

  const totalCAEstimateMu = appointments.reduce((s, a) => s + a.priceInMicrounits, 0);

  const handleUpdateStatus = (id: string, newStatus: Appointment['status']) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"✂️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Agenda & Rendez-vous Salon"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Planning des prestations par praticien, occupation des cabines et suivi des rendez-vous."}
          </p>
        </div>

        <button
          onClick={() => alert("Prise de rendez-vous express...")}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          {"Nouveau rendez-vous"}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
            {"Rendez-vous du jour"}
          </p>
          <p className="text-2xl font-bold font-mono text-purple-600">{appointments.length}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Scissors className="w-3.5 h-3.5 text-pink-500" />
            {"En cours d'exécution"}
          </p>
          <p className="text-2xl font-bold font-mono text-pink-600">
            {appointments.filter(a => a.status === 'in_progress').length}
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            {"Taux d'occupation fauteuils"}
          </p>
          <p className="text-2xl font-bold font-mono text-emerald-600">{"88.5 %"}</p>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface-card space-y-1">
          <p className="text-[11px] font-medium text-text-muted flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-500" />
            {"CA prévisionnel jour"}
          </p>
          <p className="text-2xl font-bold font-mono">
            {((totalCAEstimateMu / 1_000_000)).toFixed(2)} {"€"}
          </p>
        </div>
      </div>

      {/* Filtres par praticien */}
      <div className="flex items-center gap-2 border-b border-border/80 pb-3">
        {[
          { id: 'all', label: 'Toute l\'équipe' },
          { id: 'Élodie', label: 'Élodie (Coloriste)' },
          { id: 'Julien', label: 'Julien (Barbier)' },
          { id: 'Sarah', label: 'Sarah (Esthétique)' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => setSelectedStylist(st.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              selectedStylist === st.id
                ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                : 'text-text-muted hover:text-text-primary hover:bg-surface-hover'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Liste chronologique des RDV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(apt => {
          const priceEur = (apt.priceInMicrounits / 1_000_000).toFixed(2);
          const statusBadge = {
            confirmed: { label: 'Confirmé', bg: 'bg-blue-500/10 text-blue-600' },
            in_progress: { label: 'En prestation', bg: 'bg-purple-500/10 text-purple-600' },
            completed: { label: 'Terminé & Encaissé', bg: 'bg-emerald-500/10 text-emerald-600' },
            no_show: { label: 'Non honoré', bg: 'bg-rose-500/10 text-rose-600' },
          }[apt.status];

          return (
            <div key={apt.id} className="rounded-xl border border-border bg-surface-card p-4 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-purple-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    {apt.startTime} ({apt.durationMinutes} min)
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusBadge.bg}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-text-primary">{apt.clientName}</h3>
                  <p className="text-xs text-text-muted flex items-center gap-1 mt-0.5">
                    <Phone className="w-3 h-3" /> {apt.clientPhone} · <User className="w-3 h-3 ml-1" /> {apt.stylistName}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-surface-base border border-border/60 text-xs space-y-1">
                  <p className="font-semibold text-text-primary">{apt.service}</p>
                  <p className="text-[11px] text-text-muted">{"Espace :"} {apt.cabin}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/80 flex items-center justify-between">
                <span className="font-mono font-bold text-sm text-text-primary">{priceEur} {"€"}</span>
                <div className="flex items-center gap-2">
                  {apt.status === 'confirmed' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'in_progress')}
                      className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {"Prendre en charge"}
                    </button>
                  )}
                  {apt.status === 'in_progress' && (
                    <button
                      onClick={() => handleUpdateStatus(apt.id, 'completed')}
                      className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-medium transition-colors"
                    >
                      {"Encaisser"}
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
