"use client";

import { useRegistre } from "@/shared/contexts/RegistreContext";
import { PMRAmenagement } from "@/shared/nexus/contracts/context/registre.contracts";
import { Accessibility, Calendar, Clock, CheckCircle2, AlertTriangle, Wrench, MapPin } from "lucide-react";
import { cn } from "@/lib/ui.foundations";

export function PMRSection() {
    const { pmrDoc, pmrAmenagements } = useRegistre();

    const amenagementsArray = (pmrAmenagements || []) as PMRAmenagement[];
    const stats = {
        conforme: amenagementsArray.filter((a: PMRAmenagement) => a.status === 'conforme').length,
        en_cours: amenagementsArray.filter((a: PMRAmenagement) => a.status === 'en_cours').length,
        a_faire: amenagementsArray.filter((a: PMRAmenagement) => a.status === 'a_faire').length,
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-surface-card dark:bg-bg-secondary rounded-[2.5rem] border border-border p-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-48 h-48 bg-action-primary/5 -mr-24 -mt-24 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-action-primary/10 flex items-center justify-center border border-focus/10 shadow-sm">
                        <Accessibility strokeWidth={1.5} className="w-8 h-8 text-brand" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight">Accessibilité PMR</h2>
                        <p className="text-[10px] font-black text-brand uppercase tracking-[0.3em] mt-1">Registre Public d'Accessibilité</p>
                        <p className="text-text-muted text-sm mt-3 max-w-xl leading-relaxed">{String(pmrDoc?.name || 'Diagnostic accessibilité PMR en attente de synchronisation.')}</p>
                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2 text-text-muted">
                                <Calendar strokeWidth={1.5} className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono font-bold">MAJ : {String(pmrDoc?.updatedAt || 'N/A')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                                <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono font-bold">Révision : {String(pmrDoc?.validUntil || 'N/A')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
                {[
                    { label: 'Conforme', count: stats.conforme, icon: CheckCircle2, color: 'text-success', bg: 'bg-success/5 border-success/10' },
                    { label: 'En cours', count: stats.en_cours, icon: Wrench, color: 'text-warning', bg: 'bg-warning/5 border-warning/10' },
                    { label: 'À faire', count: stats.a_faire, icon: AlertTriangle, color: 'text-error', bg: 'bg-error/5 border-error/10' },
                ].map((s) => (
                    <div key={s.label} className={cn("p-6 rounded-2xl border", s.bg)}>
                        <div className="flex items-center justify-between mb-3">
                            <s.icon className={cn("w-6 h-6", s.color)} strokeWidth={1.5} />
                            <span className={cn("text-3xl font-serif font-black", s.color)}>{s.count}</span>
                        </div>
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-text-muted">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Aménagements */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] px-1 flex items-center gap-3">
                    <MapPin strokeWidth={1.5} className="w-3.5 h-3.5" />
                    Diagnostic par Zone
                </h3>
                <div className="space-y-4">
                    {amenagementsArray.map((am: PMRAmenagement) => (
                        <div key={am.id} className="bg-surface-card dark:bg-bg-secondary rounded-2xl border border-border p-6 shadow-sm flex items-center justify-between hover:shadow-lg transition-all">
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                                    am.status === 'conforme' ? 'bg-success/10 text-success border-success/10' :
                                    am.status === 'en_cours' ? 'bg-warning/10 text-warning border-warning/10' :
                                    'bg-error/10 text-error border-error/10'
                                )}>
                                    {am.status === 'conforme' ? <CheckCircle2 strokeWidth={1.5} className="w-5 h-5" /> :
                                     am.status === 'en_cours' ? <Wrench strokeWidth={1.5} className="w-5 h-5" /> :
                                     <AlertTriangle strokeWidth={1.5} className="w-5 h-5" />}
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-text-primary">{am.zone}</h4>
                                    <p className="text-[12px] text-text-muted mt-0.5">{am.description}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                                <span className={cn(
                                    "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                    am.status === 'conforme' ? 'bg-success/10 text-success border-success/20' :
                                    am.status === 'en_cours' ? 'bg-warning/10 text-warning border-warning/20' :
                                    'bg-error/10 text-error border-error/20'
                                )}>
                                    {am.status === 'conforme' ? 'Conforme' : am.status === 'en_cours' ? 'En cours' : 'À faire'}
                                </span>
                                {am.deadline && (
                                    <p className="text-[10px] font-mono text-text-muted mt-2">Échéance : {am.deadline}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Info */}
            <div className="bg-action-primary dark:bg-action-primary/5 rounded-2xl border border-focus dark:border-focus/10 p-8">
                <div className="flex items-start gap-4">
                    <AlertTriangle strokeWidth={1.5} className="w-5 h-5 text-brand mt-0.5 shrink-0" />
                    <div className="bg-bg-tertiary/30 rounded-2xl p-6 border border-border/50">
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mb-2">Note de conformité</p>
                        <p className="text-sm text-brand dark:text-brand/80 leading-relaxed">Document validé et archivé dans le coffre-fort numérique Nexus.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
