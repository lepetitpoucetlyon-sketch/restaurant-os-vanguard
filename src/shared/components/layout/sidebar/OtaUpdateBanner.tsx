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
                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-action-primary/20 text-action-primary border border-action-primary/30 hover:bg-action-primary/30 transition-all animate-pulse"
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
                className="mx-3 mb-2 p-3 rounded-xl bg-action-primary/10 border border-action-primary/20"
            >
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <ArrowUpCircle className="w-4 h-4 text-action-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-chip-label text-action-primary">Mise à jour</p>
                            <p className="text-nano text-amber-300/70 font-mono">
                                v{currentVersion} → v{targetVersion}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setDismissed(true)}
                        className="text-action-primary/50 hover:text-action-primary transition-colors mt-0.5"
                    >
                        <X className="w-3 h-3" />
                    </button>
                </div>
                <button
                    onClick={handleUpdate}
                    disabled={updating}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-action-primary/20 text-amber-300 text-chip-label-sm hover:bg-action-primary/30 transition-all disabled:opacity-50"
                >
                    <Download className="w-3 h-3" />
                    {updating ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
            </motion.div>
        </AnimatePresence>
    );
}
