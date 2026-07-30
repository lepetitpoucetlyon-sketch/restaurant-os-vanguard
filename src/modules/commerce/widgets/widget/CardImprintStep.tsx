'use client';

import type { RefObject } from 'react';
import { Fingerprint, ShieldCheck, AlertCircle, ChevronLeft, Loader2 } from 'lucide-react';
import type { CardImprintConfig } from './reservation-widget-types';

interface Props {
  penalty: number;
  cardImprintConfig: CardImprintConfig | undefined;
  stripeLoading: boolean;
  stripeError: string | null;
  stripeReady: boolean;
  cardMountRef: RefObject<HTMLDivElement | null>;
  submitting: boolean;
  btnPrimary: string;
  btnSecondary: string;
  onBack(): void;
  onConfirmCard(): Promise<void>;
}

export function CardImprintStep({
  penalty, cardImprintConfig, stripeLoading, stripeError, stripeReady,
  cardMountRef, submitting, btnPrimary, btnSecondary, onBack, onConfirmCard,
}: Props) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Fingerprint className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-serif font-semibold text-gray-900">Garantie de réservation</h2>
          <p className="text-xs text-text-secondary">Aucun débit immédiat</p>
        </div>
      </div>

      <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 space-y-1 text-sm text-amber-800">
        <p className="flex items-center gap-2 font-medium">
          <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
          Votre carte est enregistrée comme garantie mais <strong>jamais débitée</strong> si vous venez.
        </p>
        <p className="text-xs text-amber-600 pl-6">
          En cas de no-show, {penalty} € sont prélevés automatiquement le lendemain.
          Annulation gratuite {cardImprintConfig?.cancelHours ?? 24}h avant.
        </p>
      </div>

      {stripeLoading && (
        <div className="flex flex-col items-center gap-3 py-8 text-text-secondary">
          <Loader2 className="w-7 h-7 animate-spin text-action-primary" />
          <p className="text-sm">Chargement du formulaire sécurisé…</p>
        </div>
      )}

      {stripeError && (
        <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{stripeError}</span>
        </div>
      )}

      <div
        ref={cardMountRef}
        className={`rounded-2xl border border-gray-200 bg-gray-50 px-4 py-4 transition-all ${
          stripeReady ? 'opacity-100' : 'opacity-0 pointer-events-none h-0'
        }`}
      />

      <div className="flex gap-3">
        <button onClick={onBack} disabled={submitting} className={btnSecondary}>
          <ChevronLeft className="w-4 h-4" /> Retour
        </button>
        <button className={btnPrimary} disabled={!stripeReady || submitting} onClick={() => void onConfirmCard()}>
          {submitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Traitement…</>
          ) : (
            <><ShieldCheck className="w-4 h-4" /> Confirmer avec garantie</>
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-text-secondary">
        Paiement sécurisé par Stripe · PCI DSS Level 1
      </p>
    </div>
  );
}
