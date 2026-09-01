"use client";

import { CreditCard, Banknote, Smartphone, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useLanguage } from "@/shared/hooks";
import { formatCurrency } from "@/lib/formatters";

export type PaymentMethod = "card" | "cash" | "mobile" | "conecs";

interface PaymentMethodSelectorProps {
    method: PaymentMethod | null;
    onSelectMethod: (method: PaymentMethod) => void;
    total: number;
}

export function PaymentMethodSelector({ method, onSelectMethod, total }: PaymentMethodSelectorProps) {
    const { t } = useLanguage();

    return (
        <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {[
                    { id: 'card', name: t('pos.payment.methods.card'), icon: CreditCard },
                    { id: 'cash', name: t('pos.payment.methods.cash'), icon: Banknote },
                    { id: 'mobile', name: t('pos.payment.methods.mobile'), icon: Smartphone },
                    { id: 'conecs', name: 'Titre-Resto (CONECS)', icon: UtensilsCrossed },
                ].map((meth) => (
                    <button
                        key={meth.id}
                        onClick={() => onSelectMethod(meth.id as PaymentMethod)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-3 p-4 md:p-5 rounded-[24px] border transition-all duration-500 group relative overflow-hidden",
                            method === meth.id
                                ? "border-accent-gold bg-surface-card dark:bg-surface-card/5 shadow-premium ring-2 ring-accent-gold/20 -translate-y-1"
                                : "border-border/60 bg-bg-tertiary/40 hover:border-accent-gold/40 hover:bg-bg-tertiary/60"
                        )}
                    >
                        <div className={cn(
                            "w-10 h-10 md:w-12 md:h-12 rounded-[18px] flex items-center justify-center transition-all duration-500 shadow-sm",
                            method === meth.id
                                ? "bg-accent-gold text-text-primary"
                                : "bg-surface-glass text-text-muted group-hover:scale-105"
                        )}>
                            <meth.icon className="w-5 h-5 md:w-6 md:h-6" strokeWidth={1.5} />
                        </div>
                        <span className={cn("font-bold text-nano md:text-[10px] uppercase tracking-wider text-center transition-colors", method === meth.id ? "text-text-primary" : "text-text-muted")}>
                            {meth.name}
                        </span>
                    </button>
                ))}
            </div>

            {method === 'conecs' && (
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-2">
                    <div className="flex items-center justify-between font-bold text-indigo-400">
                        <span>Réseau CONECS (Edenred / Swile / Pluxee / Up / Bimpli)</span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-nano">Plafond 25,00 € / j</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-text-secondary">
                        <div>Part CONECS éligible : <strong className="text-white">{formatCurrency(Math.min(total, 2500))}</strong></div>
                        <div>Reste à charge : <strong className="text-amber-400">{total > 2500 ? formatCurrency(total - 2500) : "0,00 €"}</strong></div>
                    </div>
                </div>
            )}
        </>
    );
}
