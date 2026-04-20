// @ts-nocheck

"use client";

import { useMemo } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";
import { useAccounting } from "@/context/AccountingContext";

export function ProfitLossView() {
    const { generatePandL, metrics } = useAccounting();
    const pnl = useMemo(() => generatePandL('current'), [generatePandL]);

    return (
        <div className="space-y-6">
            <div className="card-premium bg-white dark:bg-black p-8 border border-neutral-200 dark:border-white/5 shadow-soft dark:shadow-glow group relative overflow-hidden">
                {/* Decorative Pattern */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-accent-gold/10 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

                <p className="text-[10px] text-neutral-400 dark:text-white/40 uppercase font-black tracking-[0.4em] mb-3 relative z-10">Archive de Performance</p>
                <h2 className="text-4xl font-serif font-black italic text-neutral-900 dark:text-white leading-tight relative z-10">
                    Résultat: <span className={metrics.netProfitInCents >= 0 ? "text-success" : "text-error"}>{formatCurrency(metrics.netProfitInCents)}</span>
                </h2>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="card-premium bg-bg-secondary p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingUp className="w-5 h-5 text-success" />
                        <h3 className="font-bold text-text-primary">Produits</h3>
                        <span className="ml-auto text-xl font-black text-success">{formatCurrency(pnl.totalRevenueInCents)}</span>
                    </div>
                    <div className="space-y-2">
                        {pnl.revenues.map((r, i) => (
                            <div key={i} className="flex justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary/30">
                                <span className="text-sm text-text-primary">{r.accountCode} - {r.accountName}</span>
                                <span className="font-mono text-sm font-bold text-success">{formatCurrency(r.amountInCents)}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="card-premium bg-bg-secondary p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <TrendingDown className="w-5 h-5 text-error" />
                        <h3 className="font-bold text-text-primary">Charges</h3>
                        <span className="ml-auto text-xl font-black text-error">{formatCurrency(pnl.totalExpensesInCents)}</span>
                    </div>
                    <div className="space-y-2">
                        {pnl.expenses.map((e, i) => (
                            <div key={i} className="flex justify-between py-2 px-3 rounded-lg hover:bg-bg-tertiary/30">
                                <span className="text-sm text-text-primary">{e.accountCode} - {e.accountName}</span>
                                <span className="font-mono text-sm font-bold text-error">{formatCurrency(e.amountInCents)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
