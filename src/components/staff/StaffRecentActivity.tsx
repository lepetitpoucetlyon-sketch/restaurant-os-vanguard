// @ts-nocheck
"use client";

import { Shield } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface StaffRecentActivityProps {
    logs: any[];
}

export const StaffRecentActivity = ({ logs }: StaffRecentActivityProps) => {
    return (
        <div className="bg-white dark:bg-bg-secondary rounded-xl p-8 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-serif font-semibold text-text-primary tracking-tight">Activité Récente de l&apos;Équipe</h3>
                <button className="text-[11px] font-bold text-accent uppercase tracking-widest border-b border-accent/30 hover:border-accent transition-all">
                    Historique Complet
                </button>
            </div>
            <div className="space-y-6">
                {logs.slice(0, 3).map((log, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-border/50 pb-5 last:border-0 last:pb-0">
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-muted border border-border/50">
                                <Shield strokeWidth={1.5} className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="font-serif font-semibold text-text-primary text-[15px]">{log.userName || 'Système'}</p>
                                <p className="text-[13px] text-text-muted mt-0.5">{log.action}</p>
                            </div>
                        </div>
                        <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest font-mono bg-bg-tertiary px-3 py-1 rounded-full">
                            {format(log.timestamp, 'HH:mm', { locale: fr })}
                        </span>
                    </div>
                ))}
                {logs.length === 0 && (
                    <p className="text-center py-10 text-text-muted font-serif italic italic font-medium opacity-60">En attente d&apos;activité système...</p>
                )}
            </div>
        </div>
    );
};
