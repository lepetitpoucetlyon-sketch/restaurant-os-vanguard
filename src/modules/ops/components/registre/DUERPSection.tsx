"use client";

import { useRegistre } from "@/context/RegistreContext";
import { FileText, Calendar, Clock, AlertTriangle, CheckCircle2, Download, Eye, History, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;

const RISK_CATEGORIES = [
    { zone: 'Cuisine — Poste chaud', risks: ['Brûlures thermiques', 'Coupures', 'Glissades'], level: 'élevé' },
    { zone: 'Cuisine — Plonge', risks: ['Produits chimiques', 'Postures contraignantes', 'Humidité'], level: 'moyen' },
    { zone: 'Salle de restaurant', risks: ['Chutes (escalier)', 'Port de charges', 'Stress'], level: 'moyen' },
    { zone: 'Bar', risks: ['Coupures (verrerie)', 'Posture debout prolongée'], level: 'faible' },
    { zone: 'Réserve / Stockage', risks: ['Chutes d\'objets', 'Manutention', 'Froid'], level: 'moyen' },
    { zone: 'Terrasse', risks: ['Intempéries', 'Sol glissant'], level: 'faible' },
];

export function DUERPSection() {
    const { duerp } = useRegistre();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-bg-secondary rounded-[2.5rem] border border-border p-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/5 -mr-24 -mt-24 rounded-full blur-3xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-start justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10 shadow-sm">
                            <FileText strokeWidth={1.5} className="w-8 h-8 text-blue-500" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight">{duerp.title}</h2>
                            <p className="text-text-muted text-sm mt-2 max-w-xl leading-relaxed">{duerp.description}</p>
                            <div className="flex items-center gap-6 mt-4">
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Calendar strokeWidth={1.5} className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-mono font-bold">Dernière MAJ : {duerp.lastUpdated}</span>
                                </div>
                                <div className="flex items-center gap-2 text-text-muted">
                                    <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-mono font-bold">Prochaine révision : {duerp.nextReview}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" className="h-11 rounded-xl border-border px-5 font-bold text-[10px] uppercase tracking-widest">
                            <Eye strokeWidth={1.5} className="w-4 h-4 mr-2" /> Consulter
                        </Button>
                        <Button variant="outline" className="h-11 rounded-xl border-border px-5 font-bold text-[10px] uppercase tracking-widest">
                            <Download strokeWidth={1.5} className="w-4 h-4 mr-2" /> PDF
                        </Button>
                    </div>
                </div>
            </div>

            {/* Status + Notes */}
            {duerp.notes && (
                <div className="bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-200 dark:border-blue-500/10 p-6 flex items-start gap-4">
                    <CheckCircle2 strokeWidth={1.5} className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-blue-900 dark:text-blue-300 leading-relaxed">{duerp.notes}</p>
                </div>
            )}

            {/* Risk Evaluation by Zone */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-1 flex items-center gap-3">
                    <AlertTriangle strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Évaluation des Risques par Zone
                </h3>
                <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-bg-tertiary/30 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border">
                                <th className="px-8 py-5">Zone</th>
                                <th className="px-8 py-5">Risques identifiés</th>
                                <th className="px-8 py-5">Niveau</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {RISK_CATEGORIES.map((cat, i) => (
                                <tr key={i} className="hover:bg-bg-tertiary/10 transition-colors">
                                    <td className="px-8 py-5">
                                        <span className="font-serif font-semibold text-text-primary">{cat.zone}</span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-wrap gap-2">
                                            {cat.risks.map((risk, j) => (
                                                <span key={j} className="px-2.5 py-1 rounded-lg bg-bg-tertiary text-[10px] font-bold text-text-muted">{risk}</span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            cat.level === 'élevé' ? 'bg-error/10 text-error border-error/20' :
                                            cat.level === 'moyen' ? 'bg-warning/10 text-warning border-warning/20' :
                                            'bg-success/10 text-success border-success/20'
                                        )}>
                                            {cat.level}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Revision History */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-1 flex items-center gap-3">
                    <History strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Historique des Révisions
                </h3>
                <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border p-8 space-y-6 shadow-sm">
                    {[
                        { date: '15 Sep 2025', version: 'v4.2', author: 'Direction', changes: 'Ajout risques psychosociaux + mise à jour poste plonge' },
                        { date: '01 Mar 2025', version: 'v4.1', author: 'Direction', changes: 'Révision annuelle complète — audit CARSAT' },
                        { date: '15 Sep 2024', version: 'v4.0', author: 'Cabinet externe', changes: 'Refonte complète après travaux cuisine' },
                    ].map((rev, i) => (
                        <div key={i} className="flex items-start gap-6 border-b border-border/50 pb-6 last:border-0 last:pb-0">
                            <div className="w-14 h-14 bg-bg-tertiary rounded-xl flex flex-col items-center justify-center border border-border shrink-0">
                                <span className="text-[10px] font-black text-accent uppercase">{rev.version}</span>
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className="font-serif font-semibold text-text-primary">{rev.date}</span>
                                    <span className="text-[9px] font-black text-text-muted uppercase tracking-widest flex items-center gap-1">
                                        <Users strokeWidth={1.5} className="w-3 h-3" /> {rev.author}
                                    </span>
                                </div>
                                <p className="text-[13px] text-text-muted">{rev.changes}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
