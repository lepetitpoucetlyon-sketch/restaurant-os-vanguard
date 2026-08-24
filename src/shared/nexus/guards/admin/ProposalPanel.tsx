"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Check, X, AlertTriangle, TrendingUp } from 'lucide-react';
import { GlassCard } from '@ui/GlassCard';
import { Button } from '@ui/button';
import { StaffingProposal } from '@/lib/shared-kernel';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { NexusStaffingOracle } from '@/modules/human';

/**
 * 🏛️ ProposalPanel - Grade X
 * L'interface de validation du Suzerain.
 * Permet de transformer les prédictions de l'Oracle en réalité opérationnelle.
 */
export function ProposalPanel() {
    const [proposals, setProposals] = useState<StaffingProposal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProposals();
        const interval = setInterval(fetchProposals, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchProposals = async () => {
        try {
            // Mocking the query for the demo Act
            const data = await Nexus.adapter.query(Nexus.getTenantPath('proposals/staffing'), {
                where: [{ field: 'status', operator: '==', value: 'pending' }]
            }) as StaffingProposal[];
            setProposals(data || []);
        } catch (e) {
            console.error("Failed to fetch proposals", e);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        await NexusStaffingOracle.approveProposal(id);
        setProposals(prev => prev.filter(p => p.id !== id));
    };

    const handleReject = async (id: string) => {
        const path = Nexus.getTenantPath(`proposals/staffing/${id}`);
        await Nexus.adapter.set(path, { status: 'rejected' });
        setProposals(prev => prev.filter(p => p.id !== id));
    };

    if (proposals.length === 0 && !loading) return null;

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 px-2">
                <AlertTriangle size={16} className="text-warning animate-pulse" />
                <span className="text-chip-label text-text-muted">Conseil Suzerain : Propositions en Attente</span>
            </div>

            <AnimatePresence>
                {proposals.map(proposal => (
                    <motion.div
                        key={proposal.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <GlassCard className="p-4 border-warning/20 bg-warning/5 overflow-hidden relative group">
                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-3">
                                        <div className="p-2 rounded-lg bg-warning/10 text-warning">
                                            <Users size={20} />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black uppercase tracking-tight text-text-primary/90">
                                                Renfort Suggéré : {proposal.targetDate}
                                            </span>
                                            <span className="text-[10px] text-text-muted font-bold opacity-70">
                                                ID: {proposal.id}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-surface-sidebar/40 border border-subtle">
                                        <TrendingUp size={10} className="text-success" />
                                        <span className="text-[9px] font-mono font-bold text-success">
                                            Velocity: {proposal.predictedVelocity}
                                        </span>
                                    </div>
                                </div>

                                <p className="text-[11px] leading-relaxed italic text-text-primary/80 border-l-2 border-warning/40 pl-3 py-1">
                                    "{proposal.reason}"
                                </p>

                                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black text-text-muted opacity-50">Actuel</span>
                                            <span className="text-xs font-mono font-bold">{proposal.currentStaffCount}</span>
                                        </div>
                                        <div className="text-warning opacity-30">→</div>
                                        <div className="flex flex-col">
                                            <span className="text-[8px] uppercase font-black text-warning opacity-70">Suggéré</span>
                                            <span className="text-xs font-mono font-bold text-warning">{proposal.suggestedStaffCount}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button 
                                            size="sm" 
                                            variant="ghost" 
                                            onClick={() => handleReject(proposal.id)}
                                            className="h-8 w-8 p-0 hover:bg-error/20 hover:text-error"
                                        >
                                            <X size={14} />
                                        </Button>
                                        <Button 
                                            size="sm" 
                                            onClick={() => handleApprove(proposal.id)}
                                            className="h-8 bg-success hover:bg-success/90 text-text-primary gap-2 px-4 shadow-lg shadow-success/20"
                                        >
                                            <Check size={14} />
                                            <span className="text-[10px] font-bold">Approuver</span>
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
