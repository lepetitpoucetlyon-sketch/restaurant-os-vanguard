'use client';

import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

interface QuoteTotals {
    totalHTInMicrounits: number;
    totalVATInMicrounits: number;
    totalTTCInMicrounits: number;
}

interface QuoteFooterBarProps {
    totals: QuoteTotals;
    isSaving: boolean;
    onClose: () => void;
    onSave: () => void;
}

export function QuoteFooterBar({
    totals,
    isSaving,
    onClose,
    onSave,
}: QuoteFooterBarProps) {
    return (
        <div className="p-8 px-12 bg-bg-secondary border-t border-border flex items-center justify-between relative z-10 shrink-0 shadow-[0_-10px_30px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center gap-16">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">Total HT</span>
                    <span className="text-2xl font-mono text-text-primary tracking-tighter">{((totals.totalHTInMicrounits || 0) / 1_000_000).toFixed(2)}€</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] mb-1">TVA (Mixte)</span>
                    <span className="text-2xl font-mono text-text-primary/40 tracking-tighter">{((totals.totalVATInMicrounits || 0) / 1_000_000).toFixed(2)}€</span>
                </div>
                <div className="w-px h-10 bg-border mx-4" />
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mb-1">VALEUR FINALE TTC</span>
                    <span className="text-4xl font-mono font-black text-accent tracking-tighter">
                        {((totals.totalTTCInMicrounits || 0) / 1_000_000).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}€
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <button
                    onClick={onClose}
                    className="text-[10px] font-black text-text-muted uppercase tracking-[0.4em] hover:text-text-primary transition-colors"
                >
                    Abandonner
                </button>
                <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onSave}
                    disabled={isSaving}
                    className={cn(
                        "h-16 px-14 bg-accent text-text-primary rounded-[24px] text-[11px] font-black uppercase tracking-[0.5em] shadow-premium transition-all duration-700 relative overflow-hidden group flex items-center gap-4",
                        isSaving && "opacity-50 grayscale cursor-not-allowed"
                    )}
                >
                    <div className="absolute inset-0 bg-surface-card translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
                    {isSaving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                            <span className="relative z-10">Mémorisation...</span>
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform group-hover:text-primary" />
                            <span className="relative z-10 group-hover:text-primary">Générer le Devis</span>
                        </>
                    )}
                </motion.button>
            </div>
        </div>
    );
}
