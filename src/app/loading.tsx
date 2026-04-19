"use client";

import { motion } from "framer-motion";
import { Layers } from "lucide-react";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-bg-primary">
            {/* Cinematic Blur Background */}
            <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-accent-gold/5 blur-[150px] pointer-events-none rounded-full" />
            <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-accent/5 blur-[120px] pointer-events-none rounded-full" />

            <div className="relative z-10 flex flex-col items-center gap-8">
                {/* Logo Animation */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="relative"
                >
                    <div className="w-24 h-24 rounded-3xl bg-text-primary dark:bg-bg-secondary flex items-center justify-center shadow-premium relative overflow-hidden ring-1 ring-white/10">
                        {/* Shimmer Effect */}
                        <motion.div
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                        />
                        <Layers strokeWidth={1} className="w-10 h-10 text-accent-gold" />
                    </div>

                    {/* Orbiting Ring */}
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="absolute -inset-4 border border-dashed border-accent-gold/20 rounded-full"
                    />
                </motion.div>

                {/* Text Animation */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                    className="text-center space-y-3"
                >
                    <h1 className="text-2xl font-serif font-black italic text-text-primary tracking-tighter loading-none">
                        RESTAURANT <span className="text-accent-gold not-italic">OS</span>
                    </h1>
                    <div className="flex items-center justify-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-gold animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-text-muted/60">
                            CHARGEMENT
                        </span>
                    </div>
                </motion.div>

                {/* Loading Bar */}
                <div className="w-48 h-0.5 bg-border/30 rounded-full overflow-hidden relative">
                    <motion.div
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="absolute inset-0 bg-accent-gold/50 w-1/2 blur-[2px]"
                    />
                </div>
            </div>
        </div>
    );
}
