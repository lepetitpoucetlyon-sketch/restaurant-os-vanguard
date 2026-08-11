import React from "react";
import { Users, DivideCircle, CreditCard } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { SplitMode } from "./useSplitBillState";

interface SplitModeSelectorProps {
    mode: SplitMode;
    t: (key: string) => string;
    onSelectMode: (mode: SplitMode) => void;
}

export function SplitModeSelector({ mode, t, onSelectMode }: SplitModeSelectorProps) {
    const modes: { id: SplitMode; label: string; icon: React.ElementType }[] = [
        { id: 'equal', label: t('pos.split.modes.equal'), icon: Users },
        { id: 'by-item', label: t('pos.split.modes.by_item'), icon: DivideCircle },
        { id: 'custom', label: t('pos.split.modes.custom'), icon: CreditCard }
    ];

    return (
        <div className="p-8 border-b border-white/5 bg-surface-card/[0.02] relative z-10 shrink-0">
            <div className="flex gap-4">
                {modes.map((m) => (
                    <button
                        key={m.id}
                        onClick={() => onSelectMode(m.id)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-4 py-5 px-8 rounded-[28px] font-black text-[10px] uppercase tracking-[0.3em] transition-all duration-700 border",
                            mode === m.id
                                ? "bg-accent-gold text-primary border-accent-gold shadow-glow"
                                : "bg-surface-card/[0.02] text-text-primary/40 hover:border-accent-gold/30 hover:text-accent-gold border-white/5"
                        )}
                    >
                        <m.icon className={cn("w-4 h-4", mode === m.id ? "text-primary" : "text-accent-gold")} strokeWidth={2} />
                        {m.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
