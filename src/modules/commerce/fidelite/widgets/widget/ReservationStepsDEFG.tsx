'use client';

import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle2, ChevronLeft, Loader2, Fingerprint, CalendarPlus } from 'lucide-react';
import type { FormData, Step, CardImprintConfig } from './reservation-widget-types';
import { imprintRequired, buildICSLink } from './reservation-widget-types';

interface Props {
  step: 4 | 5 | 6 | 7;
  form: FormData;
  bookingRef: string | null;
  businessName: string;
  submitting: boolean;
  cardImprintConfig: CardImprintConfig | undefined;
  inputClass: string;
  btnPrimary: string;
  btnSecondary: string;
  go(next: Step): void;
  setField<K extends keyof FormData>(key: K, value: FormData[K]): void;
  handleProceedFromNotes(): void;
}

export function ReservationStepsDEFG({ step, form, bookingRef, businessName, submitting, cardImprintConfig, inputClass, btnPrimary, btnSecondary, go, setField, handleProceedFromNotes }: Props) {
  if (step === 4) return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-gray-900">Vos coordonnées</h2>
      <input className={inputClass} placeholder="Prénom" value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} autoComplete="given-name" />
      <input className={inputClass} placeholder="Nom"    value={form.lastName}  onChange={(e) => setField('lastName', e.target.value)}  autoComplete="family-name" />
      <div className="flex gap-3">
        <button onClick={() => go(3)} className={btnSecondary}><ChevronLeft className="w-4 h-4" /> Retour</button>
        <button className={btnPrimary} disabled={!form.firstName.trim() || !form.lastName.trim()} onClick={() => go(5)}>Continuer <ChevronLeft className="w-4 h-4 rotate-180" /></button>
      </div>
    </div>
  );

  if (step === 5) return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-gray-900">Email et téléphone</h2>
      <input className={inputClass} type="email" placeholder="Email"                  value={form.email} onChange={(e) => setField('email', e.target.value)} autoComplete="email" />
      <input className={inputClass} type="tel"   placeholder="Téléphone (optionnel)"  value={form.phone} onChange={(e) => setField('phone', e.target.value)} autoComplete="tel" />
      <div className="flex gap-3">
        <button onClick={() => go(4)} className={btnSecondary}><ChevronLeft className="w-4 h-4" /> Retour</button>
        <button className={btnPrimary} disabled={!form.email.trim() || !form.email.includes('@')} onClick={() => go(6)}>Continuer <ChevronLeft className="w-4 h-4 rotate-180" /></button>
      </div>
    </div>
  );

  if (step === 6) return (
    <div className="space-y-4">
      <h2 className="text-xl font-serif font-semibold text-gray-900">Remarques particulières</h2>
      <textarea
        className={`${inputClass} resize-none`}
        rows={4}
        placeholder="Allergie, occasion spéciale, besoin d'accessibilité… (optionnel)"
        value={form.notes}
        onChange={(e) => setField('notes', e.target.value)}
        maxLength={500}
      />
      <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 space-y-1 text-sm text-gray-600">
        <div className="flex justify-between">
          <span className="text-text-secondary">Date</span>
          <span className="font-medium">{form.date ? format(parseISO(form.date), 'EEE d MMM yyyy', { locale: fr }) : '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Horaire</span>
          <span className="font-medium">{form.time || '—'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Couverts</span>
          <span className="font-medium">{form.covers}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-text-secondary">Nom</span>
          <span className="font-medium">{form.firstName} {form.lastName}</span>
        </div>
      </div>
      {imprintRequired(cardImprintConfig, form.covers) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700">
          <Fingerprint className="w-3.5 h-3.5 flex-shrink-0" />
          Une garantie bancaire sera demandée à l&apos;étape suivante (aucun débit immédiat).
        </div>
      )}
      <div className="flex gap-3">
        <button onClick={() => go(5)} className={btnSecondary}><ChevronLeft className="w-4 h-4" /> Retour</button>
        <button className={btnPrimary} disabled={submitting} onClick={handleProceedFromNotes}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Réservation en cours…</>
          ) : imprintRequired(cardImprintConfig, form.covers) ? (
            <><Fingerprint className="w-4 h-4" /> Continuer vers la garantie</>
          ) : (
            <>Confirmer la réservation <CheckCircle2 className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </div>
  );

  // step === 7
  return (
    <div className="flex flex-col items-center text-center py-6 space-y-5">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
        className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
      >
        <CheckCircle2 className="w-10 h-10 text-green-600" />
      </motion.div>
      <div className="space-y-2">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Réservation confirmée !</h2>
        <p className="text-text-muted text-sm">Merci {form.firstName}, votre table est réservée chez {businessName}.</p>
      </div>
      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-6 py-4 space-y-1 w-full">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">Référence</p>
        <p className="font-mono text-lg font-bold text-amber-800 tracking-wider">{bookingRef ?? '—'}</p>
        <p className="text-xs text-amber-600 mt-1">
          {form.date ? format(parseISO(form.date), 'EEE d MMMM yyyy', { locale: fr }) : ''} • {form.time} • {form.covers} couvert{form.covers > 1 ? 's' : ''}
        </p>
      </div>
      <p className="text-xs text-text-secondary">Un email de confirmation a été envoyé à {form.email}</p>
      {bookingRef && form.date && form.time && (
        <a href={buildICSLink(form, businessName)} download={`reservation-${form.date}.ics`} className={btnPrimary}>
          <CalendarPlus className="w-4 h-4" />
          Ajouter à mon calendrier
        </a>
      )}
    </div>
  );
}
