"use client";

import { useEffect, useState } from 'react';
import { CalendarDays, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppointments } from '../hooks/useAppointments';
import { AppointmentCard } from '../components/AppointmentCard';
import { AppointmentForm } from '../components/AppointmentForm';
import type { AppointmentKind } from '../../domain/types/appointment';

interface AppointmentsViewProps {
  defaultKind?: AppointmentKind;
  title?: string;
}

function dateOffset(base: string, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

export function AppointmentsView({ defaultKind = 'service', title = 'Rendez-vous' }: AppointmentsViewProps) {
  const { filtered, loading, selectedDate, loadByDate, create, confirm, cancel, complete } = useAppointments();
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadByDate(selectedDate);
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  const formattedDate = new Date(selectedDate).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  return (
    <div className="flex flex-col gap-4 p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-accent" />
          <h1 className="text-sm font-black uppercase tracking-widest text-text-primary">{title}</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-text-on-accent text-xs font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" />
          Nouveau
        </button>
      </div>

      {/* Date nav */}
      <div className="flex items-center justify-between bg-bg-secondary border border-border rounded-2xl px-4 py-2">
        <button onClick={() => loadByDate(dateOffset(selectedDate, -1))} className="text-text-muted hover:text-text-primary transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs font-bold text-text-primary capitalize">{formattedDate}</span>
        <button onClick={() => loadByDate(dateOffset(selectedDate, 1))} className="text-text-muted hover:text-text-primary transition-colors">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-bg-secondary border border-border rounded-2xl p-5">
          <p className="text-xs font-black uppercase tracking-widest text-text-primary mb-4">Nouveau rendez-vous</p>
          <AppointmentForm
            defaultKind={defaultKind}
            onSubmit={async (input) => { await create(input); setShowForm(false); }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-text-muted text-xs">Chargement…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-text-muted">
          <CalendarDays className="w-8 h-8 opacity-30" />
          <p className="text-xs">Aucun rendez-vous ce jour</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered
            .sort((a, b) => a.startAt.localeCompare(b.startAt))
            .map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onConfirm={confirm}
                onCancel={cancel}
                onComplete={complete}
              />
            ))}
        </div>
      )}
    </div>
  );
}
