'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';
import { NexusSphereIndicator } from "@components/layout/NexusSphereIndicator";

export function NexusHeroHeader() {
    return (
        <div className="relative rounded-[2.5rem] bg-gradient-to-br from-bg-secondary to-bg-tertiary border border-border p-10 overflow-hidden group shadow-premium">
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-accent/10 transition-all duration-1000" />
            
            <div className="flex flex-col md:flex-row items-center gap-10">
                <div className="relative">
                    <div className="w-40 h-40 rounded-full bg-bg-primary/50 backdrop-blur-md border border-border flex items-center justify-center shadow-2xl relative z-10">
                        <NexusSphereIndicator isActive={false} isProcessing={false} />
                    </div>
                    <motion.div 
                        animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                        transition={{ duration: 4, repeat: Infinity }}
                        className="absolute inset-0 bg-accent/20 blur-[40px] rounded-full"
                    />
                </div>

                <div className="flex-1 space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-2">
                        <Zap className="w-3.5 h-3.5 text-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-accent">Souveraineté Digitale</span>
                    </div>
                    <h2 className="text-4xl font-serif text-text-primary tracking-tight">
                        Personalisez votre <span className="text-accent italic">Nexus</span>
                    </h2>
                    <p className="text-text-muted max-w-xl text-lg font-medium leading-relaxed">
                        Configurez l'intelligence centrale de votre établissement. 
                        Modifiez son identité, sa voix et créez des raccourcis opérationnels sur-mesure pour votre équipe.
                    </p>
                </div>
            </div>
        </div>
    );
}
