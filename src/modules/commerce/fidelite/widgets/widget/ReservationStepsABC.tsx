'use client';

import { format, addDays, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { FormData, Step, TimeSlot } from './reservation-widget-types';

interface Props {
  step: 1 | 2 | 3;
  form: FormData;
  slots: TimeSlot[];
  loadingSlots: boolean;
  btnPrimary: string;
  btnSecondary: string;
  go(next: Step): void;
  setField<K extends keyof FormData>(key: K, value: FormData[K]): void;
  fetchSlots(): void;
}

const DATE_OPTIONS = Array.from({ length: 90 }, (_, i) => addDays(new Date(), i + 1));

export function ReservationStepsABC({ step, form, slots, loadingSlots, btnPrimary, btnSecondary, go, setField, fetchSlots }: Props) {
  if (step === 1) return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-gray-900">Choisissez une date</h2>
      <div className="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
        {DATE_OPTIONS.map((d) => {
          const iso   = format(d, 'yyyy-MM-dd');
          const label = format(d, 'EEE d MMM', { locale: fr });
          const selected = form.date === iso;
          return (
            <button
              key={iso}
              onClick={() => setField('date', iso)}
              className={`rounded-2xl border px-3 py-4 text-sm font-medium transition-all capitalize ${
                selected
                  ? 'border-action-primary bg-amber-50 text-amber-700 ring-2 ring-amber-300'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button className={btnPrimary} disabled={!form.date} onClick={() => go(2)}>
        Continuer <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );

  if (step === 2) return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-gray-900">Nombre de personnes</h2>
      <p className="text-sm text-text-muted">
        {form.date ? format(parseISO(form.date), 'EEEE d MMMM', { locale: fr }) : ''}
      </p>
      <div className="flex items-center justify-center gap-6 py-6">
        <button onClick={() => setField('covers', Math.max(1, form.covers - 1))} className="w-14 h-14 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-gray-700 hover:border-amber-400 hover:bg-amber-50 transition flex items-center justify-center">−</button>
        <span className="text-5xl font-serif font-bold text-gray-900 w-16 text-center">{form.covers}</span>
        <button onClick={() => setField('covers', Math.min(20, form.covers + 1))} className="w-14 h-14 rounded-2xl border-2 border-gray-200 text-2xl font-bold text-gray-700 hover:border-amber-400 hover:bg-amber-50 transition flex items-center justify-center">+</button>
      </div>
      <div className="flex gap-3">
        <button onClick={() => go(1)} className={btnSecondary}><ChevronLeft className="w-4 h-4" /> Retour</button>
        <button className={btnPrimary} onClick={() => { go(3); fetchSlots(); }}>Continuer <ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );

  // step === 3
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-gray-900">Choisissez un horaire</h2>
      {loadingSlots ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-action-primary" />
        </div>
      ) : slots.length === 0 ? (
        <p className="text-center text-text-muted py-10 text-sm">Aucune disponibilité pour cette date. Essayez un autre jour.</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {slots.map((s) => (
            <button
              key={s.time}
              disabled={!s.available}
              onClick={() => setField('time', s.time)}
              className={`rounded-2xl border py-4 text-sm font-medium transition-all ${
                !s.available ? 'border-gray-100 bg-gray-50 text-text-secondary cursor-not-allowed'
                : form.time === s.time ? 'border-action-primary bg-amber-50 text-amber-700 ring-2 ring-amber-300'
                : 'border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:bg-amber-50'
              }`}
            >
              {s.time}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => go(2)} className={btnSecondary}><ChevronLeft className="w-4 h-4" /> Retour</button>
        <button className={btnPrimary} disabled={!form.time} onClick={() => go(4)}>Continuer <ChevronRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}
