// @ts-nocheck
"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, Layers, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/ui.foundations';
import { PowensService } from '@/domain/accounting/PowensService';
import { useAccounting } from '@/context/AccountingContext';
import { logger } from '@/lib/logger';

interface AggregationWidgetProps {
    onSyncComplete: (transactions: any[]) => void;
}

/**
 * AggregationWidget - The "Nexus" Bank Connection UI
 * Handles the Webview flow and the "Live" synchronization state.
 */
export function AggregationWidget({ onSyncComplete }: AggregationWidgetProps) {
    const { linkBankConnection } = useAccounting();
    const [status, setStatus] = useState<'idle' | 'connecting' | 'syncing' | 'connected' | 'error'>('idle');
    const [lastSync, setLastSync] = useState<string | null>(null);
    const [connectedBanks, setConnectedBanks] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleConnect = async () => {
        try {
            setErrorMessage(null);
            setStatus('connecting');
            const token = await PowensService.createConnectionToken();
            
            // Industrial Reality: Instant transition (or real Webview handoff)
            setStatus('syncing');
            const accounts = await PowensService.getAccounts(token);
            if (!accounts || accounts.length === 0) throw new Error('Aucun compte trouvé');
            
            const accountToLink = accounts[connectedBanks.length % accounts.length];
            const newBank = accountToLink.bankName;
            
            // PERSISTENCE: Save to AccountingContext
            await linkBankConnection(accountToLink);
            
            onSyncComplete(accounts);
            setConnectedBanks(prev => Array.from(new Set([...prev, newBank])));
            setStatus('connected');
            setLastSync(new Date().toLocaleTimeString());
        } catch (error) {
            logger.error('AggregationWidget: Connection failed', { error });
            setStatus('error');
            setErrorMessage('Impossible de joindre le service Nexus.');
        }
    };

    return (
        <div className="bg-bg-tertiary/20 rounded-[2.5rem] border border-border p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center gap-6">
                    <div className={cn(
                        "w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-700",
                        connectedBanks.length > 0 ? "bg-emerald-500/10 text-emerald-500 shadow-xl shadow-emerald-500/20" : "bg-bg-secondary text-text-muted"
                    )}>
                        <Layers className={cn("w-8 h-8", status === 'syncing' && "animate-pulse text-accent")} />
                    </div>
                    
                    <div>
                        <h3 className="text-xl font-serif font-black italic text-text-primary">Nexus <span className="text-accent not-italic">Aggregator</span></h3>
                        <div className="flex flex-wrap gap-2 mt-1">
                            {connectedBanks.length > 0 ? (
                                connectedBanks.map(bank => (
                                    <span key={bank} className="px-2 py-0.5 bg-bg-secondary border border-border rounded-md text-[8px] font-black text-emerald-500 uppercase tracking-widest">{bank}</span>
                                ))
                            ) : (
                                <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.25em]">AUCUNE BANQUE CONNECTÉE</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <AnimatePresence mode="wait">
                        {status === 'connecting' || status === 'syncing' ? (
                            <div className="flex items-center gap-4 text-accent">
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{status === 'connecting' ? 'Initialisation...' : 'Synchronisation...'}</span>
                            </div>
                        ) : status === 'error' ? (
                            <div className="flex flex-col items-end gap-2">
                                <div className="text-[9px] font-black text-red-500 uppercase tracking-widest">{errorMessage || 'Erreur de liaison'}</div>
                                <Button 
                                    onClick={handleConnect}
                                    variant="outline"
                                    className="h-10 px-6 border-red-500/20 text-red-500 hover:bg-red-500/10 text-[9px] font-black uppercase tracking-widest rounded-full"
                                >
                                    Réessayer
                                </Button>
                            </div>
                        ) : (
                            <Button 
                                onClick={handleConnect}
                                className={cn(
                                    "h-14 px-10 font-bold uppercase text-[11px] tracking-widest rounded-full shadow-lg transition-all flex items-center gap-3 group",
                                    connectedBanks.length > 0 ? "bg-bg-secondary text-text-primary border border-border hover:border-accent" : "bg-accent text-white shadow-amber-500/10"
                                )}
                            >
                                {connectedBanks.length > 0 ? "Connecter une autre banque" : "Connecter ma banque"}
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </Button>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            
            {/* Success Micro-toast */}
            <AnimatePresence>
                {status === 'connected' && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-[9px] font-black text-emerald-500 uppercase tracking-widest"
                    >
                        <CheckCircle2 className="w-3 h-3" />
                        Liaison DSP2 Certifiée
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
