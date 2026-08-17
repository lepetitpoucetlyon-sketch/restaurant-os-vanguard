"use client";

import { Maximize2, Search, Layers } from 'lucide-react';

interface MindMapControlsProps {
    searchTerm: string;
    setSearchTerm: (s: string) => void;
}

export function MindMapControls({ searchTerm, setSearchTerm }: MindMapControlsProps) {
    return (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-bg-primary/80 dark:bg-bg-secondary/80 backdrop-blur-md p-2 rounded-[2rem] border border-border shadow-xl z-20">
            <button className="w-12 h-12 rounded-2xl flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-bg-tertiary transition-all">
                <Maximize2 className="w-5 h-5" />
            </button>
            <div className="w-px h-6 bg-border" />
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted/30" />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Rechercher un module..."
                    className="h-12 pl-12 pr-6 rounded-2xl bg-bg-tertiary border-none text-sm placeholder:text-text-muted/40 focus:ring-0 w-64"
                />
            </div>
            <div className="w-px h-6 bg-border" />
            <button className="bg-text-primary text-text-primary px-6 py-3 rounded-2xl font-black text-[12px] uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-accent" />
                Vue 3D
            </button>
        </div>
    );
}
