import React from 'react';
import { motion } from 'framer-motion';
import type { AccountingMonthlySummary } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';

interface VatDeclarationTabProps {
  summary: AccountingMonthlySummary;
}

export function VatDeclarationTab({ summary }: VatDeclarationTabProps) {
  return (
    <motion.div
      key="vat"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Ventilation Fiscale TVA & Titres-Restaurant</h3>
          <p className="text-xs text-slate-400">Bases HT et TVA collectée ventilées pour la déclaration mensuelle CA3.</p>
        </div>
        <div className="text-xs text-slate-400 bg-slate-800 px-3 py-1.5 rounded-lg border border-white/10">
          Régime Réel Normal / Simplifié
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400">
              <th className="py-3 px-4">Taux de TVA</th>
              <th className="py-3 px-4">Nature des Ventes</th>
              <th className="py-3 px-4 font-mono text-right">Base HT (€)</th>
              <th className="py-3 px-4 font-mono text-right">Montant TVA (€)</th>
              <th className="py-3 px-4 font-mono text-right">Total TTC (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-slate-200">
            <tr>
              <td className="py-3.5 px-4 font-bold text-amber-400">5.5 %</td>
              <td className="py-3.5 px-4 font-sans text-slate-300">Alimentation emportée, eau, produits sous emballage</td>
              <td className="py-3.5 px-4 text-right">{(summary.vatBreakdown.vat55HtCents / 100).toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{(summary.vatBreakdown.vat55AmountCents / 100).toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold">{((summary.vatBreakdown.vat55HtCents + summary.vatBreakdown.vat55AmountCents) / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-bold text-amber-400">10.0 %</td>
              <td className="py-3.5 px-4 font-sans text-slate-300">Restauration sur place, boissons sans alcool, café</td>
              <td className="py-3.5 px-4 text-right">{(summary.vatBreakdown.vat10HtCents / 100).toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{(summary.vatBreakdown.vat10AmountCents / 100).toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold">{((summary.vatBreakdown.vat10HtCents + summary.vatBreakdown.vat10AmountCents) / 100).toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-3.5 px-4 font-bold text-amber-400">20.0 %</td>
              <td className="py-3.5 px-4 font-sans text-slate-300">Boissons alcoolisées (Vins, Spiritueux, Bières)</td>
              <td className="py-3.5 px-4 text-right">{(summary.vatBreakdown.vat20HtCents / 100).toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold text-emerald-400">{(summary.vatBreakdown.vat20AmountCents / 100).toFixed(2)}</td>
              <td className="py-3.5 px-4 text-right font-bold">{((summary.vatBreakdown.vat20HtCents + summary.vatBreakdown.vat20AmountCents) / 100).toFixed(2)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 font-mono font-bold text-white bg-slate-950/40">
              <td colSpan={2} className="py-3.5 px-4 font-sans uppercase text-slate-400">Total Général Déclaration</td>
              <td className="py-3.5 px-4 text-right">{(summary.totalRevenueHtCents / 100).toFixed(2)} €</td>
              <td className="py-3.5 px-4 text-right text-emerald-400">
                {((summary.vatBreakdown.vat55AmountCents + summary.vatBreakdown.vat10AmountCents + summary.vatBreakdown.vat20AmountCents) / 100).toFixed(2)} €
              </td>
              <td className="py-3.5 px-4 text-right text-amber-400">{(summary.totalRevenueTtcCents / 100).toFixed(2)} €</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </motion.div>
  );
}
