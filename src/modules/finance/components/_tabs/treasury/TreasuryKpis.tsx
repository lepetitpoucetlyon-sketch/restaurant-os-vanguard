"use client";

import { TrendingUp, ArrowUpDown, TrendingDown } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { microToEur, type CashflowForecast, type SupplierInvoice } from "./treasuryTypes";

interface TreasuryKpisProps {
  totalForecast: number;
  forecasts: CashflowForecast[];
  totalPending: number;
  pendingInvoices: SupplierInvoice[];
  overdueInvoices: SupplierInvoice[];
}

export function TreasuryKpis({
  totalForecast,
  forecasts,
  totalPending,
  pendingInvoices,
  overdueInvoices,
}: TreasuryKpisProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="flex items-center gap-2 text-text-muted mb-2">
          <TrendingUp className="w-4 h-4" />
          <span className="text-chip-label">
            Prévision CA (7j)
          </span>
        </div>
        <p className="text-2xl font-serif font-bold text-status-success">
          {microToEur(totalForecast)}
        </p>
        <p className="text-nano text-text-muted mt-1">
          {forecasts.length} jour(s) de prévision
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="flex items-center gap-2 text-text-muted mb-2">
          <ArrowUpDown className="w-4 h-4" />
          <span className="text-chip-label">
            Fournisseurs à payer
          </span>
        </div>
        <p className="text-2xl font-serif font-bold text-action-primary">
          {microToEur(totalPending)}
        </p>
        <p className="text-nano text-text-muted mt-1">
          {pendingInvoices.length} facture(s) approuvée(s)
        </p>
      </div>

      <div className="rounded-xl border border-border bg-surface-card p-5">
        <div className="flex items-center gap-2 text-text-muted mb-2">
          <TrendingDown className="w-4 h-4" />
          <span className="text-chip-label">
            En retard
          </span>
        </div>
        <p
          className={cn(
            "text-2xl font-serif font-bold",
            overdueInvoices.length > 0
              ? "text-status-error"
              : "text-status-success"
          )}
        >
          {overdueInvoices.length}
        </p>
        <p className="text-nano text-text-muted mt-1">
          facture(s) en souffrance
        </p>
      </div>
    </div>
  );
}
