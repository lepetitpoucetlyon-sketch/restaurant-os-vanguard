"use client";

import { useRegistre } from "@/context/RegistreContext";
import { 
    BadgeCheck, 
    Calendar, 
    Clock, 
    AlertTriangle, 
    CheckCircle2, 
    XCircle, 
    FileText, 
    ShieldCheck, 
    UtensilsCrossed,
    Gem,
    Beef
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;

export function SanitaryComplianceSection() {
    const { certHalal, agrementBoucher, hottesDoc } = useRegistre();

    const sections = [
        {
            doc: hottesDoc,
            icon: ShieldCheck,
            color: 'text-status-warning',
            bg: 'bg-status-warning/10',
            borderColor: 'border-orange-500/20',
            title: "Entretien des Hottes",
            mandatory: true,
            warning: "Obligatoire 1x/an (3-4x/an en Fast Food). Risque d'incendie et invalidité d'assurance."
        },
        {
            doc: certHalal,
            icon: Gem,
            color: 'text-status-success',
            bg: 'bg-status-success/10',
            borderColor: 'border-emerald-500/20',
            title: "Certification Rituelle",
            mandatory: false,
            warning: "Requis pour les établissements proposant des produits certifiés Halal ou Kasher."
        },
        {
            doc: agrementBoucher,
            icon: Beef,
            color: 'text-status-danger',
            bg: 'bg-status-danger/10',
            borderColor: 'border-red-500/20',
            title: "Agrément Boucher",
            mandatory: true,
            warning: "Agrément sanitaire ou dispense d'agrément obligatoire pour tout fournisseur de viande."
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-10">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-status-success/10 flex items-center justify-center border border-emerald-500/20 text-status-success">
                    <ShieldCheck strokeWidth={1.5} className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-serif font-black italic text-text-primary tracking-tight">Conformité Sanitaire & Agréments</h2>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.3em] mt-0.5">Suivi des certifications et obligations spécifiques</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {sections.map((s, idx) => (
                    <div key={idx} className="bg-surface-card dark:bg-bg-secondary rounded-3xl border border-border p-8 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden relative group">
                        <div className={cn("absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 rounded-full opacity-5 group-hover:opacity-10 transition-opacity", s.bg)} />
                        
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8 relative z-10">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm", s.bg, s.borderColor, s.color)}>
                                        <s.icon strokeWidth={1.5} className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-xl font-serif font-bold text-text-primary">{s.title}</h3>
                                    {s.mandatory && (
                                        <span className="bg-status-danger/10 text-status-danger text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/10">Obligatoire</span>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-bg-tertiary/30 rounded-2xl p-6 border border-border/50">
                                        <p className="text-sm text-text-primary font-medium">{s.doc?.name || 'Document sans titre'}</p>
                                        <p className="text-[12px] text-text-muted mt-2 leading-relaxed">Document de conformité réglementaire scellé par le protocole Nexus.</p>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-text-muted">
                                            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            <span className="text-[10px] font-mono whitespace-nowrap">MAJ : {String(s.doc?.updatedAt || 'N/A')}</span>
                                        </div>
                                        <div className={cn(
                                            "flex items-center gap-2",
                                            s.doc?.status === 'valid' ? 'text-success' : 'text-warning'
                                        )}>
                                            <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                                            <span className="text-[10px] font-mono whitespace-nowrap font-bold text-text-muted">Échéance : {String(s.doc?.validUntil || 'N/A')}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 bg-status-warning/5 p-4 rounded-xl border border-amber-500/10">
                                        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-warning/80 font-medium italic">{s.warning}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px]">
                                <div className={cn(
                                    "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border flex items-center gap-2 shadow-sm",
                                    s.doc?.status === 'valid' ? 'bg-success/10 text-success border-success/20' : 'bg-warning/10 text-warning border-warning/20'
                                )}>
                                    {s.doc?.status === 'valid' ? (
                                        <><CheckCircle2 className="w-4 h-4" /> Conforme</>
                                    ) : (
                                        <><AlertTriangle className="w-4 h-4" /> Attention</>
                                    )}
                                </div>
                                <button className="text-[10px] font-black uppercase tracking-widest text-accent hover:underline decoration-2 underline-offset-4">Voir le document</button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
