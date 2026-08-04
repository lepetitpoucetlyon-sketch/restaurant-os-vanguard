'use client';

import React, { useState } from 'react';
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
         
import { useFiscal } from '@/modules/ops';
import { BlockchainLedgerService } from '@/shared/nexus/engines/Ledger/accounting/domain/BlockchainLedgerService';
import { ShieldCheck, Binary, Clock, Search, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const FiscalAuditView: React.FC = () => {
    const { data: seals = [], isLoading: _sealsLoading } = useFiscal();
    const [isVerifying, setIsVerifying] = useState(false);
    const [auditResult, setAuditResult] = useState<{ success: boolean; message: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const runAudit = async () => {
        setIsVerifying(true);
        setAuditResult(null);
        try {
            const isValid = await BlockchainLedgerService.auditFullChain();
            setAuditResult({
                success: isValid,
                message: isValid 
                    ? "Chaîne fiscale intègre. Tous les sceaux sont valides et chaînés correctement."
                    : "Violation d'intégrité détectée ! La chaîne a été corrompue."
            });
        } catch (_error) {
            setAuditResult({ success: false, message: "Erreur lors de l'audit technique." });
        } finally {
            setIsVerifying(false);
        }
    };

    const filteredSeals = seals.filter(s => 
        (s.pieceNumber || s.id).toLowerCase().includes(searchTerm.toLowerCase()) || 
        (s.fiscalSealHash || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-surface-sidebar/50 p-6 rounded-2xl border border-default backdrop-blur-sm">
                <div>
                    <h2 className="text-2xl font-bold text-text-primary flex items-center gap-3">
                        <ShieldCheck className="text-status-success w-8 h-8" />
                        Registre d'Intégrité Fiscale (NF525)
                    </h2>
                    <p className="text-muted mt-1">Chaînage cryptographique SHA-256 inaltérable</p>
                </div>
                <button 
                    onClick={runAudit}
                    disabled={isVerifying || seals.length === 0}
                    className="px-6 py-3 bg-status-success hover:bg-status-success disabled:bg-surface-sidebar text-text-primary rounded-xl font-semibold transition-all shadow-lg flex items-center gap-2"
                >
                    {isVerifying ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                    ) : <Binary className="w-5 h-5" />}
                    Vérifier la Chaîne
                </button>
            </div>

            <AnimatePresence>
                {auditResult && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border flex items-center gap-4 ${
                            auditResult.success 
                            ? 'bg-status-success/10 border-emerald-500/20 text-status-success' 
                            : 'bg-status-danger/10 border-rose-500/20 text-status-danger'
                        }`}
                    >
                        {auditResult.success ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                        <span className="font-medium">{auditResult.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                <input 
                    type="text"
                    placeholder="Rechercher par ID de transaction ou hash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-surface-sidebar/50 border border-default rounded-xl py-4 pl-12 pr-4 text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
                />
            </div>

            <div className="grid gap-4">
                {filteredSeals.map((seal, index) => (
                    <motion.div 
                        key={seal.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-surface-sidebar/30 border border-default p-5 rounded-xl hover:bg-surface-sidebar/50 transition-colors group relative overflow-hidden"
                    >
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-mono bg-status-success/10 text-status-success px-2 py-1 rounded">
                                        #{(seal.pieceNumber || seal.id).slice(-8).toUpperCase()}
                                    </span>
                                    <span className="text-secondary text-sm flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(seal.date).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-muted font-mono text-xs break-all">
                                    <span className="text-secondary mr-2 uppercase tracking-tighter">Seal:</span>
                                    {seal.fiscalSealHash || 'PENDING_SEAL'}
                                </div>
                                <div className="text-secondary font-mono text-[10px] break-all">
                                    <span className="text-secondary mr-2 uppercase tracking-tighter">Type:</span>
                                    {seal.type || 'transaction'}
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <div className="px-3 py-1 bg-surface-sidebar text-muted rounded-lg text-xs font-bold border border-default">
                                    {seal.isValidated ? 'CERTIFIED' : 'PENDING'}
                                </div>
                                {seal.isSystemGenerated && (
                                    <span className="text-[10px] text-status-warning font-bold uppercase italic px-2 py-0.5 bg-status-warning/10 rounded border border-action-primary/20">
                                        Système
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Connecting Line Visual for Chain */}
                        {index < filteredSeals.length - 1 && (
                            <div className="absolute left-1/2 -bottom-2 w-px h-4 bg-surface-sidebar opacity-50" />
                        )}
                    </motion.div>
                ))}
                
                {filteredSeals.length === 0 && (
                    <div className="text-center py-20 bg-surface-sidebar/20 rounded-2xl border border-dashed border-default">
                        <Binary className="w-12 h-12 text-primary mx-auto mb-4" />
                        <p className="text-secondary">Aucun sceau fiscal trouvé. En attente de transactions...</p>
                    </div>
                )}
            </div>
        </div>
    );
};
