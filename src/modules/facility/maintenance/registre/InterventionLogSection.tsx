"use client";

import { useRegistre } from "@/modules/compliance";
import { 
    Calendar, 
    BadgeCheck, 
    AlertTriangle, 
    Plus, 
    Download, 
    FileText,
    History,
    Search
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Button } from "@ui/button";

export function InterventionLogSection() {
    const { interventions } = useRegistre();

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-12">
            {/* Legal Warning Header */}
            <div className="bg-status-warning dark:bg-status-warning/5 border border-amber-200 dark:border-action-primary/20 rounded-[2.5rem] p-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-status-warning/5 -mr-32 -mt-32 rounded-full blur-3xl" />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                    <div className="w-20 h-20 rounded-3xl bg-status-warning/10 flex items-center justify-center border border-action-primary/20 shrink-0">
                        <AlertTriangle strokeWidth={1.5} className="w-10 h-10 text-status-warning" />
                    </div>
                    <div className="space-y-2 text-center md:text-left">
                        <h2 className="text-2xl font-serif font-black italic text-status-warning dark:text-status-warning">Obligation de Conservation</h2>
                        <p className="text-sm text-status-warning/80 dark:text-status-warning/60 max-w-2xl leading-relaxed">
                            Le restaurateur est **légalement tenu** de conserver tous les avis de passage et bons d'intervention des entreprises spécialisées (Hottes, Dératisation, Maintenance, Déchets). Ces documents sont indispensables en cas de contrôle sanitaire ou de sinistre assurance.
                        </p>
                    </div>
                    <Button className="md:ml-auto h-14 px-8 bg-status-warning hover:bg-status-warning text-text-primary rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-600/20">
                        <Plus className="w-4 h-4 mr-2" /> Numériser un bon
                    </Button>
                </div>
            </div>

            {/* toolbar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-surface-card dark:bg-bg-secondary p-4 rounded-3xl border border-border shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input 
                        type="text" 
                        placeholder="Rechercher par prestataire ou type..." 
                        className="w-full h-12 pl-12 pr-5 bg-bg-tertiary/50 border border-border rounded-2xl text-sm focus:outline-none focus:border-accent/50 transition-all font-medium"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="h-12 flex-1 md:px-6 rounded-2xl border-border font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Trier par date</Button>
                    <Button variant="outline" className="h-12 flex-1 md:px-6 rounded-2xl border-border font-bold text-[10px] uppercase tracking-widest whitespace-nowrap">Filtrer</Button>
                </div>
            </div>

            {/* Grid of Slips */}
            <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center gap-3 px-2 mb-2">
                    <History className="w-4 h-4 text-text-muted" />
                    <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em]">Historique des Interventions</h3>
                </div>

                {(interventions || []).map((int: import("@nexus/contracts/context/registre.contracts").InterventionDocument) => (
                    <div key={int.id} className="group bg-surface-card dark:bg-bg-secondary border border-border rounded-3xl p-6 hover:shadow-2xl hover:border-accent/30 transition-all duration-500 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "w-14 h-14 rounded-2xl flex items-center justify-center border shadow-inner",
                                    int.status === 'realise' ? "bg-success/5 border-success/10 text-success" : "bg-bg-tertiary border-border text-text-muted"
                                )}>
                                    <BadgeCheck strokeWidth={1.5} className="w-7 h-7" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-serif font-bold text-lg text-text-primary group-hover:text-accent transition-colors">{int.prestataire}</h4>
                                        <span className="px-2 py-0.5 rounded-lg bg-bg-tertiary border border-border text-[9px] font-black uppercase tracking-widest text-text-muted">
                                            {int.type}
                                        </span>
                                    </div>
                                    <p className="text-sm text-text-muted font-medium italic">« {int.description} »</p>
                                </div>
                            </div>

                            <div className="flex items-center md:flex-col md:items-end justify-between gap-4 md:gap-2 border-t md:border-t-0 pt-4 md:pt-0 mt-4 md:mt-0 border-border/50">
                                <div className="flex items-center gap-2 text-text-primary font-mono text-[11px] font-bold bg-bg-tertiary px-3 py-1.5 rounded-full border border-border">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {int.date}
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="p-3 rounded-xl bg-bg-tertiary hover:bg-accent/10 hover:text-accent transition-all border border-border">
                                        <Download className="w-4 h-4" />
                                    </button>
                                    <button className="p-3 rounded-xl bg-bg-tertiary hover:bg-accent/10 hover:text-accent transition-all border border-border">
                                        <FileText className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Status bar */}
                        <div className={cn(
                            "absolute bottom-0 left-0 h-1 transition-all duration-500",
                            int.status === 'realise' ? "w-full bg-success/50" : "w-1/3 bg-warning/50"
                        )} />
                    </div>
                ))}
            </div>

            {/* Empty state hint */}
            <div className="p-10 border-2 border-dashed border-border rounded-[3rem] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-bg-tertiary flex items-center justify-center mx-auto">
                    <History className="w-8 h-8 text-text-muted opacity-20" />
                </div>
                <div>
                    <p className="text-sm font-bold text-text-muted uppercase tracking-widest">Fin de l'historique</p>
                    <p className="text-[11px] text-text-muted/60 mt-1">L'archivage automatique conserve vos bons pendant 10 ans.</p>
                </div>
            </div>
        </div>
    );
}
