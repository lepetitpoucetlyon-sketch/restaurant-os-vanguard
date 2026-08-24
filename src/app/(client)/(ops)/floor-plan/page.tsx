"use client";

import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { LayoutTemplate, Users, ClipboardList, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useToast } from "@ui/Toast";
import { Modal } from "@ui/Modal";
import { useTables } from '@/modules/ops';
import { useIsMobile } from "@/shared/hooks";
import { NexusEventBus } from "@/shared/eventBus/NexusEventBus";
import { BottomSheet } from "@ui/BottomSheet";
import { useRouter } from "next/navigation";
import type { Table, TableStatus } from "@nexus/contracts";
import { FloorPlanHeader, type FloorPlanEditorRef } from '@/modules/facility';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";
import { ResponsiveShell } from "@/shared/components/ui/ResponsiveShell";


const FloorPlanEditor = dynamic(
    () => import("@/modules/facility").then(mod => mod.FloorPlanEditor),
    { 
        ssr: false,
        loading: () => <div className="absolute inset-0 bg-bg-primary flex items-center justify-center animate-pulse"><div className="w-20 h-20 bg-accent/10 rounded-full border border-accent/20" /></div>
    }
);


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

    const totalSeatsOnFloor = (tablesOnCurrentFloor as Table[]).reduce((acc, t) => acc + Number(t.seats || 0), 0);
    const occupiedSeats = (tablesOnCurrentFloor as Table[])
        .filter(t => t.status === 'seated' || t.status === 'ordered' || t.status === 'eating' || t.status === 'paying' || (t.status as string) === 'occupied')
        .reduce((acc, t) => acc + Number(t.seats || 0), 0);
    const occupancyPercent = totalSeatsOnFloor > 0 ? Math.round((occupiedSeats / totalSeatsOnFloor) * 100) : 0;

    return (
        <div className="flex h-[calc(100vh-80px)] lg:h-[calc(100vh-100px)] -m-4 lg:-m-8 flex-col overflow-hidden bg-bg-primary pb-24 lg:pb-0">
            <FloorPlanHeader
                currentFloor={currentFloor}
                floors={floors ?? []}
                currentFloorId={currentFloorId}
                setCurrentFloor={setCurrentFloor}
                showFloorSelector={showFloorSelector}
                setShowFloorSelector={setShowFloorSelector}
                occupancyPercent={occupancyPercent}
                occupiedSeats={occupiedSeats}
                totalSeatsOnFloor={totalSeatsOnFloor}
                tablesOnCurrentFloorLength={tablesOnCurrentFloor.length}
                mode={mode}
                setMode={setMode}
                viewMode={viewMode}
                setViewMode={setViewMode}
                showGrid={showGrid}
                setShowGrid={setShowGrid}
                isMobile={isMobile}
                isZonesLocked={isZonesLocked}
                toggleZonesLock={toggleZonesLock}
                handleSave={handleSave}
            />

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
