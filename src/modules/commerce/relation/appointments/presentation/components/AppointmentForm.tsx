"use client";

import { useState } from 'react';
import type { AppointmentCreateInput, AppointmentKind } from '../../domain/types/appointment';

interface AppointmentFormProps {
  onSubmit: (input: AppointmentCreateInput) => Promise<void>;
  onCancel: () => void;
  defaultKind?: AppointmentKind;
  serviceOptions?: { id: string; name: string; durationMinutes: number }[];
}

const KIND_LABELS: Record<AppointmentKind, string> = {
  service: 'Prestation',
  consultation: 'Consultation',
  reservation: 'Réservation',
  check_in: 'Arrivée',
  delivery: 'Livraison',
  custom: 'Autre',
};

export function AppointmentForm({ onSubmit, onCancel, defaultKind = 'service', serviceOptions = [] }: AppointmentFormProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<AppointmentCreateInput>({
    kind: defaultKind,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    serviceName: '',
    startAt: new Date().toISOString().slice(0, 16),
    durationMinutes: 30,
    notes: '',
  });

  const set = (key: keyof AppointmentCreateInput, value: unknown) =>
    setForm(f => ({ ...f, [key]: value }));

  const handleServiceSelect = (id: string) => {
    const svc = serviceOptions.find(s => s.id === id);
    if (svc) {
      set('serviceId', svc.id);
      set('serviceName', svc.name);
      set('durationMinutes', svc.durationMinutes);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = "w-full h-10 bg-bg-secondary border border-border rounded-xl px-3 text-xs font-semibold text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-all";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Type</label>
          <select value={form.kind} onChange={e => set('kind', e.target.value)} className={inputClass}>
            {(Object.keys(KIND_LABELS) as AppointmentKind[]).map(k => (
              <option key={k} value={k}>{KIND_LABELS[k]}</option>
            ))}
          </select>
        </div>
        {serviceOptions.length > 0 && (
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Service</label>
            <select onChange={e => handleServiceSelect(e.target.value)} className={inputClass}>
              <option value="">Choisir…</option>
              {serviceOptions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Nom client *</label>
          <input required value={form.clientName} onChange={e => set('clientName', e.target.value)} className={inputClass} placeholder="Nom Prénom" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Email *</label>
          <input required type="email" value={form.clientEmail} onChange={e => set('clientEmail', e.target.value)} className={inputClass} placeholder="email@exemple.fr" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Téléphone</label>
          <input value={form.clientPhone ?? ''} onChange={e => set('clientPhone', e.target.value)} className={inputClass} placeholder="+33 6 …" />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Prestation *</label>
          <input required value={form.serviceName} onChange={e => set('serviceName', e.target.value)} className={inputClass} placeholder="Nom de la prestation" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Date & heure *</label>
          <input required type="datetime-local" value={form.startAt} onChange={e => set('startAt', e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Durée (min)</label>
          <input type="number" min={5} step={5} value={form.durationMinutes} onChange={e => set('durationMinutes', Number(e.target.value))} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-text-muted mb-1">Notes</label>
        <textarea value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} rows={2} className={`${inputClass} h-auto py-2 resize-none`} placeholder="Instructions particulières…" />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-bg-tertiary text-text-muted text-xs font-bold hover:text-text-primary transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-accent text-text-on-accent text-xs font-black uppercase tracking-wider hover:opacity-90 disabled:opacity-40 transition-all">
          {saving ? 'Enregistrement…' : 'Créer le rendez-vous'}
        </button>
      </div>
    </form>
  );
}
