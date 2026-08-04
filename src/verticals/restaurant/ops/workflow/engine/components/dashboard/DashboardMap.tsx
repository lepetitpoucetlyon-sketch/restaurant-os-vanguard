import React from 'react';
import { motion } from 'framer-motion';
import { Home, Key, Layers, Coffee, PenTool, ArrowRight } from 'lucide-react';
import { cn } from "@/lib/ui.foundations";

const MindMapNode = ({ x, y, label, icon: Icon, color, description }: { x: number, y: number, label: string, icon: React.ElementType, color: string, description?: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: x, top: y }}
        className="absolute flex flex-col items-center group cursor-pointer"
    >
        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-text-primary shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl relative z-10", color)}>
            <Icon className="w-8 h-8" />
        </div>
        <div className="mt-4 bg-surface-card px-4 py-2 rounded-2xl border border-subtle shadow-xl transition-all group-hover:bg-surface-sidebar group-hover:text-text-primary relative z-10 w-48 text-center">
            <span className="text-[10px] font-black uppercase tracking-widest block mb-1">{label}</span>
            {description && <p className="text-[9px] opacity-60 font-sans leading-tight hidden group-hover:block">{description}</p>}
        </div>

        <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className={cn("absolute inset-0 -m-8 rounded-full border-2 border-dotted", color.replace('bg-', 'border-'))}
        />
    </motion.div>
);

const HandDrawnLegend = ({ label, color }: { label: string, color: string }) => (
    <div className="flex items-center gap-2 bg-surface-card/80 backdrop-blur-sm px-4 py-2 rounded-full border border-subtle shadow-sm">
        <div className={cn("w-2 h-2 rounded-full", color.replace('text-', 'bg-'))} />
        <span className={cn("text-[10px] font-black uppercase tracking-widest", color)}>{label}</span>
    </div>
);

export function DashboardMap() {
    return (
        <div className="relative w-full h-[600px] bg-surface-card rounded-[3rem] border border-subtle shadow-inner p-10 overflow-hidden">
            {/* Hand-Drawn Mind Map Visual */}
            <div className="absolute inset-0 p-10">
                <svg className="w-full h-full">
                    {/* Example hand-drawn connections */}
                    <motion.path
                        d="M 100 100 Q 200 80 300 150 T 500 100"
                        stroke="#D1D5DB" strokeWidth="2" fill="none" strokeDasharray="5,5"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }}
                    />
                    <motion.path
                        d="M 100 100 Q 50 200 150 300"
                        stroke="#D1D5DB" strokeWidth="2" fill="none" strokeDasharray="5,5"
                        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, delay: 0.5 }}
                    />
                </svg>
            </div>

            {/* Mind Map Nodes */}
            <MindMapNode x={100} y={150} label="Établissement" icon={Home} color="bg-surface-sidebar" description="Le cœur de l'établissement (Main Hall & Salons)" />
            <MindMapNode x={350} y={100} label="Espaces" icon={Key} color="bg-action-primary" description="50 tables, 5 salons de luxe" />
            <MindMapNode x={550} y={200} label="Logistique" icon={Layers} color="bg-status-warning" description="Office et maintenance technique" />
            <MindMapNode x={180} y={350} label="Salle" icon={Layers} color="bg-status-success" description="Entretien et protocole HACCP de la salle" />
            <MindMapNode x={480} y={380} label="Accueil" icon={Coffee} color="bg-action-primary" description="Services clients et réservations" />

            <div className="absolute top-10 right-10 flex gap-4">
                <HandDrawnLegend label="Flux Opérationnels" color="text-brand" />
                <HandDrawnLegend label="Zones Statiques" color="text-status-warning" />
            </div>

            <div className="absolute bottom-10 left-10 max-w-sm bg-[#FDFCF0]/90 backdrop-blur-md p-8 rounded-[2rem] border-2 border-dashed border-subtle shadow-xl">
                <div className="flex items-center gap-2 mb-4 text-muted font-bold text-[10px] uppercase tracking-widest">
                    <PenTool className="w-4 h-4 text-brand" /> Note de Conception
                </div>
                <div className="space-y-4">
                    <h4 className="text-xl font-black italic">Architecture Système</h4>
                    <p className="text-xs text-secondary leading-relaxed">
                        L'écosystème de Service est structuré en 5 piliers interconnectés. Chaque unité opérationnelle (Node) transmet des données en temps réel vers la <strong>Propriété Centrale</strong>.
                    </p>
                    <div className="flex items-center gap-4 pt-4">
                        <div className="flex -space-x-2">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-surface-bg flex items-center justify-center text-[10px] font-bold">U{i}</div>
                            ))}
                        </div>
                        <ArrowRight className="w-4 h-4 text-muted" />
                        <div className="text-[10px] font-black uppercase tracking-widest bg-surface-sidebar text-text-primary px-3 py-1 rounded-full">Dashboard Global</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
