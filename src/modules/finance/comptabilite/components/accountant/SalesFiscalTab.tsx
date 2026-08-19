import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileText } from 'lucide-react';
import type { AccountingMonthlySummary } from '../../services/MonthlyAccountingPackService';

interface SalesFiscalTabProps {
  summary: AccountingMonthlySummary;
  selectedPeriod: string;
  onDownloadPack: () => void;
}

export function SalesFiscalTab({ summary, selectedPeriod, onDownloadPack }: SalesFiscalTabProps) {
  return (
    <motion.div
      key="sales"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      {/* Carte Chiffre d'Affaires */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ventes Clôturées</span>
        <div className="text-3xl font-bold text-white font-mono">
          {(summary.totalRevenueTtcCents / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
        </div>
        <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Chiffre d'Affaires Brut HT :</span>
            <span className="font-mono font-semibold">{(summary.totalRevenueHtCents / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Total TVA Collectée :</span>
            <span className="font-mono font-semibold">{((summary.totalRevenueTtcCents - summary.totalRevenueHtCents) / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Titres-Restaurant CONECS (18%) :</span>
            <span className="font-mono font-semibold">{(summary.mealVouchersTotalCents / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Carte NF525 & Scellement */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chaîne Fiscale NF525</span>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">{summary.nf525.zReportCount} Tickets Z Scellés</div>
            <div className="text-xs text-emerald-400 font-medium">Chaîne cryptographique inaltérée</div>
          </div>
        </div>
        <div className="pt-2 border-t border-white/10 text-xs text-slate-400 space-y-1">
          <div>Master Hash SHA-256 :</div>
          <div className="font-mono text-[10px] text-slate-300 bg-slate-950 p-2 rounded-lg break-all">
            {summary.nf525.masterHashSha256}
          </div>
        </div>
      </div>

      {/* Carte Export FEC */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fichier FEC DGFiP</span>
        <p className="text-xs text-slate-300">
          Fichier normalisé conforme à l'article A.47 A-1 du Livre des Procédures Fiscales, directement intégrable dans Cegid, Sage, Pennylane et MyUnisoft.
        </p>
        <div className="pt-4">
          <button
            onClick={onDownloadPack}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl border border-white/10 text-xs transition-all"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>Télécharger FEC_{selectedPeriod.replace('-', '')}.txt</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
