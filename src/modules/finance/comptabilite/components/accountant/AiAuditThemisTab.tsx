import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { AccountingMonthlySummary } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';

interface AiAuditThemisTabProps {
  summary: AccountingMonthlySummary;
  selectedPeriod: string;
}

export function AiAuditThemisTab({ summary, selectedPeriod }: AiAuditThemisTabProps) {
  return (
    <motion.div
      key="ai-audit"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-amber-600/10 border border-amber-500/30 rounded-2xl p-4">
        <Sparkles className="w-5 h-5 text-amber-400" />
        <div className="text-xs text-amber-200">
          <span className="font-bold">Auditeur IA Themis :</span> L'analyse algorithmique a inspecté 100% des écritures fiscales, déclarations de pourboires et pointages HCR du mois de {selectedPeriod}.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {summary.aiAuditAlerts.map((alert) => (
          <div key={alert.id} className="bg-slate-900/60 border border-white/10 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">{alert.title}</span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-semibold">
                {alert.category}
              </span>
            </div>
            <p className="text-xs text-slate-300">{alert.description}</p>
            <div className="pt-2 border-t border-white/10 text-[11px] text-amber-300 flex items-center gap-1.5">
              <ArrowRight className="w-3.5 h-3.5" />
              <span>{alert.recommendation}</span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
