'use client';

import { Calendar } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

interface PrepLifecycleSectionProps {
    dlcDays: string;
    setDlcDays: (d: string) => void;
    notes: string;
    setNotes: (n: string) => void;
}

export function PrepLifecycleSection({
    dlcDays,
    setDlcDays,
    notes,
    setNotes,
}: PrepLifecycleSectionProps) {
    return (
        <div className="grid grid-cols-1 gap-12">
            <div className="space-y-6">
                <label className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.5em] px-2 outline-none">
                    <Calendar className="w-4 h-4 text-accent-gold" />
                    CYCLE DE VIE (DLC PROTOCOLE)
                </label>
                <div className="flex items-center gap-4">
                    {['1', '2', '3', '4', '5', '7'].map(d => (
                        <button
                            key={d}
                            onClick={() => setDlcDays(d)}
                            className={cn(
                                "flex-1 py-5 rounded-[22px] text-[11px] font-black uppercase tracking-[0.3em] transition-all border shadow-soft",
                                dlcDays === d
                                    ? "bg-text-primary border-text-primary text-text-primary shadow-premium scale-105"
                                    : "bg-surface-card/60 border-border/40 text-text-muted hover:bg-surface-card hover:border-accent-gold/20"
                            )}
                        >
                            J+{d}
                        </button>
                    ))}
                </div>
            </div>
            <div className="space-y-6">
                <label className="flex items-center gap-3 text-[10px] font-black text-text-muted uppercase tracking-[0.5em] px-2 outline-none">
                    OBSERVATIONS PROTOCOLÉES
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="NOTES SUR L'ŒUVRE..."
                    rows={3}
                    className="w-full px-8 py-6 bg-surface-card/60 border border-border/40 rounded-3xl text-[13px] font-black text-text-primary focus:outline-none focus:border-accent-gold transition-all placeholder:text-text-muted/20 tracking-widest shadow-soft resize-none"
                />
            </div>
        </div>
    );
}
