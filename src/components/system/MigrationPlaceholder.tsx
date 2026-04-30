"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Construction, ArrowLeft, Cpu } from 'lucide-react';
import { Button } from '@ui/button';
import { useRouter } from 'next/navigation';

interface MigrationPlaceholderProps {
    moduleName: string;
}

export default function MigrationPlaceholder({ moduleName }: MigrationPlaceholderProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-bg-primary/50 backdrop-blur-xl rounded-[3rem] border border-border/50 shadow-premium m-8">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 bg-accent-gold/10 rounded-full flex items-center justify-center mb-8"
            >
                <Construction className="w-12 h-12 text-accent-gold" />
            </motion.div>

            <h1 className="text-4xl font-serif font-black italic text-text-primary mb-4 uppercase tracking-tight">
                {moduleName} <span className="text-accent-gold">en migration</span>
            </h1>

            <p className="text-text-muted max-w-md mb-12 font-medium leading-relaxed">
                Ce module souverain est en cours de recalibrage pour le Grade X. 
                La structure moléculaire du Nexus est stable, mais l'interface subit une suture de précision.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Button 
                    onClick={() => router.back()}
                    className="h-14 px-8 rounded-full bg-bg-tertiary text-text-primary border-border hover:bg-bg-secondary"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Retour
                </Button>
                
                <div className="flex items-center gap-3 px-6 py-3 bg-black/5 rounded-full border border-black/10">
                    <Cpu className="w-4 h-4 text-accent-gold animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                        Nexus Core: 100% Stable
                    </span>
                </div>
            </div>
        </div>
    );
}
