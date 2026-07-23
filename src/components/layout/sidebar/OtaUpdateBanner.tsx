"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, ArrowUpCircle } from 'lucide-react';
import { whiteLabelInstanceConfig } from '@/config/instance';

interface OtaUpdateBannerProps {
    targetVersion: string;
    otaUrl?: string;
    isSidebarCollapsed: boolean;
}

export function OtaUpdateBanner({ targetVersion, otaUrl, isSidebarCollapsed }: OtaUpdateBannerProps) {
    const [dismissed, setDismissed] = useState(false);
    const [updating, setUpdating] = useState(false);

    const currentVersion = whiteLabelInstanceConfig.version;

    const handleUpdate = async () => {
        setUpdating(true);
        if (otaUrl) {
            window.location.href = otaUrl;
        } else {
            window.location.reload();
        }
    };

    if (dismissed) return null;

    if (isSidebarCollapsed) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mb-2"
            >
                <button
                    onClick={handleUpdate}
                    title={`Mise à jour disponible : v${targetVersion}`}
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-all animate-pulse"
                >
                    <ArrowUpCircle className="w-4 h-4" />
                </button>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className="mx-3 mb-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">Mise à jour</p>
                            <p className="text-[9px] text-amber-300/70 font-mono">
                                v{currentVersion} → v{targetVersion}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-amber-500/50 hover:text-amber-400 transition-colors mt-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-[9px] font-black uppercase tracking-widest hover:bg-amber-500/30 transition-all disabled:opacity-50"
                >
                    <Download className="w-3 h-3" />
                    {updating ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
