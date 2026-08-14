"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Book,
    Home,
    User,
    Plus,
    ArrowRight,
    Layers,
    Coffee,
    Cloud,
    PenTool,
    TrendingUp,
    Key
} from 'lucide-react';
import { useFloorOps as useOMS } from '../../../providers/NexusOpsProvider';
import { cn } from "@/lib/ui.foundations";
import { useTenant } from '@/kernel/hooks';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

import {
    SketchLine,
    HandDrawnBorder,
    MindMapNode,
    HandDrawnLegend,
    ExplanatoryCard,
} from './operationsDashboardComponents';
import {
    type OperationalArea,
    OperationsAreaModal,
} from './OperationsAreaModal';
export function OperationsDashboard() {
    const floorOps = useOMS();
    const areas = floorOps?.areas ?? [];
    const updateAreaStatus = (id: string, status: string) => {
        if (floorOps?.updateAreaStatus) {
            floorOps.updateAreaStatus(id, { status } as never);
        } else {
            logger.debug('Update area', id, status);
        }
    };
    const [view, setView] = useState<'grid' | 'map'>('grid');
    const [selectedArea, setSelectedArea] = useState<OperationalArea | null>(null);
    const { activeTenantId } = useTenant();

    const handleArrival = async (area: OperationalArea) => {
        if (!activeTenantId) return;
        const promise = (async () => {
            updateAreaStatus(area.id, 'occupied');
            setSelectedArea(null);
        })();
        toast.promise(promise, {
            loading: 'Établissement du lien financier...',
            success: 'Arrivée validée & Provision comptable générée.',
            error: 'Échec de la suture financière.',
        });
        try {
            await promise;
        } catch (e) {
            logger.error('[Operations] handleArrival failed', e);
        }
    };

    const handleMaintenance = (area: OperationalArea) => {
        updateAreaStatus(area.id, 'maintenance');
        setSelectedArea(null);
    };

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary font-serif relative overflow-hidden">
            <div className="flex-1 h-full overflow-auto p-4 md:p-10 pb-24 md:pb-10 elegant-scrollbar">
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]" />

                {/* Header Area */}
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

                <main className="max-w-7xl mx-auto grid grid-cols-12 gap-10">
                    {/* Left Sidebar - Quick Sketch / Info */}
                    <div className="col-span-3 space-y-10">
                        <HandDrawnBorder className="bg-surface-card/80">
                            <div className="flex items-center gap-3 mb-6">
                                <PenTool className="w-5 h-5 text-brand" />
                                <h3 className="text-lg font-bold">Notes du Jour</h3>
                            </div>
                            <div className="space-y-4 text-sm text-secondary leading-relaxed italic">
                                <p>• Vérifier le stock de nappage pour le Carré 2.</p>
                                <p>• Le Salon 301 nécessite une Mise en Place VIP.</p>
                                <p>• Prise de poste Brigade à 14h.</p>
                            </div>
                            <div className="mt-8 pt-6 border-t border-dashed border-subtle">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-muted">
                                    <span>Occupation Totale</span>
                                    <span>84%</span>
                                </div>
                                <div className="h-1 bg-surface-bg rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '84%' }}
                                        className="h-full bg-action-primary"
                                    />
                                </div>
                            </div>
                        </HandDrawnBorder>

                        <div className="p-6 relative overflow-hidden group">
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -right-4 -top-4 opacity-10"
                            >
                                <Cloud className="w-32 h-32" />
                            </motion.div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-4">Météo Locale</h4>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-black">18°C</div>
                                <div className="text-sm text-secondary italic">Ensoleillé avec quelques nuages</div>
                            </div>
                        </div>
                    </div>

                    {/* Center Content - Grid or Map */}
                    <div className="col-span-9">
                        {view === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {(areas as unknown as OperationalArea[])?.map((area: OperationalArea, idx: number) => (
                                    <motion.div
                                        key={area.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ y: -5 }}
                                        onClick={() => setSelectedArea(area)}
                                        className={cn(
                                            "relative p-8 rounded-[2.5rem] bg-surface-card border border-subtle shadow-sm cursor-pointer group transition-all overflow-hidden",
                                            selectedArea?.id === area.id && "ring-2 ring-default border-transparent shadow-2xl"
                                        )}
                                    >
                                        {/* Small Sketch Decoration */}
                                        <div className="absolute top-4 right-4 text-muted group-hover:text-muted transition-colors">
                                            {area.type === 'suite' ? <Key className="w-12 h-12 rotate-45" /> : <Home className="w-12 h-12" />}
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-surface-bg border border-subtle italic">No. {area.number}</span>
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    area.status === 'vacant' ? "bg-status-success" :
                                                        area.status === 'busy' ? "bg-action-primary" :
                                                            area.status === 'maintenance' ? "bg-status-danger" : "bg-status-warning"
                                                )} />
                                            </div>
                                            <h3 className="text-2xl font-black text-primary mb-1 capitalize group-hover:italic transition-all">{area.type}</h3>
                                            <p className="text-xs text-muted font-sans font-bold uppercase tracking-wider mb-6">{area?.status}</p>

                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] text-muted font-sans font-bold uppercase tracking-widest mb-1 italic">Tarif / Service</p>
                                                    <p className="text-xl font-sans font-black">€{area.price}</p>
                                                </div>
                                                <button className="w-10 h-10 rounded-2xl bg-surface-sidebar text-text-primary flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-lg">
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hand-drawn style decorative element */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-1 bg-surface-sidebar"
                                            initial={{ width: 0 }}
                                            whileHover={{ width: '100%' }}
                                        />
                                    </motion.div>
                                ))}

                                <button
                                    onClick={() => toast.info("Gérez vos unités depuis Admin → Paramètres → Plan de salle")}
                                    className="border-2 border-dashed border-default rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-default hover:bg-surface-bg transition-all min-h-[220px] group"
                                >
                                    <div className="w-12 h-12 rounded-full bg-surface-bg flex items-center justify-center text-muted group-hover:bg-surface-sidebar group-hover:text-text-primary transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-muted group-hover:text-primary">Ajouter une Unité</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative w-full h-[600px] bg-surface-card rounded-[3rem] border border-subtle shadow-inner p-10 overflow-hidden">
                                {/* Hand-Drawn Mind Map Visual */}
                                <div className="absolute inset-0 p-10">
                                    <svg className="w-full h-full">
                                        {/* Example hand-drawn connections */}
                                        <motion.path
                                            d="M 100 100 Q 200 80 300 150 T 500 100"
                                            stroke="var(--color-border)" strokeWidth="2" fill="none" strokeDasharray="5,5"
                                            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5 }}
                                        />
                                        <motion.path
                                            d="M 100 100 Q 50 200 150 300"
                                            stroke="var(--color-border)" strokeWidth="2" fill="none" strokeDasharray="5,5"
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

                                <div className="absolute bottom-10 left-10 max-w-sm bg-bg-primary/90 backdrop-blur-md p-8 rounded-[2rem] border-2 border-dashed border-subtle shadow-xl">
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
                        )}
                    </div>
                </main>

                {/* Explanatory Drawings Section */}
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-subtle">
                    <h3 className="text-2xl font-black italic mb-10 tracking-tight">Dessins Explicatifs des Modules</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                         <ExplanatoryCard
                            title="Flux d'Arrivée"
                            description="Parcours client digitalisé de la réservation à l'accueil à table."
                            icon={User}
                        />
                        <ExplanatoryCard
                            title="Smart Mise en Place"
                            description="Affectation dynamique des tâches selon l'affluence réelle."
                            icon={Layers}
                        />
                        <ExplanatoryCard
                            title="Multi-Site Sync"
                            description="Synchronisation multi-site pour les groupes de restauration."
                            icon={Home}
                        />
                        <ExplanatoryCard
                            title="Yield Manager"
                            description="Algorithme de yield management pour optimiser la rentabilité."
                            icon={TrendingUp}
                        />
                    </div>
                </div>

                {/* Area Detail Modal */}
                <OperationsAreaModal
                    area={selectedArea}
                    onClose={() => setSelectedArea(null)}
                    onArrival={handleArrival}
                    onMaintenance={handleMaintenance}
                />
            </div>
        </div>
    );
}
