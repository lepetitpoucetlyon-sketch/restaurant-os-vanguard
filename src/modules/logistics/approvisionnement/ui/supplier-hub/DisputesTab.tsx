'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';

export function DisputesTab() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Litiges Réception & Demandes d'Avoirs
        </h3>
        <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-text-primary font-bold text-xs uppercase">
          Déclarer une non-conformité BL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400">LIT-202608-0015 — Transgourmet</span>
            <span className="text-nano font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
              AVOIR EN ATTENTE
            </span>
          </div>
          <div className="text-xs text-text-secondary space-y-1">
            <div>BL Fournisseur : <strong className="text-white">BL-98765</strong></div>
            <div>Motif : <span className="text-red-400 font-semibold">1x Colis Beurre manquant (-88,00 € HT)</span></div>
            <div>Avoir réclamé : <strong className="text-white">92,84 € TTC</strong></div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-text-muted">Déclaré le 15/08 par Chef</span>
            <button className="text-amber-400 hover:underline font-bold">Rapprocher l'avoir</button>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400">LIT-202608-0012 — Pomona</span>
            <span className="text-nano font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              AVOIR REÇU & DÉDUIT
            </span>
          </div>
          <div className="text-xs text-text-secondary space-y-1">
            <div>BL Fournisseur : <strong className="text-white">BL-44102</strong></div>
            <div>N° Avoir Fournisseur : <strong className="text-emerald-400">AV-POM-8821 (110,77 € TTC)</strong></div>
            <div>Déduit sur le virement du 31/08</div>
          </div>
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-text-muted">Clôturé le 12/08</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
