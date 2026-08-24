'use client';

import React, { useState } from 'react';
import { UserPlus, Search, ShieldCheck } from 'lucide-react';
import { useRecruitment } from '..';
import type { CandidateStatus } from '@nexus/contracts';
import { CandidateCard } from './recruitment-dashboard/CandidateCard';
import { AddCandidateModal } from './recruitment-dashboard/AddCandidateModal';

const COLUMNS: { id: CandidateStatus; label: string; color: string }[] = [
    { id: 'new', label: 'Nouveaux', color: '#10B981' },
    { id: 'interview', label: 'Entretien', color: '#3B82F6' },
    { id: 'trial', label: 'Essai', color: '#8B5CF6' },
    { id: 'refused', label: 'Refusés', color: '#EF4444' },
    { id: 'hired', label: 'Embauchés', color: '#F59E0B' },
];

export function RecruitmentDashboard() {
    const { candidates, updateCandidateStatus, addCandidate } = useRecruitment();
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const filteredCandidates = candidates.filter(c => 
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.appliedRole.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-black italic text-text-primary tracking-tighter mb-2">
                        Pipeline de <span className="text-accent-gold not-italic">Recrutement</span>
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-status-success bg-status-success/10 px-3 py-1 rounded-full border border-emerald-500/20">
                            <ShieldCheck className="w-3 h-3" />
                            RGPD : Conforme
                        </span>
                        <span className="text-text-muted text-xs font-bold uppercase tracking-widest opacity-60">
                            {candidates.length} candidatures actives
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-72">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Rechercher un candidat..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 h-12 bg-bg-secondary border border-border rounded-xl text-sm font-medium focus:border-accent-gold outline-none transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="h-12 px-6 bg-accent-gold text-text-on-primary rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-accent-gold/90 transition-all flex items-center gap-2 shadow-xl shadow-accent-gold/20 hover:-translate-y-0.5"
                    >
                        <UserPlus className="w-4 h-4" />
                        Nouveau Candidat
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-6 h-[calc(100vh-280px)] min-h-[600px]">
                {COLUMNS.map(column => (
                    <div key={column.id} className="flex flex-col gap-4 bg-bg-secondary/30 rounded-[2rem] p-4 border border-border/50">
                        <div className="flex items-center justify-between px-4 py-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">
                                    {column.label}
                                </span>
                            </div>
                            <span className="text-[10px] font-bold text-text-muted bg-bg-tertiary px-2 py-0.5 rounded-md">
                                {filteredCandidates.filter(c => c.status === column.id).length}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto elegant-scrollbar space-y-4 pr-2">
                            {filteredCandidates
                                .filter(c => c.status === column.id)
                                .map(candidate => (
                                    <CandidateCard 
                                        key={candidate.id} 
                                        candidate={candidate} 
                                        onStatusChange={updateCandidateStatus}
                                    />
                                ))
                            }
                        </div>
                    </div>
                ))}
            </div>
            
            <AddCandidateModal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                onAdd={addCandidate as React.ComponentProps<typeof AddCandidateModal>['onAdd']}
            />
        </div>
    );
}
