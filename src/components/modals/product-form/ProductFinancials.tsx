"use client";

import { DollarSign, Timer, Percent } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { formatCurrency } from "@/lib/formatters";

interface ProductFinancialsProps {
    sellPriceInCents: number;
    setSellPriceInCents: (val: number) => void;
    prepTime: number;
    setPrepTime: (val: number) => void;
    calculatedCost: number;
    margin: number;
}

export function ProductFinancials({ 
    sellPriceInCents, 
    setSellPriceInCents, 
    prepTime, 
    setPrepTime, 
    calculatedCost, 
    margin 
}: ProductFinancialsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white dark:bg-bg-secondary rounded-3xl border border-border shadow-soft space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <DollarSign className="w-3.5 h-3.5" /> Prix Carte
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        step="0.01"
                        value={sellPriceInCents / 100}
                        onChange={e => setSellPriceInCents(Math.round(parseFloat(e.target.value) * 100) || 0)}
                        className="w-full h-10 bg-transparent text-3xl font-serif font-black outline-none"
                    />
                    <span className="text-xl font-black">€</span>
                </div>
            </div>
            <div className="p-6 bg-white dark:bg-bg-secondary rounded-3xl border border-border shadow-soft space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <Timer className="w-3.5 h-3.5" /> Envoi ESTIMÉ
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={prepTime}
                        onChange={e => setPrepTime(parseInt(e.target.value) || 0)}
                        className="w-full h-10 bg-transparent text-3xl font-serif font-black outline-none"
                    />
                    <span className="text-xl font-black">MIN</span>
                </div>
            </div>
            <div className={cn(
                "p-6 rounded-3xl border shadow-soft flex flex-col justify-center",
                margin >= 70 ? "bg-success-soft border-success/20" : margin >= 50 ? "bg-warning-soft border-warning/20" : "bg-error-soft border-error/20"
            )}>
                <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] flex items-center gap-2">
                    <Percent className="w-3.5 h-3.5" /> Rentabilité
                </label>
                <div className="flex items-baseline gap-2">
                    <span className={cn(
                        "text-3xl font-serif font-black",
                        margin >= 70 ? "text-success" : margin >= 50 ? "text-warning" : "text-error"
                    )}>{margin.toFixed(1)}</span>
                    <span className="text-sm font-black text-text-muted">%</span>
                </div>
                <p className="text-[9px] font-bold text-text-muted mt-1">COÛT REVIENT: {formatCurrency(calculatedCost)}</p>
            </div>
        </div>
    );
}
