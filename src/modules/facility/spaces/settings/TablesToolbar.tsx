"use client";

import { motion } from "framer-motion";
import { 
    Home, 
    ChevronDown, 
    MousePointer2, 
    Plus, 
    Sparkles, 
    Grid, 
    Check, 
    Loader2 
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { Floor } from "@nexus/contracts";


interface TablesToolbarProps {
    activeTab: 'zones' | 'tables' | 'floors';
    setActiveTab: (tab: 'zones' | 'tables' | 'floors') => void;
    isEditing: boolean;
    onAdd: () => void;
    onSave: () => void;
    isSaving: boolean;
    floors: Floor[];
    activeFloorId?: string;
    onSelectFloor?: (floorId: string) => void;
    totalTablesCount?: number;
    totalPaxCount?: number;
}

import { useState } from "react";

export function TablesToolbar({
    activeTab,
    setActiveTab,
    isEditing,
    onAdd,
    onSave,
    isSaving,
    floors,
    activeFloorId,
    onSelectFloor,
    totalTablesCount,
    totalPaxCount,
}: TablesToolbarProps) {
    const [isFloorMenuOpen, setIsFloorMenuOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [isSnapGridActive, setIsSnapGridActive] = useState(true);
    const [isOptimized, setIsOptimized] = useState(false);

    const selectedFloor = floors.find(f => f.id === activeFloorId) || floors[0];
    const floorLabel = selectedFloor?.name || "REZ-DE-CHAUSSÉE";
    const units = totalTablesCount !== undefined ? totalTablesCount : 8;
    const pax = totalPaxCount !== undefined ? totalPaxCount : 30;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-bg-secondary p-3 rounded-[2rem] shadow-premium border border-border flex flex-col xl:flex-row items-center gap-6 xl:gap-0 relative z-20"
        >
            {/* 1. Left: Zone / Floor Selector */}
            <div className="relative z-10 flex items-center gap-6 xl:pr-8 xl:border-r border-border w-full xl:w-auto justify-between xl:justify-start">
                <div className="relative">
                    <button 
                        onClick={() => setIsFloorMenuOpen(prev => !prev)}
                        className="flex items-center gap-4 bg-bg-primary hover:bg-bg-tertiary transition-colors rounded-[1.5rem] pl-2 pr-6 py-2 group border border-border"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-bg-tertiary flex items-center justify-center border border-border text-accent">
                            <Home className="w-6 h-6" />
                        </div>
                        <div className="text-left">
                            <div className="flex items-center gap-3">
                                <span className="text-text-primary font-bold text-xs tracking-[0.2em] group-hover:text-text-secondary transition-colors uppercase">
                                    {floorLabel}
                                </span>
                                <ChevronDown className={cn("w-3 h-3 text-text-muted transition-transform", isFloorMenuOpen && "rotate-180")} />
                            </div>
                            <p className="text-nano text-text-muted font-bold tracking-wider mt-0.5">
                                {units} {units > 1 ? 'UNITÉS' : 'UNITÉ'} • {pax} PAX
                            </p>
                        </div>
                    </button>

                    {isFloorMenuOpen && floors.length > 0 && (
                        <div className="absolute top-full left-0 mt-2 w-56 bg-bg-secondary border border-border rounded-2xl p-2 shadow-2xl z-50">
                            {floors.map(floor => (
                                <button
                                    key={floor.id}
                                    onClick={() => {
                                        if (onSelectFloor) onSelectFloor(floor.id);
                                        setIsFloorMenuOpen(false);
                                    }}
                                    className={cn(
                                        "w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                                        floor.id === selectedFloor?.id
                                            ? "bg-accent/20 text-accent font-black"
                                            : "text-text-secondary hover:bg-bg-tertiary hover:text-text-primary"
                                    )}
                                >
                                    {floor.name}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="xl:hidden flex flex-col items-end">
                    <h2 className="font-serif italic text-xl text-text-primary">Config.</h2>
                </div>
            </div>

            {/* 2. Center: Title Brand */}
            <div className="hidden xl:flex flex-col justify-center px-8 relative z-10">
                <h1 className="font-serif text-3xl italic leading-none text-text-primary whitespace-nowrap">
                    Configuration <span className="text-accent">de Salle</span>
                </h1>
                <p className="text-nano font-bold text-text-muted uppercase tracking-[0.3em] mt-1">
                    ÉDITEUR D'AGENCEMENT INTELLIGENT
                </p>
            </div>

            {/* 3. Right: Tools & Actions */}
            <div className="flex-1 w-full flex flex-col md:flex-row items-center justify-end gap-4 xl:gap-6 xl:pl-8 xl:border-l border-border relative z-10">
                <div className="flex items-center p-1 bg-bg-primary rounded-full border border-border w-full md:w-auto">
                    <button
                        onClick={() => setActiveTab('zones')}
                        className={cn(
                            "flex-1 md:flex-none flex items-center gap-2 px-6 py-2.5 rounded-full text-nano font-bold tracking-widest transition-all",
                            activeTab === 'zones' || activeTab === 'tables'
                                ? "bg-text-primary text-bg-primary shadow-lg"
                                : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <MousePointer2 className="w-3 h-3" />
                        SÉLECTION
                    </button>
                    <button
                        onClick={onAdd}
                        className={cn(
                            "flex-1 md:flex-none flex items-center gap-2 px-6 py-2.5 rounded-full text-nano font-bold tracking-widest transition-all",
                            isEditing
                                ? "bg-text-primary text-bg-primary shadow-lg"
                                : "text-text-muted hover:text-text-primary"
                        )}
                    >
                        <Plus className="w-3 h-3" />
                        AJOUTER
                    </button>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto justify-center">
                    <button 
                        onClick={() => setIsOptimized(prev => !prev)}
                        className={cn(
                            "px-5 py-3 border border-border rounded-full flex items-center gap-2 transition-all",
                            isOptimized
                                ? "bg-accent/20 border-accent/40 text-accent"
                                : "bg-bg-primary hover:bg-bg-tertiary text-text-primary"
                        )}
                    >
                        <Sparkles className="w-3 h-3 text-accent" />
                        <span className="text-nano font-bold tracking-widest uppercase">
                            {isOptimized ? "VUE DENSE" : "VUE OPTIMISÉE"}
                        </span>
                    </button>

                    <div className="flex items-center p-1 bg-bg-primary rounded-full border border-border relative">
                        <button 
                            onClick={() => setViewMode('2d')}
                            className={cn(
                                "px-4 py-2 rounded-full text-nano font-bold z-10 transition-all",
                                viewMode === '2d' ? "bg-text-primary text-bg-primary" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            2D
                        </button>
                        <button 
                            onClick={() => setViewMode('3d')}
                            className={cn(
                                "px-4 py-2 rounded-full text-nano font-bold z-10 transition-all",
                                viewMode === '3d' ? "bg-text-primary text-bg-primary" : "text-text-muted hover:text-text-primary"
                            )}
                        >
                            3D
                        </button>
                    </div>
                </div>

                <div className="hidden 2xl:block w-px h-8 bg-border" />

                <div className="flex items-center gap-3 hidden md:flex">
                    <div className="px-4 py-2 bg-status-success/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                        <span className="text-nano font-bold text-status-success tracking-wider uppercase">SYNC ACTIVE</span>
                    </div>

                    <button 
                        onClick={() => setIsSnapGridActive(prev => !prev)}
                        title={isSnapGridActive ? "Grille magnétique activée" : "Grille magnétique désactivée"}
                        aria-label="Bascule grille magnétique"
                        className={cn(
                            "w-10 h-10 rounded-full border border-border flex items-center justify-center transition-all",
                            isSnapGridActive 
                                ? "bg-accent/20 text-accent border-accent/40" 
                                : "bg-bg-primary text-text-muted hover:text-text-primary hover:bg-bg-tertiary"
                        )}
                    >
                        <Grid className="w-4 h-4" />
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-text-primary hover:bg-text-secondary text-bg-primary rounded-full text-nano font-bold tracking-widest transition-all shadow-lg flex items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        HOMOLOGUER
                    </button>
                </div>
            </div>
        </motion.div>
    );
}
