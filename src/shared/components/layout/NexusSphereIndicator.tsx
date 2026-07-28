"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface NexusSphereIndicatorProps {
    isActive: boolean;
    isProcessing: boolean;
    className?: string;
}

export const NexusSphereIndicator: React.FC<NexusSphereIndicatorProps> = ({ isActive, isProcessing, className }) => {
    return (
        <div className={cn("relative w-12 h-12 flex items-center justify-center", className)}>
            <motion.div
                animate={{
                    scale: isActive ? [1, 1.2, 1] : 1,
                    opacity: isActive ? [0.3, 0.6, 0.3] : 0.1,
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-accent rounded-full blur-xl"
            />
            <motion.div
                animate={isActive ? {
                    rotate: 360,
                    scale: isProcessing ? [1, 1.1, 1] : 1,
                } : { rotate: 0 }}
                transition={{
                    rotate: { duration: 10, repeat: Infinity, ease: "linear" },
                    scale: { duration: 0.5, repeat: Infinity, ease: "linear" },
                }}
                className={cn(
                    "relative w-8 h-8 rounded-full overflow-hidden border border-default shadow-lg",
                    "bg-gradient-to-br from-action-primary via-action-primary to-status-danger"
                )}
            >
                <motion.div
                    animate={{ x: ['-100%', '100%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
                {isActive && (
                    <motion.div
                        animate={{
                            borderRadius: ["30% 70% 70% 30% / 30% 30% 70% 70%", "50% 50% 20% 80% / 25% 80% 20% 75%", "30% 70% 70% 30% / 30% 30% 70% 70%"],
                            rotate: [0, 90, 180],
                        }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-1 bg-surface-card/20 backdrop-blur-sm"
                    />
                )}
            </motion.div>
            {isActive && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.2 }}
                    className="absolute inset-0 border border-accent/30 rounded-full animate-ping"
                />
            )}
        </div>
    );
};
