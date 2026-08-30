"use client";

// @wip owner:finance-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useAccounting } from "../../../hooks/useAccounting";
import { formatMu } from "../../financeUtils";

const fmu = (mu?: number | null, fallbackCents = 0) =>
    formatMu(mu ?? fallbackCents * 10_000);

export function ProfitLossView() {
    const { generatePandL, metrics } = useAccounting();
    const pnl = useMemo(() => generatePandL('current'), [generatePandL]);

    return (
        <div className="space-y-6">
            <div className="card-premium bg-white dark:bg-black p-8 border border-neutral-200 dark:border-white/5 shadow-soft dark:shadow-glow group relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent-gold/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                <p className="text-nano text-text-secondary dark:text-text-primary/40 uppercase font-black tracking-[0.4em] mb-3 relative z-10">Archive de Performance</p>
                <h2 className="text-4xl font-serif font-black italic text-neutral-900 dark:text-text-primary leading-tight relative z-10">
                    Résultat: <span className={(metrics.netProfitInMicrounits ?? metrics.netProfitInCents) >= 0 ? "text-success" : "text-error"}>{fmu(metrics.netProfitInMicrounits, metrics.netProfitInCents)}</span>
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="card-premium bg-bg-secondary p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-success" />
                        <h3 className="font-bold text-text-primary">Produits</h3>
                        <span className="ml-auto text-xl font-black text-success">{fmu(pnl.totalRevenueInMicrounits, pnl.totalRevenueInCents)}</span>
                    </div>
                    <div className="space-y-2">
                        {pnl.revenues.map((r, i) => (
                            <div key={i} className="flex justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary/30">
                                <span className="text-sm text-text-primary">{r.accountCode} - {r.accountName}</span>
                                <span className="font-mono text-sm font-bold text-success">{fmu(r.amountInMicrounits, r.amountInCents)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card-premium bg-bg-secondary p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingDown className="w-5 h-5 text-error" />
                        <h3 className="font-bold text-text-primary">Charges</h3>
                        <span className="ml-auto text-xl font-black text-error">{fmu(pnl.totalExpensesInMicrounits, pnl.totalExpensesInCents)}</span>
                    </div>
                    <div className="space-y-2">
                        {pnl.expenses.map((e, i) => (
                            <div key={i} className="flex justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary/30">
                                <span className="text-sm text-text-primary">{e.accountCode} - {e.accountName}</span>
                                <span className="font-mono text-sm font-bold text-error">{fmu(e.amountInMicrounits, e.amountInCents)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
