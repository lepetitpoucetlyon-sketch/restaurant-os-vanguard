'use client';

import React from 'react';
import { WifiOff, RefreshCw, ShoppingCart, UtensilsCrossed, ShieldCheck } from 'lucide-react';
import { Button, EmptyState } from '@/shared/components/ui';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (typeof window !== 'undefined' && window.navigator.onLine) {
      router.refresh();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0C] flex flex-col items-center justify-center p-6 text-text-primary select-none">
      <div className="max-w-md w-full p-8 rounded-3xl bg-surface-card/60 backdrop-blur-2xl border border-white/10 shadow-2xl space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg">
          <WifiOff className="w-8 h-8" />
        </div>

        <div>
          <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
            Mode Hors-Ligne Actif
          </h1>
          <p className="text-xs text-white/60 mt-2 leading-relaxed">
            Vous travaillez actuellement sur le cache local sécurisé (Sovereign Outbox). Toutes les commandes et encaissements sont stockés localement et seront synchronisés automatiquement au retour du réseau.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-surface-glass border border-white/5 space-y-2 text-left text-xs">
          <div className="flex items-center justify-between text-emerald-400 font-medium">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Sovereign Outbox
            </span>
            <span>Prête (Sync auto)</span>
          </div>
          <p className="text-[11px] text-white/40">
            Les tickets Z et scellements fiscaux NF525 restent intègres localement.
          </p>
        </div>

        <div className="space-y-3 pt-2">
          <Button variant="default" className="w-full" onClick={handleRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer la Connexion
          </Button>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={() => router.push('/pos')} className="text-xs">
              <ShoppingCart className="w-3.5 h-3.5 mr-1" />
              Caisse (POS)
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push('/kds')} className="text-xs">
              <UtensilsCrossed className="w-3.5 h-3.5 mr-1" />
              Cuisine (KDS)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
