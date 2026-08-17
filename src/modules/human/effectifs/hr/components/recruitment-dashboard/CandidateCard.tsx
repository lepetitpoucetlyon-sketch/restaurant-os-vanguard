'use client';

import { motion } from 'framer-motion';
import { 
    MoreHorizontal, 
    Mail, 
    Phone, 
    ChevronRight,
    FileText,
    ShieldCheck,
    AlertCircle,
} from 'lucide-react';
import type { Candidate, CandidateStatus } from '@nexus/contracts';

interface CandidateCardProps { 
    candidate: Candidate; 
    onStatusChange: (id: string, status: CandidateStatus) => void;
}

export function CandidateCard({ candidate, onStatusChange }: CandidateCardProps) {
    return (
        <motion.div
            layoutId={candidate.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group bg-white dark:bg-bg-tertiary border border-border rounded-2xl p-4 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-1.5 hover:bg-bg-secondary rounded-lg text-text-muted">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>

            <h4 className="font-serif italic font-bold text-text-primary text-base mb-1 truncate">
                {candidate.firstName} {candidate.lastName}
            </h4>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mb-4">
                {candidate.appliedRole}
            </p>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
                    <Mail className="w-3 h-3" />
                    <span className="truncate">{candidate.email}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-text-muted">
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
