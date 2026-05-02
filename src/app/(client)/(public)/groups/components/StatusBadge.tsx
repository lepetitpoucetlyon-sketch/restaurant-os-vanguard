"use client";

import { cn } from "@/lib/ui.foundations";

export function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string, color: string, bg: string }> = {
        Confirmed: { label: "Confirmé", color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/20" },
        Pending: { label: "En attente", color: "text-amber-500", bg: "bg-amber-500/10 border-amber-500/20" },
        Inquiry: { label: "Demande", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
        Cancelled: { label: "Annulé", color: "text-rose-500", bg: "bg-rose-500/10 border-rose-500/20" }
    };

    const config = configs[status] || configs.Inquiry;

    return (
        <span className={cn(
            "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
            config.color,
            config.bg
        )}>
            {config.label}
        </span>
    );
}
