'use client';

import { Sparkles } from 'lucide-react';

export function MercurialeTab() {
  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-amber-300">
              OPTIMISEUR DE MERCURIALES EN TEMPS RÉEL
            </div>
            <div className="text-[11px] text-slate-300">
              Détection automatique des écarts de prix par kg/L et calcul de l'impact food cost.
            </div>
          </div>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs uppercase">
          Importer Mercuriale (Excel / OCR)
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th className="p-3.5">Ingrédient</th>
              <th className="p-3.5">Meilleure Offre</th>
              <th className="p-3.5">Prix Unitaire</th>
              <th className="p-3.5">Conditionnement</th>
              <th className="p-3.5">Fournisseurs Comparés</th>
              <th className="p-3.5 text-right">Écart Prix Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-300">
            <tr>
              <td className="p-3.5 font-bold text-white">Beurre Doux 82% MG</td>
              <td className="p-3.5 text-emerald-400 font-bold">Transgourmet</td>
              <td className="p-3.5 font-mono font-bold text-white">8,80 € / kg</td>
              <td className="p-3.5 text-slate-400">Carton 10x1kg (88,00 €)</td>
              <td className="p-3.5 text-slate-400">Metro (9,20 €), Pomona (9,50 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+7,95%</td>
            </tr>
            <tr>
              <td className="p-3.5 font-bold text-white">Crème Fleurette 35%</td>
              <td className="p-3.5 text-emerald-400 font-bold">Metro Cash & Carry</td>
              <td className="p-3.5 font-mono font-bold text-white">3,75 € / L</td>
              <td className="p-3.5 text-slate-400">Pack 6x1L (22,50 €)</td>
              <td className="p-3.5 text-slate-400">Transgourmet (3,95 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+5,33%</td>
            </tr>
            <tr>
              <td className="p-3.5 font-bold text-white">Pavé de Saumon Frais</td>
              <td className="p-3.5 text-emerald-400 font-bold">Pomona TerreAzur</td>
              <td className="p-3.5 font-mono font-bold text-white">21,00 € / kg</td>
              <td className="p-3.5 text-slate-400">Colis 5kg (105,00 €)</td>
              <td className="p-3.5 text-slate-400">Transgourmet (23,00 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+9,52%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
