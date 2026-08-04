import React from 'react';
import { motion } from 'framer-motion';
import { Book, Home, Layers } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

const SketchLine = ({ className }: { className?: string }) => (
    <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className={cn("h-[1px] bg-surface-tertiary origin-left", className)}
    />
);

interface DashboardHeaderProps {
    view: 'grid' | 'map';
    setView: (view: 'grid' | 'map') => void;
}

export function DashboardHeader({ view, setView }: DashboardHeaderProps) {
    return (
        <header className="max-w-7xl mx-auto mb-16 relative">
            <div className="flex justify-between items-end">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-4 mb-2"
                    >
                        <div className="w-12 h-12 rounded-full border-2 border-default flex items-center justify-center">
                            <Book className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-5xl font-black text-primary tracking-tighter italic">Empire <span className="text-secondary font-normal not-italic">Forge</span></h1>
                    </motion.div>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="text-secondary text-sm tracking-[0.2em] uppercase font-sans font-bold ml-16"
                    >
                        Sovereign Operations Management System v2.0
                    </motion.p>
                </div>

                <nav className="flex items-center gap-8 font-sans font-bold text-[11px] uppercase tracking-widest text-muted">
                    <button
                        onClick={() => setView('grid')}
                        className={cn("hover:text-primary transition-colors flex items-center gap-2", view === 'grid' && "text-primary")}
                    >
                        <Home className="w-4 h-4" /> Journal des Espaces
                    </button>
                    <button
                        onClick={() => setView('map')}
                        className={cn("hover:text-primary transition-colors flex items-center gap-2", view === 'map' && "text-primary")}
                    >
                        <Layers className="w-4 h-4" /> Carte Mentale
                    </button>
                    <div className="h-4 w-[1px] bg-surface-bg" />
                </nav>
            </div>
            <SketchLine className="mt-8" />
        </header>
    );
}
