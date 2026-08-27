'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
    MoreHorizontal,
    Mail,
    Phone,
    ChevronRight,
    FileText,
    ShieldCheck,
    AlertCircle,
    XCircle,
} from 'lucide-react';
import type { Candidate, CandidateStatus } from '@nexus/contracts';

interface CandidateCardProps {
    candidate: Candidate;
    onStatusChange: (id: string, status: CandidateStatus) => void;
}

export function CandidateCard({ candidate, onStatusChange }: CandidateCardProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Fermeture au clic extérieur et à Échap : le menu se superpose aux cartes
    // voisines du kanban, il ne doit pas rester ouvert en changeant de colonne.
    useEffect(() => {
        if (!isMenuOpen) return;
        const onPointerDown = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsMenuOpen(false);
        };
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMenuOpen(false); };
        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [isMenuOpen]);

    const menuItem = 'w-full flex items-center gap-2.5 px-3 py-2.5 text-xs text-left text-text-secondary hover:bg-bg-secondary hover:text-text-primary transition-colors';

    return (
        <motion.div
            layoutId={candidate.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white dark:bg-bg-tertiary border border-border rounded-2xl p-4 hover:shadow-xl transition-all relative"
        >
            <div
                ref={menuRef}
                className={`absolute top-0 right-0 p-2 transition-opacity ${isMenuOpen ? 'opacity-100 z-20' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'}`}
            >
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(v => !v)}
                    aria-haspopup="menu"
                    aria-expanded={isMenuOpen}
                    aria-label={`Actions pour ${candidate.firstName} ${candidate.lastName}`}
                    className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>

                {isMenuOpen && (
                    <div
                        role="menu"
                        className="absolute right-2 top-10 w-52 rounded-xl bg-bg-primary border border-border shadow-premium overflow-hidden"
                    >
                        {candidate.cvUrl ? (
                            <a
                                href={candidate.cvUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                role="menuitem"
                                className={menuItem}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                Ouvrir le CV
                            </a>
                        ) : (
                            <span className={`${menuItem} opacity-40 cursor-default`}>
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                Aucun CV joint
                            </span>
                        )}

                        {candidate.email && (
                            <a href={`mailto:${candidate.email}`} role="menuitem" className={menuItem} onClick={() => setIsMenuOpen(false)}>
                                <Mail className="w-3.5 h-3.5 shrink-0" />
                                Écrire au candidat
                            </a>
                        )}
                        {candidate.phone && (
                            <a href={`tel:${candidate.phone}`} role="menuitem" className={menuItem} onClick={() => setIsMenuOpen(false)}>
                                <Phone className="w-3.5 h-3.5 shrink-0" />
                                Appeler
                            </a>
                        )}

                        {candidate.status !== 'refused' && (
                            <button
                                type="button"
                                role="menuitem"
                                onClick={() => { onStatusChange(candidate.id, 'refused'); setIsMenuOpen(false); }}
                                className={`${menuItem} text-status-danger hover:text-status-danger border-t border-border`}
                            >
                                <XCircle className="w-3.5 h-3.5 shrink-0" />
                                Écarter la candidature
                            </button>
                        )}
                    </div>
                )}
            </div>

            <h4 className="font-serif italic font-bold text-text-primary text-base mb-1 truncate">
                {candidate.firstName} {candidate.lastName}
            </h4>
            <p className="text-nano font-bold text-accent uppercase tracking-widest mb-4">
                {candidate.appliedRole}
            </p>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-micro text-text-muted">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-micro text-text-muted">
                    <Phone className="w-3 h-3" />
                    <span>{candidate.phone}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-auto">
                <div className="flex -space-x-1.5">
                    {candidate.gdpr.consented ? (
                        <div className="w-6 h-6 rounded-full bg-status-success/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600" title="Consentement RGPD validé">
                            <ShieldCheck className="w-3 h-3" />
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full bg-status-danger/10 flex items-center justify-center border border-rose-500/20 text-rose-600" title="Consentement RGPD manquant">
                            <AlertCircle className="w-3 h-3" />
                        </div>
                    )}
                    {candidate.cvUrl && (
                        <div className="w-6 h-6 rounded-full bg-status-info/10 flex items-center justify-center border border-blue-500/20 text-blue-600" title="CV disponible">
                            <FileText className="w-3 h-3" />
                        </div>
                    )}
                </div>
                
                <div className="flex gap-1">
                    {candidate.status !== 'new' && (
                        <button 
                            onClick={() => onStatusChange(candidate.id, 'new')}
                            className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                        </button>
                    )}
                    <button 
                        onClick={() => {
                            const statuses: CandidateStatus[] = ['new', 'interview', 'trial', 'refused', 'hired'];
                            const currentIndex = statuses.indexOf(candidate.status);
                            if (currentIndex < statuses.length - 1) {
                                onStatusChange(candidate.id, statuses[currentIndex + 1]);
                            }
                        }}
                        className="p-1.5 hover:bg-bg-secondary rounded-lg text-accent-gold transition-colors"
                    >
                        <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
