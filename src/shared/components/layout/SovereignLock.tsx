"use client";

import React from 'react';
import { useNexusCore } from '@/shared/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, CreditCard } from 'lucide-react';

/**
 * 🔒 SovereignLock - Grade VIII Economy
 * Activated automatically when the Master Control Center detects
 * a 'locked' licenceStatus (e.g. Stripe payment failed).
 */
export const SovereignLock: React.FC = () => {
    const { tenantConfig } = useNexusCore();

    const isLocked = tenantConfig?.status?.licenceStatus === 'LOCKED';

    return (
        <AnimatePresence>
            {isLocked && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[10000] bg-surface-sidebar/95 backdrop-blur-3xl flex items-center justify-center p-6"
                >
                    <div className="max-w-md w-full bg-surface-sidebar border border-red-500/20 rounded-3xl p-10 text-center shadow-[0_0_100px_rgba(239,68,68,0.1)] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-status-danger/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
                        
                        <div className="mx-auto w-24 h-24 bg-status-danger/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20">
                            <ShieldAlert className="w-10 h-10 text-status-danger" />
                        </div>
                        
                        <h2 className="text-3xl font-serif italic text-text-primary mb-4">Accès Suspendu</h2>
                        <p className="text-muted mb-10 leading-relaxed">
                            Votre abonnement pour l'instance <strong className="text-text-primary">{tenantConfig?.name || tenantConfig?.metadata?.name || 'Nexus Node'}</strong> est actuellement suspendu suite à un incident de facturation.
                        </p>
                        
                        <button 
                            className="w-full h-14 bg-status-danger hover:bg-status-danger text-text-primary rounded-2xl font-bold uppercase tracking-widest text-xs transition-colors flex items-center justify-center gap-3 shadow-[0_10px_30px_rgba(239,68,68,0.2)]"
                        >
                            <CreditCard className="w-4 h-4" />
                            Régulariser l'Abonnement
                        </button>

                        <div className="mt-8 text-[9px] font-mono text-secondary uppercase tracking-widest text-center">
                            Empire Engine • Code 402 Payment Required
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
