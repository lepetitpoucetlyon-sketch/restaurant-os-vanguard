/* eslint-disable no-restricted-imports -- tolerated structural inversion */
"use client";

import React from 'react';
import { useNexusFleet } from '@/modules/intelligence/ia/fleet/NexusFleetProvider';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

/**
 * 🛰️ OTABanner - Grade VI (Quantum Orchestrator)
 * A non-intrusive notification informing the user of a Suzerain-wide update.
 */
export const OTABanner: React.FC = () => {
    const { isUpdateAvailable, updateInfo } = useNexusFleet();

    const handleUpdate = () => {
        // In a real scenario, this would trigger a service worker update or a safe reload.
        window.location.reload();
    };

    return (
        <AnimatePresence>
            {isUpdateAvailable && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[95%] max-w-2xl"
                >
                    <div className="bg-surface-card/10 backdrop-blur-xl border border-default rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
                                <RefreshCw className="w-5 h-5 text-primary animate-spin-slow" />
                            </div>
                            <div>
                                <h4 className="text-text-primary font-semibold text-sm">Mise à jour disponible (v{updateInfo?.version || '?.?.?'})</h4>
                                <p className="text-muted text-xs">Une mise à jour Over-the-Air a été déployée par le Suzerain.</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUpdate}
                                className="px-4 py-2 bg-primary text-secondary text-xs font-bold rounded-lg hover:bg-primary/90 transition-all uppercase tracking-wider"
                            >
                                Mettre à jour
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
