'use client';

import { Award, ShieldCheck } from 'lucide-react';

export function RfaTab() {
  return (
    <div className="space-y-4">
      <div className="p-5 rounded-2xl bg-surface-card border border-border-default space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-text-primary text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Contrat Annuel RFA — France Boissons (2026)
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Réf : RFA-HEINEKEN-2026 • Période : 01/01/2026 au 31/12/2026
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-text-muted">Total RFA Estimée</div>
            <div className="text-lg font-black text-emerald-400">1 560,00 €</div>
          </div>
        </div>

        {/* Jauge de progression Volume CA */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">Volume Achats Cumulé : <strong className="text-text-primary">18 000,00 € HT</strong></span>
            <span className="text-amber-400 font-bold">Palier 1 Atteint (2.0%)</span>
          </div>
          <div className="w-full h-3 rounded-full bg-surface-glass border border-border-default overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
              style={{ width: '36%' }}
            />
          </div>
          <div className="flex items-center justify-between text-micro text-text-muted">
            <span>Palier 1 : 10k€ (2%)</span>
            <span>Palier 2 : 25k€ (4%) — <em>Manque 7 000 € (+680 € gain)</em></span>
            <span>Palier 3 : 50k€ (6%)</span>
          </div>
        </div>

        {/* Engagement Brasseur Fûts */}
        <div className="pt-3 border-t border-border-default flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <div>
              <span className="font-bold text-text-primary">Engagement Fûts Heineken 30L : </span>
              <span className="text-text-secondary">80 / 200 fûts réalisés (15,00 € / fût = 1 200,00 € acquis)</span>
            </div>
          </div>
          <button className="text-xs text-amber-400 hover:underline font-bold">
            Voir barème détaillé
          </button>
        </div>
      </div>
    </div>
  );
}
