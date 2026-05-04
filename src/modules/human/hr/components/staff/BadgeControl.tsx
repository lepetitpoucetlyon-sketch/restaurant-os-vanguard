"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks';
import { useAtomValue } from 'jotai';
import { activeShiftsAtom } from '../../store/staffAtoms';
import { hrLoadingAtom } from '../../store/hrAtoms';
import { NexusPayrollEngine } from '@domain/services/NexusPayrollEngine';
import { ShiftEntry } from '@domain/schemas/hr';
import { Button } from '@ui/button';
import { Clock, Shield, AlertTriangle, Fingerprint, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/ui.foundations';
import { useToast } from '@ui/Toast';

/**
 * 🛰️ BadgeControl - Restaurant OS
 * The industrial gateway for employee state management.
 */
export const BadgeControl: React.FC = () => {
    const { currentUser: user } = useAuth();
    const activeShifts = useAtomValue(activeShiftsAtom);
    const isLoading = useAtomValue(hrLoadingAtom);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showToast } = useToast();

    // Find if current user is clocked in
    const currentShift = activeShifts.find(s => s.userId === user?.id);
    const isClockedIn = !!currentShift;

    const handleBadge = async () => {
        if (!user) return;
        setIsProcessing(true);
        try {
            if (isClockedIn) {
                await NexusPayrollEngine.clockOut({ id: user.id, name: user.displayName || user.email || 'Inconnu' });
                showToast("Fin de service validée et scellée", "success");
            } else {
                await NexusPayrollEngine.clockIn({ id: user.id, name: user.displayName || user.email || 'Inconnu' });
                showToast("Prise de service validée et scellée", "success");
            }
        } catch (error) {
            showToast("Erreur de transaction RH", "error");
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    if (!user) return null;

    return (
        <div className="bg-white dark:bg-bg-secondary rounded-2xl border border-border p-6 shadow-xl relative overflow-hidden group">
            {/* Background Aesthetic */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-accent/10 transition-colors" />
            
            <div className="relative flex items-center justify-between gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                        <Fingerprint className="w-5 h-5 text-accent" strokeWidth={2.5} />
                        <h3 className="text-sm font-black uppercase tracking-widest text-text-primary">Contrôle de Présence</h3>
                    </div>
                    <p className="text-xs text-text-muted mb-4 font-medium flex items-center gap-2">
                        Nexus-Titan RH Protocol 1.4 
                        <span className="w-1 h-1 rounded-full bg-border" />
                        Terminal: POS-MAIN-01
                    </p>

                    <div className="flex items-center gap-4">
                        <div className={cn(
                            "w-3 h-3 rounded-full animate-pulse shadow-sm",
                            isClockedIn ? "bg-success" : "bg-warning"
                        )} />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-tighter text-text-muted leading-tight">État de Service</p>
                            <p className="text-sm font-serif font-black text-text-primary">
                                {isClockedIn ? "EN POSTE" : "HORS SERVICE"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <Button
                        onClick={handleBadge}
                        disabled={isProcessing || isLoading}
                        className={cn(
                            "h-14 px-8 rounded-xl font-bold uppercase tracking-widest text-[11px] transition-all duration-500 shadow-lg relative overflow-hidden",
                            isClockedIn 
                                ? "bg-red-500 hover:bg-black text-white shadow-red-500/20" 
                                : "bg-accent hover:bg-black text-white shadow-accent/20"
                        )}
                    >
                        <AnimatePresence mode="wait">
                            {isProcessing ? (
                                <motion.div
                                    key="loader"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2"
                                >
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    SCELLAGE...
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="label"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    className="flex items-center gap-2"
                                >
                                    <Clock className="w-4 h-4" />
                                    {isClockedIn ? "TERMINER" : "BADGER"}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                    
                    <div className="flex items-center justify-center gap-2 py-1 px-3 bg-bg-tertiary rounded-lg border border-border/50">
                        <Shield className="w-3 h-3 text-success" />
                        <span className="text-[9px] font-bold text-text-muted uppercase tracking-widest">Transaction Sécurisée</span>
                    </div>
                </div>
            </div>

            {isClockedIn && currentShift && (
                <div className="mt-6 pt-6 border-t border-border/50 grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-text-muted">Début de Session</p>
                        <p className="text-xs font-mono font-bold text-text-primary">
                            {(() => {
                                    const ts = currentShift.timestamp;
                                    if (typeof ts === 'string') return new Date(ts).toLocaleTimeString('fr-FR');
                                    if ((ts as any) instanceof Date) return (ts as any).toLocaleTimeString('fr-FR');
                                    
                                    // Handle Firestore Timestamp lookalike with strict casting
                                    const fireTs = ts as { toDate?: () => Date };
                                    if (fireTs && typeof fireTs.toDate === 'function') {
                                        return fireTs.toDate().toLocaleTimeString('fr-FR');
                                    }

                                    return 'N/A';
                            })()}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-[9px] font-black uppercase tracking-tighter text-text-muted">ID Séquence Scellé</p>
                        <p className="text-[10px] font-mono font-bold text-accent truncate max-w-[120px] ml-auto">
                            {currentShift.fiscalSeal?.hash || "PENDING_SYNC"}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};
