"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { LayoutTemplate, Users, Layers, Sun, Building2, ChevronDown, ClipboardList, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@ui/Toast";
import { Modal } from "@ui/Modal";
import { useTables } from '@/modules/ops';
import { motion, AnimatePresence } from "framer-motion";
import { useIsMobile } from "@/shared/hooks";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { BottomSheet } from "@ui/BottomSheet";
import { useRouter } from "next/navigation";
import type { Table, TableStatus } from "@nexus/contracts";
import type { FloorPlanEditorRef } from '@/modules/facility';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { ResponsiveShell } from "@/shared/components/ui/ResponsiveShell";


const FloorPlanEditor = dynamic(
    () => import("@/modules/facility").then(mod => mod.FloorPlanEditor),
    { 
        ssr: false,
        loading: () => <div className="absolute inset-0 bg-bg-primary flex items-center justify-center animate-pulse"><div className="w-20 h-20 bg-accent/10 rounded-full border border-accent/20" /></div>
    }
);


// Floor icons mapping
const FLOOR_ICONS: Record<string, React.ElementType> = {
    'home': Layers,
    'layers': Layers,
    'sun': Sun,
    'building': Building2,
};

function FloorPlanPage() {
    const router = useRouter();
    const isMobile = useIsMobile();
    const { showToast } = useToast();
    const editorRef = useRef<FloorPlanEditorRef>(null);

    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [mode, setMode] = useState<'select' | 'add'>('select');
    const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');
    const [showGrid, setShowGrid] = useState(true);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [_showFloorModal, setShowFloorModal] = useState(false);
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

    const currentFloor = floors?.find((f: import("@nexus/contracts").Floor) => f.id === currentFloorId) || floors?.[0];
    const tablesOnCurrentFloor = getTablesForFloor(currentFloorId as string);
    const selectedTable = (tables as Table[]).find(t => t.id === selectedTableId);

    const handleSave = () => {
        showToast("Plan homologué", "success");
    };

    const _handleAddFloor = () => {
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

    const FloorIcon = currentFloor?.icon ? FLOOR_ICONS[String(currentFloor.icon)] || Layers : Layers;
    const totalSeatsOnFloor = (tablesOnCurrentFloor as Table[]).reduce((acc, t) => acc + Number(t.seats || 0), 0);
    const occupiedSeats = (tablesOnCurrentFloor as Table[])
        .filter(t => t.status === 'seated' || t.status === 'ordered' || t.status === 'eating' || t.status === 'paying' || (t.status as string) === 'occupied')
        .reduce((acc, t) => acc + Number(t.seats || 0), 0);
    const occupancyPercent = totalSeatsOnFloor > 0 ? Math.round((occupiedSeats / totalSeatsOnFloor) * 100) : 0;

    return (
        <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 flex-col overflow-hidden bg-bg-primary pb-24 lg:pb-0">
            {/* Editorial toolbar — floor label + occupancy KPI + tools */}
            <div className="px-6 lg:px-10 pt-6 pb-4 border-b border-border/40 bg-surface-card/40 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-6">
                    {/* Left — floor identity */}
                    <div className="flex items-center gap-5 min-w-0">
                        <div className="relative">
                            <button
                                onClick={() => setShowFloorSelector(!showFloorSelector)}
                                aria-haspopup="listbox"
                                aria-expanded={showFloorSelector}
                                className="flex items-baseline gap-3 group"
                            >
                                <span className="font-serif font-black italic text-[11px] uppercase tracking-[0.32em] text-text-muted/70">Plan</span>
                                <span className="font-serif font-black text-2xl lg:text-3xl leading-none tracking-[-0.02em] text-text-primary truncate">
                                    {String(currentFloor?.name || '—')}
                                </span>
                                <FloorIcon className="w-4 h-4 text-accent-gold/70 self-center -translate-y-0.5" />
                                <ChevronDown className={cn("w-4 h-4 text-text-muted transition-transform self-center", showFloorSelector && "rotate-180")} />
                            </button>

                            <AnimatePresence>
                                {showFloorSelector && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 8 }}
                                        transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.24 }}
                                        role="listbox"
                                        className="absolute top-full left-0 mt-3 w-[260px] bg-surface-card border border-border/60 rounded-xl shadow-2xl z-50 p-1 overflow-hidden"
                                    >
                                        {floors.map((f: import("@nexus/contracts").Floor) => {
                                            const isCurrent = f.id === currentFloorId;
                                            const I = f.icon && FLOOR_ICONS[String(f.icon)] ? FLOOR_ICONS[String(f.icon)] : Layers;
                                            return (
                                                <button
                                                    key={f.id}
                                                    onClick={() => { setCurrentFloor(f.id); setShowFloorSelector(false); }}
                                                    role="option"
                                                    aria-selected={isCurrent}
                                                    className={cn(
                                                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left",
                                                        isCurrent ? "bg-accent-gold/12 text-accent-gold" : "text-text-secondary hover:bg-surface-glass hover:text-text-primary"
                                                    )}
                                                >
                                                    <I className="w-4 h-4 opacity-80" />
                                                    <span className="text-sm font-medium tracking-tight truncate">{String(f.name || '')}</span>
                                                    {isCurrent && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-gold" />}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Occupancy KPI — editorial fraction */}
                        <div className="hidden lg:flex items-baseline gap-3 pl-6 border-l border-border/40">
                            <div className="flex items-baseline gap-1">
                                <span className="font-serif font-black text-xl leading-none tabular-nums text-accent-gold">{occupancyPercent}</span>
                                <span className="text-sm text-accent-gold/60">%</span>
                            </div>
                            <span className="font-serif italic text-[11px] uppercase tracking-[0.24em] text-text-muted/70">Occupation</span>
                            <span className="text-xs text-text-muted tabular-nums pl-2 border-l border-border/40 ml-1">
                                {occupiedSeats}<span className="text-text-muted/50 mx-0.5">/</span>{totalSeatsOnFloor}<span className="text-text-muted/60 ml-1 uppercase tracking-wider text-[10px]">pax</span>
                            </span>
                            <span className="text-xs text-text-muted tabular-nums">
                                <span className="tabular-nums">{tablesOnCurrentFloor.length}</span>
                                <span className="text-text-muted/60 uppercase tracking-wider text-[10px] ml-1">tables</span>
                            </span>
                        </div>
                    </div>

                    {/* Right — tools */}
                    <div className="flex items-center gap-3 shrink-0">
                        {!isMobile ? (
                            <>
                                <div className="flex items-center h-10 bg-surface-glass border border-border/40 rounded-xl overflow-hidden">
                                    <button onClick={() => setMode('select')}
                                        aria-pressed={mode === 'select'}
                                        className={cn(
                                            "h-full px-4 text-xs font-medium tracking-tight transition-colors border-r border-border/40",
                                            mode === 'select' ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                                        )}>
                                        Sélecteur
                                    </button>
                                    <button onClick={() => setMode('add')}
                                        aria-pressed={mode === 'add'}
                                        className={cn(
                                            "h-full px-4 text-xs font-medium tracking-tight transition-colors border-r border-border/40",
                                            mode === 'add' ? "bg-surface-glass-hover text-text-primary" : "text-text-muted hover:text-text-primary"
                                        )}>
                                        Construire
                                    </button>
                                    <button onClick={() => setShowGrid(v => !v)}
                                        aria-pressed={showGrid}
                                        title={showGrid ? "Masquer la grille" : "Afficher la grille"}
                                        className={cn(
                                            "h-full px-3 text-xs font-medium tracking-tight transition-colors border-r border-border/40",
                                            showGrid ? "bg-surface-glass-hover text-accent-gold" : "text-text-muted hover:text-text-primary"
                                        )}>
                                        Grille
                                    </button>
                                    <button onClick={() => setViewMode(v => v === '2d' ? '3d' : '2d')}
                                        aria-pressed={viewMode === '3d'}
                                        title={viewMode === '3d' ? "Passer en vue 2D" : "Passer en vue 3D"}
                                        className={cn(
                                            "h-full px-3 text-xs font-medium tracking-tight transition-colors",
                                            viewMode === '3d' ? "bg-accent-gold/20 text-accent-gold font-bold" : "text-text-muted hover:text-text-primary"
                                        )}>
                                        {viewMode.toUpperCase()}
                                    </button>
                                </div>
                                <button onClick={handleSave}
                                    className="h-10 px-5 bg-accent-gold hover:bg-accent-gold/90 text-[#0B0B0C] rounded-xl text-sm font-medium tracking-tight transition-colors shadow-[0_4px_20px_-6px_rgba(197,160,89,0.4)]">
                                    Homologuer
                                </button>
                            </>
                        ) : (
                            <button onClick={toggleZonesLock}
                                aria-pressed={isZonesLocked}
                                className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors border",
                                    isZonesLocked ? "bg-accent-gold text-[#0B0B0C] border-accent-gold" : "bg-surface-glass border-border/40 text-text-muted"
                                )}>
                                <Layers className="w-[15px] h-[15px]" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Interactive Stage with Responsive Adaptation */}
            <ResponsiveShell
                className="flex-1 relative bg-surface-bg overflow-hidden"
                mobile={
                    <div className="flex-1 flex flex-col h-full overflow-hidden p-3">
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="p-3 rounded-2xl bg-surface-card border border-border-default">
                                <span className="text-[10px] text-text-muted uppercase font-bold">Total Tables</span>
                                <p className="text-xl font-serif font-black text-text-primary mt-0.5">{tablesOnCurrentFloor.length}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-surface-card border border-border-default">
                                <span className="text-[10px] text-text-muted uppercase font-bold">Occupation</span>
                                <p className="text-xl font-serif font-black text-action-primary mt-0.5">{occupancyPercent}% <span className="text-xs font-sans text-text-muted">({occupiedSeats}/{totalSeatsOnFloor} PAX)</span></p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto space-y-2 pb-24 elegant-scrollbar">
                            {(tablesOnCurrentFloor as Table[]).map((t) => {
                                const isOccupied = t.status === 'seated' || t.status === 'ordered' || t.status === 'eating' || t.status === 'paying' || (t.status as string) === 'occupied';
                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => setSelectedTableId(t.id)}
                                        className={cn(
                                            "p-4 rounded-2xl border flex items-center justify-between transition-all active:scale-[0.98]",
                                            isOccupied ? "bg-surface-card border-action-primary/40 shadow-sm" : "bg-surface-card/60 border-border-default"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center font-serif font-black text-sm",
                                                isOccupied ? "bg-action-primary text-text-on-primary" : "bg-surface-bg text-text-muted border border-border-default"
                                            )}>
                                                {t.number ?? t.id.slice(-2)}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-xs text-text-primary">Table {t.number}</h4>
                                                <p className="text-[11px] text-text-muted">{t.seats} couverts • {t.status}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); router.push(`/pos?table=${t.id}`); }}
                                            className="px-3 py-1.5 rounded-xl bg-action-primary/10 text-action-primary border border-action-primary/20 text-xs font-bold"
                                        >
                                            POS
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                }
                desktop={
                    <div className="flex-1 relative w-full h-full bg-surface-bg overflow-hidden">
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
                    </div>
                }
            />

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
                            className="bg-bg-tertiary p-6 rounded-3xl flex flex-col items-center gap-3 border border-border/50 hover:bg-bg-primary transition-all"
                        >
                            <ClipboardList className="w-8 h-8 text-accent" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Prendre Commande</span>
                        </button>
                        <button
                            onClick={() => { router.push(`/reservations?table=${selectedTableId}`); setSelectedTableId(null); }}
                            className="bg-bg-tertiary p-6 rounded-3xl flex flex-col items-center gap-3 border border-border/50 hover:bg-bg-primary transition-all"
                        >
                            <Users className="w-8 h-8 text-accent-gold" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Réservation</span>
                        </button>
                    </div>

                    <button
                        onClick={async () => {
                            if (!selectedTableId) return;
                            updateTable(selectedTableId, { status: 'seated' as TableStatus });
                            await NexusEventBus.emitDurable('reservation.matched', {
                                v: 1,
                                tenantId: 'tenant_default',
                                reservationId: `resa_${selectedTableId}`,
                                tableId: selectedTableId,
                                allergens: [],
                                covers: selectedTable?.seats ?? 2,
                                matchedAt: Date.now(),
                            });
                            showToast(`Table ${selectedTable?.number} installée — KDS notifié`, 'success');
                            setSelectedTableId(null);
                        }}
                        className="w-full py-4 rounded-2xl bg-accent-gold hover:bg-accent-gold/90 text-text-primary text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                    >
                        <CheckCircle2 className="w-4 h-4" />
                        Accueillir Client (Check-In & KDS)
                    </button>

                    <div className="space-y-2 pt-4">
                        <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.3em] px-4">Statut de la Table</p>
                        <div className="grid grid-cols-4 gap-2">
                            {['available', 'seated', 'ordered', 'paying'].map(s => (
                                <button
                                    key={s}
                                    onClick={() => { updateTable(selectedTableId!, { status: s as TableStatus }); setSelectedTableId(null); }}
                                    className={cn("h-10 rounded-xl text-[8px] font-black uppercase tracking-tighter border", selectedTable?.status === s ? "bg-accent-gold text-text-primary border-transparent" : "bg-bg-primary text-text-muted border-border")}
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

export default withPageGuard(FloorPlanPage, "floor_plan");
