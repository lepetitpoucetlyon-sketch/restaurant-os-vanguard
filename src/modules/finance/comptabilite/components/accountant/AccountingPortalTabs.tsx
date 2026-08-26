import React from 'react';
import { TrendingUp, PieChart, Users, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

export type AccountingTabKey = 'sales' | 'vat' | 'payroll' | 'reconciliation' | 'ai-audit';

interface AccountingPortalTabsProps {
  activeTab: AccountingTabKey;
  onTabChange: (tab: AccountingTabKey) => void;
}

export function AccountingPortalTabs({ activeTab, onTabChange }: AccountingPortalTabsProps) {
  return (
    <div className="flex border-b border-border-default gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onTabChange('sales')}
        className={cn(
          "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
          activeTab === 'sales'
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
            : "text-text-muted hover:text-text-primary hover:bg-surface-glass-hover"
        )}
      >
        <TrendingUp className="w-4 h-4" />
        <span>📜 Ventes & Fiscalité NF525</span>
      </button>

      <button
        onClick={() => onTabChange('vat')}
        className={cn(
          "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
          activeTab === 'vat'
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
            : "text-text-muted hover:text-text-primary hover:bg-surface-glass-hover"
        )}
      >
        <PieChart className="w-4 h-4" />
        <span>📊 Déclaration TVA (CA3)</span>
      </button>

      <button
        onClick={() => onTabChange('payroll')}
        className={cn(
          "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
          activeTab === 'payroll'
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
            : "text-text-muted hover:text-text-primary hover:bg-surface-glass-hover"
        )}
      >
        <Users className="w-4 h-4" />
        <span>👥 Social & Paie HCR (Silae)</span>
      </button>

      <button
        onClick={() => onTabChange('reconciliation')}
        className={cn(
          "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
          activeTab === 'reconciliation'
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
            : "text-text-muted hover:text-text-primary hover:bg-surface-glass-hover"
        )}
      >
        <CreditCard className="w-4 h-4" />
        <span>🏦 Rapprochement & Achats</span>
      </button>

      <button
        onClick={() => onTabChange('ai-audit')}
        className={cn(
          "px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
          activeTab === 'ai-audit'
            ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm"
            : "text-text-muted hover:text-text-primary hover:bg-surface-glass-hover"
        )}
      >
        <Sparkles className="w-4 h-4 text-amber-400" />
        <span>🧠 Auditeur IA Fiscal (Themis)</span>
      </button>
    </div>
  );
}
