'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { Order, OrderItem, OrderStatus, Recipe } from "@nexus/contracts";
import {
    DndContext,
    closestCenter,
    DragEndEvent,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import {
    SortableContext,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";

import { isTicketWarning, hasAllergens } from './kds-ticket/kdsTicketHelpers';
import { KDSItemCard } from './kds-ticket/KDSItemCard';
import { KDSContextDrawer } from './kds-ticket/KDSContextDrawer';
import { KDSTicketHeader } from './kds-ticket/KDSTicketHeader';
import { KDSTicketFooter } from './kds-ticket/KDSTicketFooter';
export { hasAllergens };

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditTicket {
    id: string;
    recipeName: string;
    standardImage?: string;
}

interface KDSTicketProps {
    ticket: Order;
    fullOrder?: Order; // kds-7: Context items
    tenantId: string;
    gridColumns: number;
    rushMode: boolean;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    setSelectedRecipe: (recipe: Recipe) => void;
    setIsAuditOpen: (isOpen: boolean) => void;
    setAuditTicket: (ticket: AuditTicket) => void;
    recipes: Recipe[];
}

/** An order item with a local stable key for DnD and flattening. */
type FlatItem = OrderItem & { _key: string };

// ─── KDSTicket ────────────────────────────────────────────────────────────────

export function KDSTicket({
    ticket,
    fullOrder,
    gridColumns,
    rushMode,
    updateOrderStatus,
    setSelectedRecipe,
    setIsAuditOpen,
    setAuditTicket,
    recipes,
}: KDSTicketProps) {

    // ── kds-1: Per-second elapsed timer ──────────────────────────────────────
    const getElapsed = useCallback((): number => {
        const base = ticket.createdAt as number | undefined
            ?? (ticket as unknown as { timestamp?: number | string }).timestamp;
        if (!base) return 0;
        return Math.floor((Date.now() - new Date(base).getTime()) / 1000);
    }, [ticket.createdAt]);

    const [elapsedSeconds, setElapsedSeconds] = useState<number>(getElapsed);
    const [isContextOpen, setIsContextOpen] = useState(false);

    useEffect(() => {
        const id = setInterval(() => setElapsedSeconds(getElapsed()), 1000);
        return () => clearInterval(id);
    }, [getElapsed]);

    const elapsedMinutes = Math.floor(elapsedSeconds / 60);

    // ── kds-3: Allergen detection ─────────────────────────────────────────────
    const allergens = hasAllergens(ticket.items);

    // ── kds-4: Drag-to-reorder ────────────────────────────────────────────────
    const buildFlatItems = useCallback((): FlatItem[] =>
        (ticket.items || []).flatMap((item: any, ti: number) => {
            if (((item.modifiers?.length ?? 0) > 0 || item.notes) && item.quantity > 1) {
                return Array.from({ length: item.quantity }, (_, idx) => ({
                    ...item,
                    quantity: 1,
                    _key: `${String(item.id ?? item.name)}-${ti}-${idx}`,
                }));
            }
            return [{ ...item, _key: `${String(item.id ?? item.name)}-${ti}-0` }];
        }),
    [ticket.items]);

    const [sortedItems, setSortedItems] = useState<FlatItem[]>(buildFlatItems);

    useEffect(() => {
        setSortedItems(buildFlatItems());
    }, [buildFlatItems]);

    const sensors = useSensors(useSensor(PointerSensor));

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setSortedItems(prev => {
            const oldIdx = prev.findIndex(i => i._key === String(active.id));
            const newIdx = prev.findIndex(i => i._key === String(over.id));
            return arrayMove(prev, oldIdx, newIdx);
        });
    }, []);

    // ── Derived urgency flags ─────────────────────────────────────────────────
    const isReady   = ticket.status === 'ready';
    const isUrgent  = !isReady && elapsedMinutes >= 15;
    const isWarning = isTicketWarning(ticket.status, elapsedMinutes);

    // ── kds-7: Compute full order grouped by seat ─────────────────────────
    const fullOrderGroupedBySeat = useMemo(() => {
        if (!fullOrder) return {};
        const grouped: Record<string, import('@/modules/ops/workflow/engine/types').CartItem[]> = {};
        for (const item of (fullOrder.items || [])) {
            const seat = (item as { seatNumber?: string }).seatNumber || 'Partagé';
            if (!grouped[seat]) grouped[seat] = [];
            grouped[seat].push(item as unknown as import('@/modules/ops/workflow/engine/types').CartItem);
        }
        return grouped;
    }, [fullOrder]);

    // ── kds-2 + not-2: Mark ticket ready ──────────────────────────────────────
    const handleMarkReady = useCallback(async () => {
        const itemWithStandard = (ticket.items || []).find((item: any) => {
            const r = recipes.find(rec => rec.name === item.name);
            return r?.standardImage;
        });
        if (itemWithStandard) {
            setAuditTicket({
                id: ticket.id,
                recipeName: itemWithStandard.name,
                standardImage: recipes.find(r => r.name === itemWithStandard.name)?.standardImage as string,
            });
            setIsAuditOpen(true);
        } else {
            await updateOrderStatus(ticket.id, 'ready');
            if (process.env.NODE_ENV !== 'production') {
                console.info('[KDS] Push envoyé pour ticket', ticket.id);
            }
        }
    }, [ticket, recipes, updateOrderStatus, setAuditTicket, setIsAuditOpen]);

    const recipeByName = useMemo(
        () => new Map(recipes.map(r => [r.name.toLowerCase(), r])),
        [recipes]
    );

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.2 } }}
            whileHover={{ y: -3 }}
            transition={{ type: "spring", stiffness: 280, damping: 24 }}
            className={cn(
                "group flex flex-col rounded-[24px] md:rounded-[32px] overflow-hidden border transition-all duration-500 h-fit backdrop-blur-2xl",
                "bg-surface-card/90 shadow-2xl",
                gridColumns >= 5 ? "scale-[0.98]" : "",
                isReady
                    ? "border-white/10 bg-surface-bg/50 grayscale-[0.5]"
                    : isUrgent
                        ? "border-error/50 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.3)] ring-1 ring-error/30"
                        : isWarning
                            ? "border-warning/40 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.25)]"
                            : "border border-white/10 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] hover:border-accent-gold/50"
            )}
        >
            <KDSTicketHeader
                ticket={ticket}
                gridColumns={gridColumns}
                rushMode={rushMode}
                allergens={allergens}
                isUrgent={isUrgent}
                isWarning={isWarning}
                elapsedSeconds={elapsedSeconds}
                elapsedMinutes={elapsedMinutes}
            />

            {/* ── Item List with DnD (kds-4) ─────────────────────────────── */}
            <div className={cn(
                "flex-1 flex flex-col gap-6",
                gridColumns >= 5 ? "p-4 md:p-5" : "p-5 md:p-7"
            )}>
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={sortedItems.map(i => i._key)}
                        strategy={verticalListSortingStrategy}
                    >
                        {sortedItems.map((item) => (
                            <KDSItemCard
                                key={item._key}
                                item={item}
                                recipeByName={recipeByName}
                                setSelectedRecipe={setSelectedRecipe}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
            </div>

            {/* ── kds-7: Table Context Drawer ─────────────────────────────── */}
            <KDSContextDrawer
                ticket={ticket}
                fullOrderGroupedBySeat={fullOrderGroupedBySeat}
                isContextOpen={isContextOpen}
                onToggle={() => setIsContextOpen(!isContextOpen)}
            />

            {/* ── Action Footer ───────────────────────────────────────────── */}
            <KDSTicketFooter
                ticket={ticket}
                updateOrderStatus={updateOrderStatus}
                handleMarkReady={handleMarkReady}
            />
        </motion.div>
    );
}
