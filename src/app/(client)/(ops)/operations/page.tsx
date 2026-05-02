"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Book,
    Home,
    User,
    Calendar,
    Key,
    Settings,
    Search,
    Plus,
    ArrowRight,
    MapPin,
    Layers,
    Coffee,
    Cloud,
    PenTool,
    Info,
    CheckCircle2,
    TrendingUp
} from 'lucide-react';
import { NewReservationDialog } from "@modules/commerce";
// import { upsertReservationAction, deleteReservationAction, cancelReservationAction } from '@/app/(admin)/actions/reservations';
import { useFloorOps as useOMS } from '@/context/FloorContext';
import { cn } from "@/lib/ui.foundations";
import { useTenant } from '@/context/AuthContext';
// import { arrivalAreaAction } from '@/app/actions/operations';
import { toast } from 'sonner';

// Re-defining OperationalArea locally for the Empire Forge page.
// This page manages high-level spaces (salons, terrasses) rather than individual tables.
interface OperationalArea {
    id: string;
    number: string;
    status: 'vacant' | 'busy' | 'maintenance' | 'reserved' | 'occupied' | 'available';
    type: string;
    price: number;
    lastCleaning: string;
    capacity?: number;
    currentCovers?: number;
}


// --- STYLED COMPONENTS FOR THE NOTEBOOK AESTHETIC ---

const SketchLine = ({ className }: { className?: string }) => (
    <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1, ease: "easeInOut" }}
        className={cn("h-[1px] bg-neutral-300 origin-left", className)}
    />
);

