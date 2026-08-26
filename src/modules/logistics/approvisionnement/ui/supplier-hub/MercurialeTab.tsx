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
            <div className="text-micro text-text-secondary">
              Détection automatique des écarts de prix par kg/L et calcul de l'impact food cost.
            </div>
          </div>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-amber-500 text-white font-bold text-xs uppercase">
          Importer Mercuriale (Excel / OCR)
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-surface-card border-b border-border-default text-text-muted font-semibold uppercase tracking-wider text-nano">
            <tr>
              <th className="p-3.5">Ingrédient</th>
              <th className="p-3.5">Meilleure Offre</th>
              <th className="p-3.5">Prix Unitaire</th>
              <th className="p-3.5">Conditionnement</th>
              <th className="p-3.5">Fournisseurs Comparés</th>
              <th className="p-3.5 text-right">Écart Prix Max</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-default text-text-secondary">
            <tr>
              <td className="p-3.5 font-bold text-text-primary">Beurre Doux 82% MG</td>
              <td className="p-3.5 text-emerald-400 font-bold">Transgourmet</td>
              <td className="p-3.5 font-mono font-bold text-text-primary">8,80 € / kg</td>
              <td className="p-3.5 text-text-muted">Carton 10x1kg (88,00 €)</td>
              <td className="p-3.5 text-text-muted">Metro (9,20 €), Pomona (9,50 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+7,95%</td>
            </tr>
            <tr>
              <td className="p-3.5 font-bold text-text-primary">Crème Fleurette 35%</td>
              <td className="p-3.5 text-emerald-400 font-bold">Metro Cash & Carry</td>
              <td className="p-3.5 font-mono font-bold text-text-primary">3,75 € / L</td>
              <td className="p-3.5 text-text-muted">Pack 6x1L (22,50 €)</td>
              <td className="p-3.5 text-text-muted">Transgourmet (3,95 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+5,33%</td>
            </tr>
            <tr>
              <td className="p-3.5 font-bold text-text-primary">Pavé de Saumon Frais</td>
              <td className="p-3.5 text-emerald-400 font-bold">Pomona TerreAzur</td>
              <td className="p-3.5 font-mono font-bold text-text-primary">21,00 € / kg</td>
              <td className="p-3.5 text-text-muted">Colis 5kg (105,00 €)</td>
              <td className="p-3.5 text-text-muted">Transgourmet (23,00 €)</td>
              <td className="p-3.5 text-right text-emerald-400 font-bold">+9,52%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
