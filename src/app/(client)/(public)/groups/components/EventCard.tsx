"use client";

import { motion } from "framer-motion";
import { Users, Calendar, Clock, Euro, ArrowUpRight } from "lucide-react";
import { StatusBadge, BadgeStatus } from "@/shared/components/ui/StatusBadge";

import { Group } from "@nexus/contracts";

const GROUP_STATUS_MAP: Record<string, { status: BadgeStatus; label: string }> = {
    Confirmed: { status: "success", label: "Confirmé" },
    Pending:   { status: "warning", label: "En attente" },
    Inquiry:   { status: "info",    label: "Demande" },
    Cancelled: { status: "error",   label: "Annulé" },
};

import { toast } from "sonner";

export function EventCard({ group }: { group: Group }) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="p-8 rounded-[2.5rem] bg-bg-secondary border border-border group hover:border-focus/30 transition-all"
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                        <StatusBadge
                            status={(GROUP_STATUS_MAP[group.status] ?? GROUP_STATUS_MAP.Inquiry).status}
                            label={(GROUP_STATUS_MAP[group.status] ?? GROUP_STATUS_MAP.Inquiry).label}
                        />
                        <span className="text-nano font-black uppercase tracking-[0.2em] text-text-muted px-4 py-1.5 rounded-full bg-bg-tertiary border border-border">
                            {group.type}
                        </span>
                    </div>
                    <h3 className="text-3xl font-serif italic font-black text-text-primary mb-4 group-hover:text-brand transition-colors">
                        {group.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-6">
                        <div className="flex items-center gap-2 text-text-muted">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm font-bold">{group.date ? new Date(group.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : 'Date à confirmer'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-muted">
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-bold">{group.time || '--:--'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-primary">
                            <Users className="w-4 h-4 text-brand" />
                            <span className="text-sm font-black">{group.pax || 0} Personnes</span>
                        </div>
                        <div className="flex items-center gap-2 text-status-success">
                            <Euro className="w-4 h-4" />
                            <span className="text-sm font-black">{group.budget}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {(group.tags || []).map((tag: string, tid: number) => (
                        <span key={tid} className="text-chip-label-sm px-4 py-1.5 rounded-xl bg-action-primary/5 text-brand dark:text-brand border border-focus/10">
                            {tag}
                        </span>
                    ))}
                    <button 
                        onClick={() => {
                            toast.info(`Groupe : ${group.name} • ${group.pax || 0} personnes • Budget : ${group.budget || 'Non spécifié'}`);
                        }}
                        title={`Voir les détails de ${group.name}`}
                        aria-label={`Voir les détails de ${group.name}`}
                        className="w-14 h-14 rounded-full bg-bg-tertiary border border-border flex items-center justify-center hover:bg-action-primary hover:text-text-primary transition-all duration-500 group/btn cursor-pointer"
                    >
                        <ArrowUpRight className="w-6 h-6 group-hover:scale-110 transition-transform" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
