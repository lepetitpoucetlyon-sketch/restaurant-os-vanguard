'use client';

import { ShoppingCart, MessageSquare, Clock } from 'lucide-react';

export function OrdersTab() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Panier Optimisé Multi-Fournisseurs */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              Panier IA Recommandé (Franco Atteint)
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              0 € FRAIS DE PORT
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Transgourmet (Livraison Mardi)</span>
                <span className="text-emerald-400">266,00 € HT (Franco: 250 €)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                2x Carton Beurre (176 €), 2x Colis Crème (90 €)
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80">
              <div className="flex items-center justify-between font-bold text-white">
                <span>Pomona TerreAzur (Livraison Mardi)</span>
                <span className="text-emerald-400">210,00 € HT (Franco: 180 €)</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                2x Colis Saumon Frais (210 €)
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-xs">
              <span className="text-slate-400">Total Commandes : </span>
              <span className="font-bold text-white">476,00 € HT</span>
            </div>
            <button className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs uppercase flex items-center gap-2 hover:bg-emerald-400 transition-colors">
              <MessageSquare className="w-4 h-4" />
              Envoyer par WhatsApp
            </button>
          </div>
        </div>

        {/* Historique des Commandes */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            Dernières Commandes Émises
          </h3>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">BC-202608-0088 — Transgourmet</div>
                <div className="text-[11px] text-slate-400">Livr. prévue 18/08 • WhatsApp</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                CONFIRMÉE
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
              <div>
                <div className="font-bold text-white">BC-202608-0087 — France Boissons</div>
                <div className="text-[11px] text-slate-400">Livr. prévue 19/08 • Email PDF</div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                LIVRAISON EN COURS
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
