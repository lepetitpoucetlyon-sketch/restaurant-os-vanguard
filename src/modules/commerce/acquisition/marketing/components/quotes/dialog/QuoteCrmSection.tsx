'use client';

import { Building2, User } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

interface QuoteCrmSectionProps {
    crmType: 'individual' | 'company';
    setCRMType: (type: 'individual' | 'company') => void;
    crmName: string;
    setCRMName: (name: string) => void;
    crmEmail: string;
    setCRMEmail: (email: string) => void;
    subject: string;
    setSubject: (subject: string) => void;
}

export function QuoteCrmSection({
    crmType,
    setCRMType,
    crmName,
    setCRMName,
    crmEmail,
    setCRMEmail,
    subject,
    setSubject,
}: QuoteCrmSectionProps) {
    return (
        <section className="space-y-8">
            <div className="flex items-center gap-4 px-2">
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <User className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-micro font-black text-text-muted uppercase tracking-[0.3em]">Cible de Haute Excellence</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Type Toggle */}
                <div className="space-y-4">
                    <label className="text-nano font-black text-text-muted uppercase tracking-widest block ml-2">Type d'entité</label>
                    <div className="flex p-1.5 bg-bg-secondary rounded-[24px] border border-border shadow-inner">
                        <button
                            onClick={() => setCRMType('company')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 py-3 rounded-[20px] text-chip-label transition-all",
                                crmType === 'company' ? "bg-surface-card dark:bg-surface-card/10 text-text-primary shadow-premium" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <Building2 className="w-4 h-4" />
                            Entreprise
                        </button>
                        <button
                            onClick={() => setCRMType('individual')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-3 py-3 rounded-[20px] text-chip-label transition-all",
                                crmType === 'individual' ? "bg-surface-card dark:bg-surface-card/10 text-text-primary shadow-premium" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            <User className="w-4 h-4" />
                            Particulier
                        </button>
                    </div>
                </div>

                {/* Name Input */}
                <div className="space-y-4">
                    <label className="text-nano font-black text-text-muted uppercase tracking-widest block ml-2">Dénomination</label>
                    <input
                        type="text"
                        value={crmName}
                        onChange={(e) => setCRMName(e.target.value)}
                        placeholder="Ex: Société Example SAS"
                        className="w-full h-14 px-8 bg-bg-secondary border border-border rounded-[24px] text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 shadow-inner"
                    />
                </div>

                {/* Email Input */}
                <div className="space-y-4">
                    <label className="text-nano font-black text-text-muted uppercase tracking-widest block ml-2">Coordination Email</label>
                    <input
                        type="email"
                        value={crmEmail}
                        onChange={(e) => setCRMEmail(e.target.value)}
                        placeholder="contact@archive-exécutive.com"
                        className="w-full h-14 px-8 bg-bg-secondary border border-border rounded-[24px] text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 shadow-inner"
                    />
                </div>

                {/* Subject Input */}
                <div className="space-y-4">
                    <label className="text-nano font-black text-text-muted uppercase tracking-widest block ml-2">Objet du Protocole</label>
                    <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Privatisation Salle Excellence..."
                        className="w-full h-14 px-8 bg-bg-secondary border border-border rounded-[24px] text-sm font-serif italic text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 shadow-inner"
                    />
                </div>
            </div>
        </section>
    );
}
