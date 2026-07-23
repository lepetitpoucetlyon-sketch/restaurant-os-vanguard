"use client";

import { motion } from "framer-motion";
import { Edit2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { PageSEO } from "@nexus/contracts";

export function PageCard({ page, onEdit, id }: { page: PageSEO; onEdit: () => void; id?: string }) {
    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-[#00D9A6]';
        if (score >= 60) return 'text-amber-500';
        return 'text-rose-500';
    };

    const getScoreBg = (score: number) => {
        if (score >= 80) return 'bg-[#00D9A6]/10 border-[#00D9A6]/30';
        if (score >= 60) return 'bg-amber-500/10 border-amber-500/30';
        return 'bg-rose-500/10 border-rose-500/30';
    };

    const pageTypeLabels: Record<string, string> = {
        home: 'Accueil',
        menu: 'Menu',
        reservations: 'Réservations',
        contact: 'Contact',
        blog_post: 'Article',
        event: 'Événement',
        custom: 'Personnalisée'
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="p-6 rounded-[2rem] bg-bg-secondary border border-border hover:border-text-muted/30 hover:shadow-lg transition-all group"
            id={id}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg bg-bg-tertiary text-text-muted border border-border">
                            {pageTypeLabels[page.pageType]}
                        </span>
                        <code className="text-[11px] font-mono text-[#00D9A6] bg-[#00D9A6]/5 px-2 py-1 rounded-lg">{page.pagePath}</code>
                    </div>
                    <h3 className="text-lg font-serif italic font-black text-text-primary mb-2">{page.meta.title}</h3>
                    <p className="text-sm text-text-muted leading-relaxed line-clamp-2">{page.meta.description}</p>

                    {page.score.issues.length > 0 && (
                        <div className="mt-4 flex items-center gap-2 flex-wrap">
                            {page.score.issues.slice(0, 2).map((issue, i) => (
                                <span key={i} className="text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    {issue}
                                </span>
                            ))}
                            {page.score.issues.length > 2 && (
                                <span className="text-[10px] text-text-muted font-bold">+{page.score.issues.length - 2}</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex flex-col items-end gap-3 ml-6">
                    <div className={cn("text-2xl font-serif italic font-black px-4 py-2 rounded-xl border", getScoreColor(page.score.overall), getScoreBg(page.score.overall))}>
                        {page.score.overall}
                    </div>
                    <button
                        onClick={onEdit}
                        className="p-3 rounded-xl bg-bg-tertiary text-text-muted hover:bg-[#00D9A6]/10 hover:text-[#00D9A6] transition-all opacity-0 group-hover:opacity-100"
                    >
                        <Edit2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