const HandDrawnBorder = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={cn("relative p-6 border-2 border-neutral-400 rounded-[2rem] bg-white/50 backdrop-blur-sm shadow-sm", className)}>
        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none">
            <motion.path
                d="M 20 0 Q 30 5 100 0 Q 200 -5 300 0 Q 450 5 480 0 L 500 20 Q 495 50 500 100 Q 505 200 500 300 Q 495 450 500 480 L 480 500 Q 450 495 300 500 Q 200 505 100 500 Q 30 495 20 500 L 0 480 Q 5 450 0 300 Q -5 200 0 100 Q 5 30 0 20 Z"
                fill="none"
                stroke="#A3A3A3"
                strokeWidth="1.5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
            />
        </svg>
        {children}
    </div>
);
export default function OperationsPage() {
    const { areas, updateAreaStatus } = useOMS() as any;
    const [view, setView] = useState<'grid' | 'map'>('grid');
    const [selectedArea, setSelectedArea] = useState<OperationalArea | null>(null);
    const { activeTenantId } = useTenant();

    const handleArrival = async (area: OperationalArea) => {
        if (!activeTenantId) return;
        try {
            const promise = Promise.resolve({ success: true });
            toast.promise(promise, {
                loading: 'Suture Grade IX: Établissement du lien financier...',
                success: 'Arrivée validée & Provision comptable générée.',
                error: 'Échec de la suture financière.'
            });
            await promise;
            setSelectedArea(null);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-[#FDFCF0] font-serif relative overflow-hidden">
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
                                <div className="w-12 h-12 rounded-full border-2 border-neutral-800 flex items-center justify-center">
                                    <Book className="w-6 h-6 text-neutral-800" />
                                </div>
                                <h1 className="text-5xl font-black text-neutral-900 tracking-tighter italic">Empire <span className="text-neutral-500 font-normal not-italic">Forge</span></h1>
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-neutral-500 text-sm tracking-[0.2em] uppercase font-sans font-bold ml-16"
                            >
                                Sovereign Operations Management System v2.0
                            </motion.p>
                        </div>

                        <nav className="flex items-center gap-8 font-sans font-bold text-[11px] uppercase tracking-widest text-neutral-400">
                            <button
                                onClick={() => setView('grid')}
                                className={cn("hover:text-black transition-colors flex items-center gap-2", view === 'grid' && "text-black")}
                            >
                                <Home className="w-4 h-4" /> Journal des Espaces
                            </button>
                            <button
                                onClick={() => setView('map')}
                                className={cn("hover:text-black transition-colors flex items-center gap-2", view === 'map' && "text-black")}
                            >
                                <Layers className="w-4 h-4" /> Carte Mentale
                            </button>
                            <div className="h-4 w-[1px] bg-neutral-200" />
                        </nav>
                    </div>
                    <SketchLine className="mt-8" />
                </header>

                <main className="max-w-7xl mx-auto grid grid-cols-12 gap-10">
                    {/* Left Sidebar - Quick Sketch / Info */}
                    <div className="col-span-3 space-y-10">
                        <HandDrawnBorder className="bg-white/80">
                            <div className="flex items-center gap-3 mb-6">
                                <PenTool className="w-5 h-5 text-blue-500" />
                                <h3 className="text-lg font-bold">Notes du Jour</h3>
                            </div>
                            <div className="space-y-4 text-sm text-neutral-600 leading-relaxed italic">
                                <p>• Vérifier le stock de nappage pour le Carré 2.</p>
                                <p>• Le Salon 301 nécessite une Mise en Place VIP.</p>
                                <p>• Prise de poste Brigade à 14h.</p>
                            </div>
                            <div className="mt-8 pt-6 border-t border-dashed border-neutral-200">
                                <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-neutral-400">
                                    <span>Occupation Totale</span>
                                    <span>84%</span>
                                </div>
                                <div className="h-1 bg-neutral-100 rounded-full mt-2 overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: '84%' }}
                                        className="h-full bg-blue-400"
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
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-400 mb-4">Météo Locale</h4>
                            <div className="flex items-center gap-4">
                                <div className="text-4xl font-black">18°C</div>
                                <div className="text-sm text-neutral-500 italic">Ensoleillé avec quelques nuages</div>
                            </div>
                        </div>
                    </div>

                    {/* Center Content - Grid or Map */}
                    <div className="col-span-9">
                        {view === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {areas?.map((area: any, idx: number) => (
                                    <motion.div
                                        key={area.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.1 }}
                                        whileHover={{ y: -5 }}
                                        onClick={() => setSelectedArea(area)}
                                        className={cn(
                                            "relative p-8 rounded-[2.5rem] bg-white border border-neutral-100 shadow-sm cursor-pointer group transition-all overflow-hidden",
                                            selectedArea?.id === area.id && "ring-2 ring-neutral-900 border-transparent shadow-2xl"
                                        )}
                                    >
                                        {/* Small Sketch Decoration */}
                                        <div className="absolute top-4 right-4 text-neutral-100 group-hover:text-neutral-200 transition-colors">
                                            {area.type === 'suite' ? <Key className="w-12 h-12 rotate-45" /> : <Home className="w-12 h-12" />}
                                        </div>

                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-4">
                                                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded bg-neutral-50 border border-neutral-100 italic">No. {area.number}</span>
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    area?.status === 'vacant' ? "bg-green-400" :
                                                        area?.status === 'busy' ? "bg-blue-400" :
                                                            area?.status === 'maintenance' ? "bg-red-400" : "bg-amber-400"
                                                )} />
                                            </div>
                                            <h3 className="text-2xl font-black text-neutral-900 mb-1 capitalize group-hover:italic transition-all">{area.type}</h3>
                                            <p className="text-xs text-neutral-400 font-sans font-bold uppercase tracking-wider mb-6">{area?.status}</p>

                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <p className="text-[10px] text-neutral-400 font-sans font-bold uppercase tracking-widest mb-1 italic">Tarif / Service</p>
                                                    <p className="text-xl font-sans font-black">€{area.price}</p>
                                                </div>
                                                <button className="w-10 h-10 rounded-2xl bg-neutral-900 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 shadow-lg">
                                                    <ArrowRight className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Hand-drawn style decorative element */}
                                        <motion.div
                                            className="absolute bottom-0 left-0 h-1 bg-neutral-900"
                                            initial={{ width: 0 }}
                                            whileHover={{ width: '100%' }}
                                        />
                                    </motion.div>
                                ))}

                                <button className="border-2 border-dashed border-neutral-300 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 hover:border-neutral-900 hover:bg-neutral-50 transition-all min-h-[220px] group">
                                    <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-400 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="text-xs font-black uppercase tracking-widest text-neutral-400 group-hover:text-neutral-900">Ajouter une Unité</span>
                                </button>
                            </div>
                        ) : (
                            <div className="relative w-full h-[600px] bg-white rounded-[3rem] border border-neutral-100 shadow-inner p-10 overflow-hidden">
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
                                <MindMapNode x={100} y={150} label="Établissement" icon={Home} color="bg-neutral-900" description="Le cœur de l'établissement (Main Hall & Salons)" />
                                <MindMapNode x={350} y={100} label="Espaces" icon={Key} color="bg-blue-500" description="50 tables, 5 salons de luxe" />
                                <MindMapNode x={550} y={200} label="Logistique" icon={Layers} color="bg-amber-500" description="Office et maintenance technique" />
                                <MindMapNode x={180} y={350} label="Salle" icon={Layers} color="bg-green-500" description="Entretien et protocole HACCP de la salle" />
                                <MindMapNode x={480} y={380} label="Accueil" icon={Coffee} color="bg-purple-500" description="Services clients et réservations" />

                                <div className="absolute top-10 right-10 flex gap-4">
                                    <HandDrawnLegend label="Flux Opérationnels" color="text-blue-400" />
                                    <HandDrawnLegend label="Zones Statiques" color="text-amber-400" />
                                </div>

                                <div className="absolute bottom-10 left-10 max-w-sm bg-[#FDFCF0]/90 backdrop-blur-md p-8 rounded-[2rem] border-2 border-dashed border-neutral-200 shadow-xl">
                                    <div className="flex items-center gap-2 mb-4 text-neutral-400 font-bold text-[10px] uppercase tracking-widest">
                                        <PenTool className="w-4 h-4 text-blue-500" /> Note de Conception
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-xl font-black italic">Architecture Système</h4>
                                        <p className="text-xs text-neutral-600 leading-relaxed">
                                            L'écosystème de Service est structuré en 5 piliers interconnectés. Chaque unité opérationnelle (Node) transmet des données en temps réel vers la <strong>Propriété Centrale</strong>.
                                        </p>
                                        <div className="flex items-center gap-4 pt-4">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-neutral-100 flex items-center justify-center text-[10px] font-bold">U{i}</div>
                                                ))}
                                            </div>
                                            <ArrowRight className="w-4 h-4 text-neutral-300" />
                                            <div className="text-[10px] font-black uppercase tracking-widest bg-neutral-900 text-white px-3 py-1 rounded-full">Dashboard Global</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Explanatory Drawings Section */}
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-neutral-100">
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

                {/* Area Detail Modal - Notebook Style */}
                <AnimatePresence>
                    {selectedArea && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-10 bg-black/5 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
                                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                                exit={{ opacity: 0, scale: 0.9, rotate: 2 }}
                                className="w-full max-w-4xl bg-[#FDFCF0] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.15)] border border-neutral-200 overflow-hidden flex"
                            >
                                {/* Left Side: Hand-drawn Illustration Placeholder */}
                                <div className="w-2/5 p-12 border-r border-neutral-100 bg-white/30 relative">
                                    <div className="absolute top-8 left-8">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">Croquis de la Configuration</span>
                                    </div>
                                    <div className="w-full h-full rounded-2xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center text-center p-10">
                                        <motion.div
                                            animate={{ scale: [1, 1.05, 1] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="w-32 h-32 text-neutral-200 mb-6"
                                        >
                                            <Home className="w-full h-full stroke-1" />
                                        </motion.div>
                                        <h4 className="text-lg font-black italic mb-2">Structure Master</h4>
                                        <p className="text-xs text-neutral-400 italic font-sans leading-relaxed">
                                            Vue en perspective de l'agencement standard pour le type <strong>{selectedArea.type}</strong>.
                                            Inclut hall, salon et espace privatif.
                                        </p>
                                    </div>
                                </div>

                                {/* Right Side: Data & Control */}
                                <div className="flex-1 p-16 space-y-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h2 className="text-4xl font-black italic tracking-tighter mb-2">Détails de l'Espace {selectedArea.number}</h2>
                                            <div className="flex gap-4 items-center">
                                                <div className="px-3 py-1 bg-neutral-900 text-white rounded-full text-[10px] font-bold uppercase tracking-widest italic">{selectedArea?.status}</div>
                                                <p className="text-xs text-neutral-400 font-sans font-bold uppercase tracking-widest">{selectedArea.type} Premium</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedArea(null)}
                                            className="w-12 h-12 rounded-2xl bg-white border border-neutral-100 flex items-center justify-center text-neutral-400 hover:text-black hover:shadow-lg transition-all"
                                        >
                                            <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-10">
                                        <div className="space-y-6">
                                            <div>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-2 italic flex items-center gap-2">
                                                    <Calendar className="w-3 h-3 text-blue-400" /> Dernière Mise en Place
                                                </p>
                                                <p className="text-sm font-sans font-black italic">{new Date(selectedArea.lastCleaning).toLocaleDateString()} à {new Date(selectedArea.lastCleaning).toLocaleTimeString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-2 italic flex items-center gap-2">
                                                    <Key className="w-3 h-3 text-amber-400" /> Disponibilité Immédiate
                                                </p>
                                                <p className="text-sm font-sans font-black italic">{selectedArea?.status === 'vacant' ? 'Oui, prêt pour accueil' : 'Non, procédure en cours'}</p>
                                            </div>
                                        </div>

                                        <div className="bg-white/50 p-6 rounded-[2rem] border border-neutral-100 italic space-y-4">
                                            <p className="text-xs text-neutral-500 leading-relaxed">
                                                "Cette zone bénéficie d'un éclairage optimal. Recommandation : vérifier le dressage des couverts."
                                            </p>
                                            <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                                                <CheckCircle2 className="w-4 h-4" /> Validé par Gouvernance
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-8 border-t border-dashed border-neutral-200 flex gap-4">
                                        <button
                                            onClick={() => handleArrival(selectedArea)}
                                            className="h-14 px-8 bg-neutral-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                        >
                                            <User className="w-4 h-4" /> Accueil Client
                                        </button>
                                        <button
                                            onClick={() => {
                                                updateAreaStatus(selectedArea.id, 'maintenance');
                                                setSelectedArea(null);
                                            }}
                                            className="h-14 px-8 border border-neutral-200 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all flex items-center gap-3"
                                        >
                                            <Coffee className="w-4 h-4" /> Mise en Place
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

const MindMapNode = ({ x, y, label, icon: Icon, color, description }: { x: number, y: number, label: string, icon: React.ElementType, color: string, description?: string }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ left: x, top: y }}
        className="absolute flex flex-col items-center group cursor-pointer"
    >
        <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl transition-all group-hover:scale-110 group-hover:shadow-2xl relative z-10", color)}>
            <Icon className="w-8 h-8" />
        </div>
        <div className="mt-4 bg-white px-4 py-2 rounded-2xl border border-neutral-100 shadow-xl transition-all group-hover:bg-neutral-900 group-hover:text-white relative z-10 w-48 text-center">
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
    <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-neutral-100 shadow-sm">
        <div className={cn("w-2 h-2 rounded-full", color.replace('text-', 'bg-'))} />
        <span className={cn("text-[10px] font-black uppercase tracking-widest", color)}>{label}</span>
    </div>
);

const ExplanatoryCard = ({ title, description, icon: Icon }: { title: string, description: string, icon: React.ElementType }) => (
    <motion.div
        whileHover={{ y: -5 }}
        className="p-8 bg-white rounded-[2.5rem] border border-neutral-100 shadow-sm group relative overflow-hidden"
    >
        <div className="absolute -right-4 -top-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-24 h-24 rotate-12" />
        </div>
        <div className="w-12 h-12 rounded-2xl bg-neutral-50 flex items-center justify-center mb-6 group-hover:bg-neutral-900 group-hover:text-white transition-colors">
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-black italic mb-3">{title}</h4>
        <p className="text-xs text-neutral-400 leading-relaxed font-sans">{description}</p>

        {/* Sketch Simulation - Decorative Line */}
        <motion.div
            className="absolute bottom-6 left-8 right-8 h-[1px] bg-neutral-100"
            whileHover={{ backgroundColor: '#000' }}
        />
    </motion.div>
);
