"use client";

import { Share2, Activity } from 'lucide-react';

export function MindMapHeader() {
    return (
        <div className="absolute top-8 left-8 z-20 space-y-4">
            <div className="bg-bg-primary/80 dark:bg-bg-secondary/80 text-text-primary p-6 rounded-[2rem] shadow-2xl border border-border/50 backdrop-blur-md">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
                        <Share2 className="w-4 h-4 text-text-primary" />
                    </div>
                    <h1 className="text-xl font-black tracking-tighter uppercase">Cartographie Système</h1>
                </div>
                <p className="text-[10px] font-bold text-accent uppercase tracking-widest px-1">Visualisation du Flux de Données</p>
            </div>

            <div className="flex gap-2">
                <div className="bg-bg-primary/90 dark:bg-bg-tertiary/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 flex items-center gap-2 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Sync Active</span>
                </div>
                <div className="bg-bg-primary/90 dark:bg-bg-tertiary/90 backdrop-blur-md px-4 py-2 rounded-xl border border-border/50 flex items-center gap-2 shadow-sm">
                    <Activity className="w-3 h-3 text-accent" />
                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">RT Optimization</span>
                </div>
            </div>
        </div>
    );
}
