"use client";

import { cn } from "@/lib/ui.foundations";

export function StatusBadge({ status }: { status: string }) {
    const configs: Record<string, { label: string, color: string, bg: string }> = {
        Confirmed: { label: "Confirmé", color: "text-status-success", bg: "bg-status-success/10 border-emerald-500/20" },
        Pending: { label: "En attente", color: "text-status-warning", bg: "bg-status-warning/10 border-amber-500/20" },
        Inquiry: { label: "Demande", color: "text-brand", bg: "bg-action-primary/10 border-focus/20" },
        Cancelled: { label: "Annulé", color: "text-status-danger", bg: "bg-status-danger/10 border-rose-500/20" }
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
