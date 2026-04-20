"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { ZoomIn, ZoomOut, Maximize, Move, Grid, LayoutTemplate, Plus, MousePointer2, Camera, RefreshCw, Users, Heart, AlertTriangle, Square, Box, Layers, Home, Sun, Building2, ChevronDown, X, Sparkles, Minus, ClipboardList, ChefHat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/ui.foundations";;
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";
import { useTables } from "@/engines/ops/NexusOpsProvider";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { fadeInUp, easing } from "@/lib/motion";
import { useIsMobile } from "@/hooks";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useRouter } from "next/navigation";

const FloorPlanEditor = dynamic(
    () => import("@/components/floor-plan/FloorPlanEditor"),
    { ssr: false }
) as React.ComponentType<any>;

// Floor icons mapping
const FLOOR_ICONS: Record<string, React.ElementType> = {
    'home': Layers,
    'layers': Layers,
    'sun': Sun,
    'building': Building2,
};

export default function FloorPlanPage() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { showToast } = useToast();
    const editorRef = useRef<any>(null);
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState<'select' | 'add'>('select');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [showGrid, setShowGrid] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showFloorModal, setShowFloorModal] = useState(false);
    const [showFloorSelector, setShowFloorSelector] = useState(false);
    const [newFloorName, setNewFloorName] = useState("");
    const [newFloorLevel, setNewFloorLevel] = useState(0);

    // Mobile State
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);

    const {
        resetToTemplate,
        isZonesLocked,
        toggleZonesLock,
        floors,
        currentFloorId,
        setCurrentFloor,
        addFloor,
        getTablesForFloor,
        tables,
        updateTable
    } = useTables();

    const currentFloor = floors.find(f => f.id === currentFloorId) || floors[0];
    const tablesOnCurrentFloor = getTablesForFloor(currentFloorId);
    const selectedTable = tables.find(t => t.id === selectedTableId);

    const handleSave = () => {
        showToast("Plan homologué", "success");
    };

    const handleAddFloor = () => {
        if (!newFloorName.trim()) return;
        addFloor({
            name: newFloorName,
            level: newFloorLevel,
            description: '',
            isActive: true,
            icon: newFloorLevel > 0 ? 'layers' : newFloorLevel < 0 ? 'building' : 'home'
        });
        setNewFloorName("");
        setNewFloorLevel(0);
        setShowFloorModal(false);
        showToast(`Niveau "${newFloorName}" créé`, "success");
    };

    const FloorIcon = currentFloor?.icon ? FLOOR_ICONS[currentFloor.icon] || Layers : Layers;
    const totalSeatsOnFloor = tablesOnCurrentFloor.reduce((acc, t) => acc + t.seats, 0);

    return (
        <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 flex-col overflow-hidden bg-bg-primary pb-24 lg:pb-0">
            {/* Contextual Toolbar */}
            <div className="px-4 lg:px-10 pt-4 lg:pt-6 pb-2">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full bg-white/80 dark:bg-bg-primary/80 backdrop-blur-2xl p-1.5 rounded-full shadow-2xl border border-border flex items-center justify-between relative z-40"
                >
                    {/* Floor Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowFloorSelector(!showFloorSelector)}
                            className="flex items-center gap-2 lg:gap-4 bg-bg-tertiary/50 hover:bg-bg-tertiary transition-all rounded-full p-1 lg:p-1.5 pr-4 lg:pr-6 min-w-[140px] lg:min-w-[240px]"
                        >
                            <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-full bg-accent/10 flex items-center justify-center border border-accent/20">
                                <FloorIcon className="w-4 h-4 lg:w-5 h-5 text-accent" />
                            </div>
                            <div className="text-left">
                                <div className="flex items-center gap-1 lg:gap-2">
                                    <span className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest truncate">{currentFloor?.name}</span>
                                    <ChevronDown className={cn("w-3 h-3 text-accent transition-transform", showFloorSelector && "rotate-180")} />
                                </div>
                                <p className="text-[7px] lg:text-[8px] text-accent/60 font-bold tracking-tighter hidden lg:block">{tablesOnCurrentFloor.length} UNITÉS • {totalSeatsOnFloor} PAX</p>
                            </div>
                        </button>

                        {/* Floor Selector Dropdown */}
                        <AnimatePresence>
                            {showFloorSelector && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 mt-3 w-[240px] bg-white/95 dark:bg-bg-secondary/95 backdrop-blur-3xl border border-border rounded-[2rem] shadow-2xl z-50 p-2 overflow-hidden"
                                >
                                    {floors.map(f => (
                                        <button
                                            key={f.id}
                                            onClick={() => { setCurrentFloor(f.id); setShowFloorSelector(false); }}
                                            className={cn("w-full grid grid-cols-[32px_1fr] items-center gap-3 p-2 rounded-2xl mb-1 transition-all text-left", f.id === currentFloorId ? "bg-bg-tertiary text-accent" : "hover:bg-bg-tertiary text-text-muted")}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center place-self-center">
                                                {f.icon && FLOOR_ICONS[f.icon] ?
                                                    (() => { const I = FLOOR_ICONS[f.icon]; return <I className="w-4 h-4" /> })()
                                                    : <Layers className="w-4 h-4" />
                                                }
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest truncate">{f.name}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Tools Row */}
                    <div className="flex items-center gap-2 pr-2">
                        {!isMobile ? (
                            <div className="flex items-center gap-3">
                                <div className="flex bg-bg-tertiary/50 rounded-full p-1 border border-border">
                                    <button onClick={() => setMode('select')} className={cn("px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", mode === 'select' ? "bg-accent-gold text-white" : "text-text-muted")}>SÉLECTEUR</button>
                                    <button onClick={() => setMode('add')} className={cn("px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all", mode === 'add' ? "bg-accent-gold text-white" : "text-text-muted")}>CONSTRUIRE</button>
                                </div>
                                <button onClick={handleSave} className="h-10 px-8 bg-text-primary text-white rounded-full text-[9px] font-black tracking-widest">HOMOLOGUER</button>
                            </div>
                        ) : (
                            <button onClick={toggleZonesLock} className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all border", isZonesLocked ? "bg-accent text-white border-transparent" : "bg-bg-tertiary border-border text-text-muted")}>
                                <Layers className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Main Interactive Stage */}
            <div className="flex-1 relative bg-bg-primary overflow-hidden">
                {showGrid && (
                    <div className="absolute inset-0 opacity-[0.1]" style={{
                        backgroundImage: 'radial-gradient(var(--color-border) 1px, transparent 1px)',
                        backgroundSize: '40px 40px'
                    }} />
                )}

                <FloorPlanEditor
                    ref={editorRef}
                    scale={scale}
                    onScaleChange={setScale}
                    position={position}
                    onPositionChange={setPosition}
                    mode={mode}
                    viewMode={viewMode}
                    currentFloorId={currentFloorId}
                    onTableSelect={(id: string) => isMobile && setSelectedTableId(id)}
                />

                {/* Mobile FAB for Template/Add */}
                {isMobile && !selectedTableId && (
                    <motion.button
                        layoutId="floor-fab"
                        onClick={() => setShowTemplateModal(true)}
                        className="fixed bottom-28 right-6 w-14 h-14 bg-accent-gold text-white rounded-full flex items-center justify-center shadow-2xl z-40"
                    >
                        <LayoutTemplate className="w-6 h-6" />
                    </motion.button>
                )}
            </div>

            {/* Table Detail Bottom Sheet (Mobile Only) */}
            <BottomSheet
                isOpen={!!selectedTableId}
                onClose={() => setSelectedTableId(null)}
                title={`Table ${selectedTable?.number}`}
                subtitle={`${selectedTable?.seats} couverts • État: ${selectedTable?.status}`}
            >
                <div className="p-6 space-y-4 pb-12">
                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={() => { router.push(`/pos?table=${selectedTableId}`); setSelectedTableId(null); }}
                            className="bg-bg-tertiary p-6 rounded-3xl flex flex-col items-center gap-3 border border-border/50"
                        >
                            <ClipboardList className="w-8 h-8 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Prendre Commande</span>
                        </button>
                        <button
                            onClick={() => { router.push(`/reservations?table=${selectedTableId}`); setSelectedTableId(null); }}
                            className="bg-bg-tertiary p-6 rounded-3xl flex flex-col items-center gap-3 border border-border/50"
                        >
                            <Users className="w-8 h-8 text-accent-gold" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Réservation</span>
                        </button>
                    </div>

                    <div className="space-y-2 pt-4">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] px-4">Statut de la Table</p>
                        <div className="grid grid-cols-4 gap-2">
                            {['available', 'seated', 'ordered', 'paying'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { updateTable(selectedTableId!, { status: s as any }); setSelectedTableId(null); }}
                                    className={cn("h-10 rounded-xl text-[8px] font-black uppercase tracking-tighter border", selectedTable?.status === s ? "bg-accent-gold text-white border-transparent" : "bg-bg-primary text-text-muted border-border")}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </BottomSheet>

            <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} size="lg">
                <div className="p-8 space-y-6">
                    <h2 className="text-2xl font-serif italic text-text-primary">Agencements Signatures</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {['Bistro Standard', 'Grand Banquet', 'Intimiste', 'Terrasse Été'].map(t => (
                            <button key={t} onClick={() => { resetToTemplate('standard'); setShowTemplateModal(false); }} className="p-6 border border-border rounded-2xl text-left hover:bg-bg-tertiary transition-all">
                                <p className="font-bold text-sm uppercase tracking-widest">{t}</p>
                            </button>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
