"use client";

import { useRegistre } from "@/context/RegistreContext";
import { Flame, MapPin, Calendar, Clock, CheckCircle2, AlertTriangle, Users, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;

export function IncendieSection() {
    const { incendieDoc, extincteurs, exercices } = useRegistre();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="bg-white dark:bg-bg-secondary rounded-[2.5rem] border border-border p-10 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 -mr-24 -mt-24 rounded-full blur-3xl" />
                <div className="relative z-10 flex items-start gap-6">
                    <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/10 shadow-sm">
                        <Flame strokeWidth={1.5} className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-serif font-black italic text-text-primary tracking-tight">Registre de Sécurité Incendie</h2>
                        <p className="text-text-muted text-sm mt-2 max-w-xl leading-relaxed">{incendieDoc.description}</p>
                        <div className="flex items-center gap-6 mt-4">
                            <div className="flex items-center gap-2 text-text-muted">
                                <Calendar strokeWidth={1.5} className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono font-bold">MAJ : {incendieDoc.lastUpdated}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                                <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-mono font-bold">Révision : {incendieDoc.nextReview}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Extincteurs */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                        <MapPin strokeWidth={1.5} className="w-3.5 h-3.5" />
                        Registre des Extincteurs
                    </h3>
                    <span className="text-[10px] font-mono font-bold text-text-muted">{extincteurs.length} équipements</span>
                </div>
                <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border shadow-sm overflow-hidden">
                    <table className="w-full text-sm text-left">
                        <thead>
                            <tr className="bg-bg-tertiary/30 text-[10px] font-black text-text-muted uppercase tracking-[0.2em] border-b border-border">
                                <th className="px-8 py-5">Emplacement</th>
                                <th className="px-8 py-5">Type</th>
                                <th className="px-6 py-5">Dernier Contrôle</th>
                                <th className="px-6 py-5">Prochain Contrôle</th>
                                <th className="px-6 py-5">État</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {extincteurs.map((ext) => (
                                <tr key={ext.id} className="hover:bg-bg-tertiary/10 transition-colors">
                                    <td className="px-8 py-5 font-serif font-semibold text-text-primary">{ext.location}</td>
                                    <td className="px-8 py-5 text-text-muted font-mono text-[12px]">{ext.type}</td>
                                    <td className="px-6 py-5 text-text-muted font-mono text-[12px]">{ext.lastCheck}</td>
                                    <td className="px-6 py-5 text-text-muted font-mono text-[12px]">{ext.nextCheck}</td>
                                    <td className="px-6 py-5">
                                        <span className={cn(
                                            "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                            ext.status === 'ok' ? 'bg-success/10 text-success border-success/20' :
                                            ext.status === 'a_verifier' ? 'bg-warning/10 text-warning border-warning/20' :
                                            'bg-error/10 text-error border-error/20'
                                        )}>
                                            {ext.status === 'ok' ? 'OK' : ext.status === 'a_verifier' ? 'À vérifier' : 'Hors service'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Exercices d'évacuation */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] flex items-center gap-3">
                        <Users strokeWidth={1.5} className="w-3.5 h-3.5" />
                        Exercices d'Évacuation
                    </h3>
                    <Button variant="outline" className="h-9 rounded-xl border-border px-4 font-bold text-[10px] uppercase tracking-widest">
                        <Plus strokeWidth={1.5} className="w-3.5 h-3.5 mr-2" /> Planifier
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {exercices.map((ex) => (
                        <div key={ex.id} className={cn(
                            "bg-white dark:bg-bg-secondary rounded-2xl border p-8 shadow-sm relative overflow-hidden",
                            ex.status === 'planifie' ? 'border-dashed border-accent/30' : 'border-border'
                        )}>
                            {ex.status === 'planifie' && (
                                <div className="absolute top-4 right-4 px-2.5 py-1 bg-accent/10 text-accent rounded-full text-[9px] font-black uppercase tracking-widest">
                                    Planifié
                                </div>
                            )}
                            <div className="flex items-center gap-3 mb-6">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center border",
                                    ex.status === 'realise' ? 'bg-success/10 text-success border-success/10' : 'bg-accent/10 text-accent border-accent/10'
                                )}>
                                    {ex.status === 'realise' ? <CheckCircle2 strokeWidth={1.5} className="w-5 h-5" /> : <Calendar strokeWidth={1.5} className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-serif font-bold text-text-primary">{ex.date}</p>
                                    {ex.duration && <p className="text-[10px] font-mono text-text-muted">Durée : {ex.duration}</p>}
                                </div>
                            </div>
                            {ex.participants > 0 && (
                                <div className="flex items-center gap-2 mb-4 text-text-muted">
                                    <Users strokeWidth={1.5} className="w-3.5 h-3.5" />
                                    <span className="text-[11px] font-bold">{ex.participants} participants</span>
                                </div>
                            )}
                            <p className="text-[12px] text-text-muted leading-relaxed">{ex.observations}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Consignes */}
            <div className="bg-red-50 dark:bg-red-500/5 rounded-2xl border border-red-200 dark:border-red-500/10 p-8">
                <div className="flex items-start gap-4">
                    <AlertTriangle strokeWidth={1.5} className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    <div>
                        <h4 className="font-serif font-bold text-red-900 dark:text-red-300 mb-2">Consignes de Sécurité</h4>
                        <ul className="text-sm text-red-800 dark:text-red-200/80 space-y-2 leading-relaxed">
                            <li>• Les issues de secours doivent rester dégagées en permanence</li>
                            <li>• Exercice d'évacuation obligatoire tous les 6 mois</li>
                            <li>• Vérification annuelle des extincteurs par un organisme agréé</li>
                            <li>• Le registre de sécurité incendie doit être tenu à disposition des autorités</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
