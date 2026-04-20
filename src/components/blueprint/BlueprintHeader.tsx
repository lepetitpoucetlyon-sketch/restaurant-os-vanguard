// @ts-nocheck
"use client";

import { motion } from "framer-motion";
import { fadeInUp } from "@/lib/motion";
import { Sparkles, Terminal, Activity } from "lucide-react";

export function BlueprintHeader() {
    return (
        <motion.div variants={fadeInUp} className="text-center space-y-10 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[300px] h-[300px] bg-accent/10 blur-[100px] rounded-full -z-10" />

            <div className="flex flex-col items-center gap-6">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="px-6 py-2 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-md flex items-center gap-3"
                >
                    <Sparkles className="w-4 h-4 text-accent-gold" />
                    <span className="text-[10px] uppercase font-black tracking-[0.3em] text-accent-gold">
                        Artéfact d'Ingénierie & bull; v12.0 &bull; Cloud-Native
                    </span>
                </motion.div>

                <h1 className="text-7xl md:text-9xl font-serif leading-[1.1] tracking-tighter text-text-primary">
                    RESTAURANT <br />
                    <span className="text-accent-gold italic drop-shadow-2xl">OS</span> L'ARCHITECTE
                </h1>

                <p className="max-w-2xl mx-auto text-xl text-text-muted font-medium leading-relaxed">
                    Une immersion architecturale dans l'ADN du projet. De l'infrastructure Cloud Firestore 
                    à l'intelligence multimodale Oracle, découvrez les flux et dépendances qui animent ce système.
                </p>
            </div>

            <div className="flex items-center justify-center gap-12 pt-10">
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
                        <Activity className="w-4 h-4" /> 100% EN LIGNE
                    </div>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Présence Cloud</span>
                </div>
                <div className="w-px h-12 bg-border/50" />
                <div className="flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-accent-gold font-mono text-sm">
                        <Terminal className="w-4 h-4" /> NEXT.JS 16
                    </div>
                    <span className="text-[10px] text-text-muted uppercase tracking-widest font-bold">Cœur Turbo</span>
                </div>
            </div>
        </motion.div>
    );
}
