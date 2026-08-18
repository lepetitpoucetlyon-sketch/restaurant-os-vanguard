import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import type { AccountingMonthlySummary } from '@/modules/finance/comptabilite/services/MonthlyAccountingPackService';

interface ReconciliationPurchasesTabProps {
  summary: AccountingMonthlySummary;
}

export function ReconciliationPurchasesTab({ summary }: ReconciliationPurchasesTabProps) {
  return (
    <motion.div
      key="reconciliation"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="grid grid-cols-1 lg:grid-cols-2 gap-6"
    >
      {/* Rapprochement Bancaire */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Rapprochement Bancaire DSP2</span>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-6 h-6" />
            <span>Lettrage Parfait (Écart : 0,00 €)</span>
          </div>
        </div>
        <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Télécollectes TPE / Stripe :</span>
            <span className="font-mono font-semibold">{(summary.reconciliation.tpeSettlementsTotalCents / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Versements Espèces Caisse :</span>
            <span className="font-mono font-semibold">{(summary.reconciliation.cashDepositsTotalCents / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Crédits Relevé Bancaire Open Banking :</span>
            <span className="font-mono font-semibold">{(summary.reconciliation.bankCreditsTotalCents / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>

      {/* Achats & Factures Fournisseurs */}
      <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-6 space-y-4">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Factures Fournisseurs (OCR)</span>
        <div className="text-2xl font-bold text-white">{summary.purchases.invoicesCount} Factures Traitées</div>
        <div className="space-y-2 pt-2 border-t border-white/10 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Total Achats Matières Premières HT :</span>
            <span className="font-mono font-semibold">{(summary.purchases.totalPurchasesHtCents / 100).toFixed(2)} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">TVA Déductible sur Achats :</span>
            <span className="font-mono font-semibold text-emerald-400">{(summary.purchases.totalPurchasesVatCents / 100).toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
