"use client";

import { useRegistre } from "@/context/RegistreContext";
import { BadgeCheck, Phone, Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, Plus, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;

const TYPE_LABELS: Record<string, string> = {
    nettoyage: 'Nettoyage',
    maintenance: 'Maintenance',
    deratisation: 'Dératisation',
    securite: 'Sécurité',
    hottes: 'Hottes',
    laboratoire: 'Laboratoire',
    autre: 'Autre',
};

const TYPE_COLORS: Record<string, string> = {
    nettoyage: 'bg-blue-500/10 text-blue-500 border-blue-500/10',
    maintenance: 'bg-amber-500/10 text-amber-600 border-amber-500/10',
    deratisation: 'bg-green-500/10 text-green-500 border-green-500/10',
    securite: 'bg-red-500/10 text-red-500 border-red-500/10',
    hottes: 'bg-orange-500/10 text-orange-500 border-orange-500/10',
    laboratoire: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/10',
    autre: 'bg-bg-tertiary text-text-muted border-border',
};

export function PrestatairesSection() {
    const { prestataires } = useRegistre();

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/10">
                        <BadgeCheck strokeWidth={1.5} className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-serif font-black italic text-text-primary tracking-tight">Certifications Prestataires</h2>
                        <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-0.5">{prestataires.length} prestataires</p>
                    </div>
                </div>
                <Button variant="outline" className="h-11 rounded-xl border-border px-5 font-bold text-[10px] uppercase tracking-widest">
                    <Plus strokeWidth={1.5} className="w-4 h-4 mr-2" /> Ajouter
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prestataires.map((p) => (
                    <div key={p.id} className="group bg-white dark:bg-bg-secondary rounded-2xl border border-border p-8 shadow-sm hover:shadow-2xl transition-all duration-500">
                        <div className="flex items-start justify-between mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-xl bg-bg-tertiary border border-border flex items-center justify-center font-serif text-xl font-black text-text-primary">
                                    {p.name.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="font-serif font-bold text-lg text-text-primary group-hover:text-accent transition-colors">{p.name}</h4>
                                    <span className={cn("inline-flex px-2.5 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border mt-1", TYPE_COLORS[p.type])}>
                                        {TYPE_LABELS[p.type]}
                                    </span>
                                </div>
                            </div>
                            <span className={cn(
                                "px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-1.5",
                                p.status === 'valide' ? 'bg-success/10 text-success border-success/20' :
                                p.status === 'a_renouveler' ? 'bg-warning/10 text-warning border-warning/20' :
                                'bg-error/10 text-error border-error/20'
                            )}>
                                {p.status === 'valide' ? 'Valide' : p.status === 'a_renouveler' ? 'À renouveler' : 'Expiré'}
                            </span>
                        </div>

                        <div className="bg-bg-tertiary/30 rounded-xl p-5 mb-6 border border-border/50">
                            <p className="text-[10px] font-black text-text-muted uppercase tracking-widest mb-2">Certification</p>
                            <p className="text-sm font-medium text-text-primary">{p.certification}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-[11px]">
                            <div className="flex items-center gap-2 text-text-muted">
                                <Calendar strokeWidth={1.5} className="w-3.5 h-3.5" />
                                <span className="font-mono">Exp : {p.certificationExpiry}</span>
                            </div>
                            <div className="flex items-center gap-2 text-text-muted">
                                <Clock strokeWidth={1.5} className="w-3.5 h-3.5" />
                                <span className="font-mono">{p.frequency}</span>
                            </div>
                        </div>

                        {p.phone && (
                            <div className="mt-6 pt-6 border-t border-border/50">
                                <Button variant="outline" className="h-10 rounded-xl border-border px-4 font-bold text-[10px] uppercase tracking-widest w-full">
                                    <Phone strokeWidth={1.5} className="w-3.5 h-3.5 mr-2" /> {p.phone}
                                </Button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
