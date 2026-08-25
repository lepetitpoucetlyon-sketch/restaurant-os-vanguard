"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { toMicrounits } from "@/shared/schemas/primitives";
import { SovereignMath } from "@/shared/services/SovereignMath";
import { formatCurrency } from "@/lib/formatters";

interface TipPanelProps {
    totalInMicrounits: number;
    onTipSelect: (tipInMicrounits: number) => void;
}

const TIP_PRESETS = [5, 10, 15] as const;

export function TipPanel({ totalInMicrounits, onTipSelect }: TipPanelProps) {
    const [customValue, setCustomValue] = useState("");
    const [activePreset, setActivePreset] = useState<number | "custom" | null>(null);

    const tipForPercent = (pct: number): number =>
        Math.round(totalInMicrounits * pct / 100);

    const handlePreset = (pct: number) => {
        setActivePreset(pct);
        setCustomValue("");
        onTipSelect(tipForPercent(pct));
    };

    const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(",", ".");
        setCustomValue(e.target.value);
        setActivePreset("custom");

        const euros = parseFloat(raw);
        if (!isNaN(euros) && euros >= 0) {
            // Convert euros → microunits: 1€ = 1_000_000 µ
            onTipSelect(toMicrounits(Math.round(euros * 1_000_000)));
        }
    };

    const handleNoTip = () => {
        setActivePreset(null);
        setCustomValue("");
        onTipSelect(0);
    };

    return (
        <div className="w-full rounded-[2rem] bg-surface-card border border-border p-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-accent-gold/10 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-accent-gold" />
                </div>
                <div>
                    <h3 className="text-sm font-black uppercase tracking-widest text-text-primary leading-none">
                        Pourboire
                    </h3>
                    <p className="text-nano text-text-muted uppercase tracking-wider mt-0.5">
                        Facultatif — récompensez votre serveur
                    </p>
                </div>
            </div>

            {/* Preset % buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {TIP_PRESETS.map((pct) => {
                    const tipAmount = tipForPercent(pct);
                    const isActive = activePreset === pct;
                    return (
                        <motion.button
                            key={pct}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePreset(pct)}
                            className={cn(
                                "flex flex-col items-center justify-center h-16 rounded-2xl border text-center transition-all duration-200",
                                isActive
                                    ? "bg-accent-gold border-accent-gold text-text-primary shadow-lg shadow-accent-gold/20"
                                    : "bg-bg-primary border-border text-text-muted hover:border-accent-gold/40"
                            )}
                        >
                            <span className={cn(
                                "text-lg font-black font-serif italic leading-none",
                                isActive ? "text-text-primary" : "text-text-primary"
                            )}>
                                {pct}%
                            </span>
                            <span className={cn(
                                "text-nano font-mono mt-0.5",
                                isActive ? "text-text-primary/80" : "text-text-muted"
                            )}>
                                {formatCurrency(SovereignMath.toCents(BigInt(tipAmount)))}
                            </span>
                        </motion.button>
                    );
                })}
            </div>

            {/* Custom amount */}
            <div className="flex gap-3">
                <div className={cn(
                    "flex-1 flex items-center gap-3 border rounded-full px-4 h-12 transition-colors",
                    activePreset === "custom"
                        ? "border-accent-gold bg-accent-gold/5"
                        : "border-border bg-bg-primary"
                )}>
                    <span className="text-sm text-text-muted font-mono">€</span>
                    <input
                        type="text"
                        inputMode="decimal"
                        value={customValue}
                        onChange={handleCustomChange}
                        onFocus={() => setActivePreset("custom")}
                        placeholder="Autre montant"
                        className="flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none font-mono"
                    />
                </div>

                <button
                    onClick={handleNoTip}
                    className={cn(
                        "px-4 h-12 rounded-full border text-micro font-black uppercase tracking-wider transition-colors",
                        activePreset === null
                            ? "bg-bg-tertiary border-border text-text-primary"
                            : "border-border text-text-muted hover:border-border/80"
                    )}
                >
                    Sans
                </button>
            </div>
        </div>
    );
}
