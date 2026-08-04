'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { cn } from "@/lib/ui.foundations";
import { Order, OrderItem, OrderStatus, Recipe } from "@nexus/contracts";
import { pushToUser, pushToRole } from '@/lib/push/pushClient';

import { KDSTicketHeader } from "./ticket/KDSTicketHeader";
import { KDSTicketContextDrawer } from "./ticket/KDSTicketContextDrawer";
import { KDSTicketItemsList } from "./ticket/KDSTicketItemsList";
import { KDSTicketActions } from "./ticket/KDSTicketActions";

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

const ALLERGEN_REGEX = /allergi|allergen|intolér/i;

export function hasAllergens(items: Order['items']): string[] {
    const found: string[] = [];
    for (const item of items) {
        for (const mod of item.modifiers ?? []) {
            const modStr = typeof mod === 'string' ? mod : mod.name;
            if (ALLERGEN_REGEX.test(modStr)) found.push(modStr);
        }
        const extra = item as unknown as { allergens?: unknown };
        if (Array.isArray(extra.allergens)) {
            for (const a of extra.allergens) {
                if (typeof a === 'string' && a) found.push(a);
            }
        } else if (typeof extra.allergens === 'string' && extra.allergens) {
            found.push(extra.allergens);
        }
    }
    return [...new Set(found)];
}

function isTicketWarning(status: string, elapsedMinutes: number): boolean {
    return status !== 'ready' && elapsedMinutes >= 8 && elapsedMinutes < 15;
}

// ─── KDSTicket ────────────────────────────────────────────────────────────────

export function KDSTicket({
    ticket,
    fullOrder,
    tenantId,
    gridColumns,
    rushMode,
    updateOrderStatus,
    setSelectedRecipe,
    setIsAuditOpen,
    setAuditTicket,
    recipes,
}: KDSTicketProps) {

    // ── kds-1: Per-second elapsed timer
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

    // ── kds-4: Drag-to-reorder
    const buildFlatItems = useCallback((): FlatItem[] =>
        ticket.items.flatMap((item, ti) => {
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

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setSortedItems(prev => {
            const oldIdx = prev.findIndex(i => i._key === String(active.id));
            const newIdx = prev.findIndex(i => i._key === String(over.id));
            return arrayMove(prev, oldIdx, newIdx);
        });
    }, []);

    // ── Derived urgency flags
    const isReady   = ticket.status === 'ready';
    const isUrgent  = !isReady && elapsedMinutes >= 15;
    const isWarning = isTicketWarning(ticket.status, elapsedMinutes);

    // ── kds-7: Compute full order grouped by seat
    const fullOrderGroupedBySeat = useMemo(() => {
        if (!fullOrder) return {};
        const grouped: Record<string, OrderItem[]> = {};
        for (const item of fullOrder.items) {
            const seat = (item as Record<string, unknown>).seatNumber as string || 'Partagé';
            if (!grouped[seat]) grouped[seat] = [];
            grouped[seat].push(item);
        }
        return grouped;
    }, [fullOrder]);

    // ── kds-2 + not-2: Mark ticket ready + push notification
    const handleMarkReady = useCallback(async () => {
        const itemWithStandard = ticket.items.find((item) => {
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
            const serverId = (ticket as unknown as { serverId?: string }).serverId;
            const pushPayload = {
                title: 'Plat prêt !',
                body: ticket.items.slice(0, 3).map(i => i.name).join(', '),
                url: '/pos',
            };
            if (serverId) {
                pushToUser(tenantId, serverId, pushPayload);
            } else {
                pushToRole(tenantId, 'serveur', pushPayload);
            }
            if (process.env.NODE_ENV !== 'production') {
                console.info('[KDS] Push envoyé pour ticket', ticket.id);
            }
        }
    }, [ticket, recipes, updateOrderStatus, setAuditTicket, setIsAuditOpen, tenantId]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.25 } }}
            className={cn(
                "group flex flex-col rounded-[24px] md:rounded-[32px] overflow-hidden border transition-all duration-700 h-fit",
                "bg-surface-card",
                gridColumns >= 5 ? "scale-[0.98]" : "",
                isReady
                    ? "border-subtle bg-surface-bg/50 grayscale-[0.5]"
                    : isUrgent
                        ? "border-error/40 shadow-[0_20px_60px_-15px_rgba(239,68,68,0.25)] ring-1 ring-error/20"
                        : isWarning
                            ? "border-warning/30 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.20)]"
                            : "border border-black shadow-2xl shadow-neutral-200/50 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.15)] hover:border-accent-gold/40"
            )}
        >
            <KDSTicketHeader 
                ticket={ticket}
                elapsedSeconds={elapsedSeconds}
                elapsedMinutes={elapsedMinutes}
                isUrgent={isUrgent}
                isWarning={isWarning}
                rushMode={rushMode}
                gridColumns={gridColumns}
            />

            <KDSTicketItemsList 
                sortedItems={sortedItems}
                gridColumns={gridColumns}
                recipes={recipes}
                setSelectedRecipe={setSelectedRecipe}
                handleDragEnd={handleDragEnd}
            />

            <KDSTicketContextDrawer 
                ticket={ticket}
                fullOrder={fullOrder}
                fullOrderGroupedBySeat={fullOrderGroupedBySeat}
                isContextOpen={isContextOpen}
                setIsContextOpen={setIsContextOpen}
            />

            <KDSTicketActions 
                ticket={ticket}
                updateOrderStatus={updateOrderStatus}
                handleMarkReady={handleMarkReady}
            />
        </motion.div>
    );
}
