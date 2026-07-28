"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useUI } from "@/shared/hooks";
;

export function GlobalFAB() {
    const { openCommandPalette: _openCommandPalette, toggleLaunchpad: _toggleLaunchpad } = useUI();

    const triggerOracle = () => {
        window.dispatchEvent(new KeyboardEvent('keydown', { altKey: true, key: 'v' }));
    };

    return (
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-center gap-4 pointer-events-none p-4">
                {/* Oracle Intelligence - The primary floating bot */}
                <motion.div
                    initial={{ scale: 0, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="relative pointer-events-auto"
                >
                    {/* Shadow for the composite effect */}
                    <div className="absolute inset-x-2 -bottom-2 h-4 bg-surface-sidebar/40 blur-xl rounded-full" />
                    
                    {/* The "Black Base" the user mentioned */}
                    <button
                        onClick={triggerOracle}
                        className="w-16 h-16 rounded-[1.8rem] bg-surface-sidebar border border-white/5 shadow-2xl flex items-center justify-center group relative overflow-hidden active:scale-95 transition-all"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                        
                        {/* The Golden Bot on top */}
                        <div className="w-14 h-14 rounded-2xl bg-accent shadow-[0_0_20px_rgba(197,160,89,0.3)] flex items-center justify-center text-text-primary transform group-hover:scale-105 transition-all">
                            <Bot className="w-8 h-8" strokeWidth={1.5} />
                            
                            {/* Oracle Status Pulse */}
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-error rounded-full border-2 border-default flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-surface-card animate-pulse" />
                            </div>
                        </div>
                    </button>
                </motion.div>
            </div>
    );
}
