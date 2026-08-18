import React from 'react';
import { motion } from 'framer-motion';
import { Send } from 'lucide-react';
import type { AccountingMonthlySummary } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';

interface PayrollSocialTabProps {
  summary: AccountingMonthlySummary;
  isTransmitting: string | null;
  onTransmit: (provider: 'pennylane' | 'silae' | 'sage' | 'cegid') => void;
}

export function PayrollSocialTab({ summary, isTransmitting, onTransmit }: PayrollSocialTabProps) {
  return (
    <motion.div
      key="payroll"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-3 gap-6"
    >
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Effectifs & Heures Travaillées</span>
        <div className="text-2xl font-bold text-white">{summary.payroll.employeeCount} Salariés en poste</div>
        <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Heures Travaillées :</span>
            <span className="font-mono font-semibold">{summary.payroll.totalHoursWorked} h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Heures Sup (36-39h - +10%) :</span>
            <span className="font-mono font-semibold text-amber-400">{summary.payroll.overtimeHours10} h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Heures Sup (40-43h - +20%) :</span>
            <span className="font-mono font-semibold text-amber-400">{summary.payroll.overtimeHours20} h</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Heures Sup (&gt;43h - +50%) :</span>
            <span className="font-mono font-semibold text-rose-400">{summary.payroll.overtimeHours50} h</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avantages en Nature & Pourboires</span>
        <div className="text-2xl font-bold text-white">{summary.payroll.staffMealsDeclaredCount} Repas Enregistrés</div>
        <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Avantage Repas CCN HCR :</span>
            <span className="font-mono font-semibold">4.15 € / repas</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Pourboires CB Déclarés (DSN) :</span>
            <span className="font-mono font-semibold text-emerald-400">{(summary.payroll.declaredTipsTotalCents / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Télétransmission Silae Paie</span>
        <p className="text-xs text-slate-300">
          Export direct des variables de paie vers le dossier Silae du cabinet pour génération instantanée des bulletins.
        </p>
        <button
          onClick={() => onTransmit('silae')}
          disabled={!!isTransmitting}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>{isTransmitting === 'silae' ? 'Synchronisation...' : 'Transmettre à Silae Paie'}</span>
        </button>
      </div>
    </motion.div>
  );
}
