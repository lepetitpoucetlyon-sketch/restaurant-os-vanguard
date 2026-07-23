"use client";

import { motion } from "framer-motion";
import { 
    Cpu, Database, Layout, Sparkles, Zap, 
    Workflow, ShieldCheck, Box
} from "lucide-react";

export function MindMapDependencies() {
    const nodes = [
        { id: 'core', label: 'Next.js 16', sub: 'Le Moteur', icon: Zap, color: 'text-accent-gold', bg: 'bg-accent/10', x: 0, y: 0 },
        { id: 'data', label: 'Firestore', sub: 'La Mémoire', icon: Database, color: 'text-status-success', bg: 'bg-status-success/10', x: -180, y: -120 },
        { id: 'ai', label: 'Gemini 3.1', sub: "L'Oracle", icon: Cpu, color: 'text-brand', bg: 'bg-action-primary/10', x: 180, y: -120 },
        { id: 'ux', label: 'Motion 12', sub: 'Le Ressenti', icon: Sparkles, color: 'text-status-warning', bg: 'bg-status-warning/10', x: 220, y: 120 },
        { id: 'ui', label: 'Tailwind 4', sub: 'L\'Apparence', icon: Layout, color: 'text-brand', bg: 'bg-action-primary/10', x: -220, y: 120 },
        { id: 'sec', label: 'Auth RBAC', sub: 'Le Bouclier', icon: ShieldCheck, color: 'text-brand', bg: 'bg-action-primary/10', x: 0, y: -240 },
        { id: 'lib', label: 'Utilitaire Lib', sub: 'Les Outils', icon: Box, color: 'text-status-danger', bg: 'bg-status-danger/10', x: 0, y: 240 },
        { id: 'workflow', label: 'Agent Edge', sub: 'La Logique', icon: Workflow, color: 'text-brand', bg: 'bg-action-primary/10', x: 320, y: 0 }
    ];

    return (
        <div className="relative w-full aspect-video bg-bg-secondary/20 flex items-center justify-center overflow-hidden p-20 select-none">
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                <defs>
                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="50%" stopColor="currentColor" stopOpacity="1" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {nodes.filter(n => n.id !== 'core').map(node => (
                    <motion.line
                        key={node.id}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                        x1={`50%`}
                        y1={`50%`}
                        x2={`calc(50% + ${node.x}px)`}
                        y2={`calc(50% + ${node.y}px)`}
                        stroke="currentColor"
                        strokeWidth="1"
                        className="text-border"
                    />
                ))}
            </svg>

            {/* Nodes Layer */}
            <div className="relative w-full h-full flex items-center justify-center">
                {nodes.map((node, i) => (
                    <motion.div
                        key={node.id}
                        initial={{ opacity: 0, scale: 0.5, x: 0, y: 0 }}
                        animate={{ opacity: 1, scale: 1, x: node.x, y: node.y }}
                        transition={{ duration: 0.8, delay: i * 0.1, type: "spring", stiffness: 100 }}
                        whileHover={{ scale: 1.1, zIndex: 10, transition: { duration: 0.2 } }}
                        className="absolute p-6 rounded-[2.5rem] bg-bg-tertiary/80 border border-border/50 backdrop-blur-3xl shadow-premium hover:border-accent/50 transition-colors group cursor-help"
                    >
                        <div className="flex items-center gap-5 min-w-[160px]">
                            <div className={`w-14 h-14 rounded-2xl ${node.bg} border border-border flex items-center justify-center shadow-lg`}>
                                <node.icon className={`w-7 h-7 ${node.color} group-hover:scale-110 transition-transform`} />
                            </div>
                            <div className="text-left">
                                <h4 className="text-lg font-serif tracking-tight text-text-primary leading-none mb-1">{node.label}</h4>
                                <p className="text-[10px] uppercase font-bold tracking-widest text-text-muted">{node.sub}</p>
                            </div>
                        </div>

                        {/* Node Pulse Effect */}
                        <div className={`absolute inset-0 rounded-[2.5rem] ${node.bg} opacity-0 group-hover:opacity-10 scale-95 group-hover:scale-110 transition-all duration-500 blur-xl`} />
                    </motion.div>
                ))}
            </div>
            
            {/* Visual Guide Overlay */}
            <div className="absolute bottom-10 right-10 flex gap-10">
                <div className="flex flex-col items-end gap-2">
                    <span className="text-[9px] uppercase font-black text-accent-gold tracking-[0.2em] mb-1">État de l'Architecture</span>
                    <span className="text-xs font-mono text-status-success">&bull; 100% Cloud-Native</span>
                </div>
            </div>
        </div>
    );
}
