"use client";

import { ShieldCheck, CheckCircle2, Calendar } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { Candidate } from "@nexus/contracts";
import { Button } from "@/shared/components/ui/Button";

interface CandidateGdprSectionProps {
    formData: Partial<Candidate>;
    setFormDraft: React.Dispatch<React.SetStateAction<Partial<Candidate> | null>>;
    initialFormData: Partial<Candidate>;
}

export function CandidateGdprSection({
    formData,
    setFormDraft,
    initialFormData,
}: CandidateGdprSectionProps) {
    return (
        <div className={cn(
            "p-6 rounded-2xl border transition-all duration-500",
            formData.gdpr?.consented ? "bg-success/5 border-success/20" : "bg-error/5 border-error/20"
        )}>
            <div className="flex items-start gap-4">
                <div className={cn(
                    "p-2.5 rounded-xl",
                    formData.gdpr?.consented ? "bg-success/10 text-success" : "bg-error/10 text-error"
                )}>
                    <ShieldCheck className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <h4 className="text-[13px] font-bold text-text-primary uppercase tracking-widest">Conformité RGPD</h4>
                    <p className="text-micro text-text-muted mt-2 leading-relaxed">
                        Le candidat a été informé de la conservation de ses données par l'entreprise pour une durée maximale de 24 mois.
                        L'entreprise s'engage à ne pas céder ces données et à respecter le droit à l'effacement.
                    </p>
                    <div className="flex items-center gap-4 mt-6">
                        <Button variant="ghost"
                            onClick={() => setFormDraft(p => {
                                const next = p ?? initialFormData;
                                return {
                                    ...next,
                                    gdpr: {
                                        ...next.gdpr!,
                                        consented: !next.gdpr?.consented,
                                        date: new Date().toISOString()
                                    }
                                };
                            })}
                            className={cn(
                                "h-10 px-6 rounded-xl text-nano font-black uppercase tracking-[0.2em] transition-all flex items-center gap-2",
                                formData.gdpr?.consented 
                                    ? "bg-success text-text-primary shadow-lg shadow-success/20" 
                                    : "bg-bg-tertiary text-text-muted border border-border hover:border-error"
                            )}
                        >
                            {formData.gdpr?.consented ? <CheckCircle2 className="w-4 h-4" /> : null}
                            {formData.gdpr?.consented ? "Consentement Donné" : "Donner mon consentement"}
                        </Button>
                        {formData.gdpr?.consented && (
                            <span className="text-nano font-bold text-success flex items-center gap-2 italic">
                                <Calendar className="w-3.5 h-3.5" /> Loggé le {new Date().toLocaleDateString('fr-FR')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
