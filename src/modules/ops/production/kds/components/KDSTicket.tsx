'use client';

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Clock,
    ChefHat,
    Book,
    AlertTriangle,
    MessageSquare,
    CheckCircle2,
    Flame,
    GripVertical,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Order, OrderItem, OrderStatus, Recipe } from "@nexus/contracts";
import { pushToUser, pushToRole } from '@/lib/push/pushClient';
import { resolveStation } from "@modules/ops/production/kds";

function isTicketWarning(status: string, elapsedMinutes: number): boolean {
    return status !== 'ready' && elapsedMinutes >= 8 && elapsedMinutes < 15;
}
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
    useSortable,
    verticalListSortingStrategy,
    arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

// ─── Allergen Detection (kds-3) ───────────────────────────────────────────────

const ALLERGEN_REGEX = /allergi|allergen|intolér/i;

/**
 * Returns distinct allergen strings found in an order's items.
 * Checks modifiers for allergen-related text and any `allergens` extra field.
 */
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

// ─── Timer Helpers (kds-1) ────────────────────────────────────────────────────

function formatElapsed(totalSeconds: number): string {
    const m = Math.floor(Math.max(0, totalSeconds) / 60);
    const s = Math.max(0, totalSeconds) % 60;
    return `${m}m ${s}s`;
}

function timerColorClass(totalSeconds: number): string {
    const minutes = Math.floor(totalSeconds / 60);
    if (minutes < 5) return "text-status-success";
    if (minutes < 10) return "text-orange-400";
    return "text-status-danger animate-pulse";
}

// ─── Sortable Item Wrapper (kds-4) ────────────────────────────────────────────

function SortableItemWrapper({ id, children }: { id: string; children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
    };
    return (
        <div ref={setNodeRef} style={style}>
            {/* Drag handle — visible only on group hover */}
            <div
                {...attributes}
                {...listeners}
                className="absolute top-3 left-2 z-20 p-1 rounded cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-40 hover:!opacity-70 transition-opacity"
            >
                <GripVertical className="w-3 h-3 text-muted" />
            </div>
            {children}
        </div>
    );
}

// ─── Seat Badge (kds-4) ───────────────────────────────────────────────────────

function SeatBadge({ seat }: { seat: number | string }) {
    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-action-primary/15 text-action-primary border border-action-primary/30">
            Siège {seat}
        </span>
    );
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

    // ── Derived urgency flags (unchanged logic) ───────────────────────────────
    const isReady   = ticket.status === 'ready';
    const isUrgent  = !isReady && elapsedMinutes >= 15;
    const isWarning = isTicketWarning(ticket.status, elapsedMinutes);

    // ── kds-7: Compute full order grouped by seat ─────────────────────────
    const fullOrderGroupedBySeat = useMemo(() => {
        if (!fullOrder) return {};
        const grouped: Record<string, import('@/domain/schemas/pos').CartItem[]> = {};
        for (const item of fullOrder.items) {
            const seat = (item as Record<string, unknown>).seatNumber as string || 'Partagé';
            if (!grouped[seat]) grouped[seat] = [];
            grouped[seat].push(item as unknown as import('@/domain/schemas/pos').CartItem);
        }
        return grouped;
    }, [fullOrder]);

    // ── kds-2 + not-2: Mark ticket ready + push notification to server ────────
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
    }, [ticket, recipes, updateOrderStatus, setAuditTicket, setIsAuditOpen]);

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
            {/* ── Card Header ─────────────────────────────────────────────── */}
            <div className={cn(
                "flex flex-col gap-3 p-5 md:p-6 border-b transition-all duration-700 relative overflow-hidden",
                "bg-surface-bg border-border/50"
            )}>
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent" />

                {/* kds-3: Allergen banner */}
                {allergens.length > 0 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-status-danger/10 border border-red-500/40 text-status-danger text-[10px] font-black uppercase tracking-wider animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                        <span>ALLERGIE: {allergens.join(', ')}</span>
                    </div>
                )}

                <div className="relative z-10 flex flex-col gap-3">
                    {/* Row 1: Table number + kds-1 timer badge (top-right) */}
                    <div className="flex items-center justify-between w-full min-h-[40px]">
                        <div className="flex items-center gap-2 min-w-0">
                            <h3 className={cn(
                                "font-serif font-medium tracking-tight italic text-primary leading-none truncate drop-shadow-sm translate-y-0.5",
                                gridColumns >= 5 ? "text-2xl" : "text-3xl lg:text-4xl"
                            )}>
                                Table <span className="text-accent-gold not-italic font-bold">{ticket.tableNumber}.</span>
                            </h3>
                            {(isUrgent || rushMode) && (
                                <div className="flex gap-1 shrink-0 self-center mt-1">
                                    <span className="relative flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error" />
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* kds-1: Live timer badge — top-right of card */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-[11px] font-black border border-current/20 bg-surface-card/70 backdrop-blur-sm shadow-sm shrink-0 transition-colors duration-300",
                            timerColorClass(elapsedSeconds)
                        )}>
                            <Clock className="w-3 h-3" strokeWidth={2.5} />
                            <span>{formatElapsed(elapsedSeconds)}</span>
                        </div>
                    </div>

                    {/* Row 2: Old urgency clock + server info (kept for urgency context) */}
                    <div className="flex items-center justify-between w-full gap-2 h-8">
                        <div className={cn(
                            "h-full px-3 rounded-lg font-mono border transition-all duration-500 flex items-center gap-2 shadow-sm shrink-0 whitespace-nowrap",
                            isUrgent || (rushMode && elapsedMinutes > 5)
                                ? "bg-error text-text-primary border-error shadow-error/20"
                                : isWarning
                                    ? "bg-warning text-text-primary border-warning shadow-warning/20"
                                    : "bg-surface-card text-primary border-subtle"
                        )}>
                            <Clock className={cn("w-3.5 h-3.5", (isUrgent || rushMode) && "animate-spin-slow")} strokeWidth={2.5} />
                            <span className="text-xs font-black pt-0.5">
                                {elapsedMinutes}<span className="text-[9px] opacity-70 ml-0.5 font-normal">MIN</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3 min-w-0 justify-end h-full">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-secondary truncate text-right leading-none pt-0.5">
                                {ticket.serverName}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-surface-card flex items-center justify-center border border-subtle shrink-0 shadow-sm">
                                <ChefHat className="w-4 h-4 text-primary" strokeWidth={2} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

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
                        {sortedItems.map((item) => {
                            const itemStation = resolveStation(item.name);
                            const product = recipes.find(p =>
                                p.name.includes(item.name) || item.name.includes(p.name)
                            );
                            const imageUrl = product?.imageUrl || product?.standardImage;
                            const isDrink = itemStation === 'bar';
                            const isCold  = itemStation === 'cold';
                            const hasMods = (item.modifiers && item.modifiers.length > 0) || item.notes;

                            const badgeColor = isDrink
                                ? "bg-action-primary text-text-primary shadow-lg shadow-purple-500/20"
                                : isCold
                                    ? "bg-action-primary text-text-primary shadow-lg shadow-blue-500/20"
                                    : "bg-status-danger text-text-primary shadow-lg shadow-red-700/20";

                            const stationLabel = isDrink ? "COCKTAIL" : isCold ? "FROID" : "CHAUD";

                            // kds-4: seat number (may exist as extra field)
                            const seatNumber = (item as unknown as { seatNumber?: number | string }).seatNumber;

                            return (
                                <SortableItemWrapper key={item._key} id={item._key}>
                                    <div className={cn(
                                        "group relative bg-surface-card rounded-[20px] overflow-hidden border shadow-sm hover:shadow-md transition-all duration-500",
                                        hasMods
                                            ? "border-action-primary ring-2 ring-action-primary/50 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse-slow"
                                            : "border-subtle"
                                    )}>
                                        <div className="relative h-24 w-full overflow-hidden">
                                            <div className="absolute inset-0 bg-surface-bg" />
                                            {imageUrl && (
                                                <img
                                                    src={imageUrl as string}
                                                    alt={item.name}
                                                    className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                                                />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-40" />

                                            <div className={cn(
                                                "absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-default shadow-md",
                                                badgeColor
                                            )}>
                                                {stationLabel}
                                            </div>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const fullRecipe: Recipe = (product || {
                                                        id: `mock_${item.name}`,
                                                        name: item.name,
                                                        category: 'general',
                                                        prepTime: 15,
                                                        cookTime: 10,
                                                        portions: 1,
                                                        difficulty: 'medium',
                                                        ingredients: [],
                                                        steps: [],
                                                        allergens: [],
                                                        dietaryInfo: [],
                                                        costPriceInCents: 0,
                                                        sellingPriceInCents: 0,
                                                        marginInCents: 0,
                                                        isActive: true,
                                                        imageUrl: imageUrl,
                                                        color: '#000000',
                                                        createdAt: new Date(),
                                                        updatedAt: new Date().toISOString(),
                                                    }) as Recipe;
                                                    setSelectedRecipe(fullRecipe);
                                                }}
                                                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-surface-sidebar/40 hover:bg-surface-sidebar/60 backdrop-blur-md border border-white/30 flex items-center justify-center text-text-primary transition-all group-hover:scale-110 z-20 shadow-lg"
                                            >
                                                <Book className="w-4 h-4" />
                                            </button>

                                            {item.quantity > 1 && (
                                                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-status-success text-text-primary flex items-center justify-center text-xs font-black shadow-lg border border-default">
                                                    X {item.quantity}
                                                </div>
                                            )}

                                            {hasMods && item.quantity === 1 && (
                                                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full bg-status-warning text-text-primary flex items-center justify-center gap-1 text-[10px] font-black shadow-lg border border-default animate-bounce">
                                                    <AlertTriangle className="w-3 h-3 fill-current text-text-primary" />
                                                    MODIF
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-4 relative">
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <h4 className="font-serif text-lg font-bold text-primary leading-tight">
                                                    {item.name}
                                                </h4>
                                                {/* kds-4: Seat badge */}
                                                {seatNumber !== undefined && seatNumber !== null && (
                                                    <SeatBadge seat={seatNumber} />
                                                )}
                                            </div>

                                            {item.modifiers && item.modifiers.length > 0 ? (
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    {item.modifiers.map((m: string | { name: string }, mi: number) => (
                                                        <span key={mi} className="text-xs font-bold text-status-warning flex items-start gap-2">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-status-warning mt-1.5 shrink-0 animate-pulse" />
                                                            {typeof m === 'string' ? m : m.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mt-1">Recette standard</p>
                                            )}

                                            {item.notes && (
                                                <div className="mt-3 p-2.5 rounded-xl bg-status-warning border border-amber-200 text-status-warning text-xs font-bold leading-tight flex items-start gap-2 animate-pulse">
                                                    <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-70" />
                                                    <span>&quot;{item.notes}&quot;</span>
                                                </div>
                                            )}

                                            <div className="mt-4 pt-3 border-t border-dashed border-subtle flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-secondary">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-3 h-3" />
                                                    <span>{product?.prepTime ?? 15} MIN</span>
                                                </div>
                                                <span>{item.modifiers?.length || 0} OPT.</span>
                                            </div>
                                        </div>
                                    </div>
                                </SortableItemWrapper>
                            );
                        })}
                    </SortableContext>
                </DndContext>
            </div>

            {/* ── kds-7: Table Context Drawer ─────────────────────────────── */}
            {Object.keys(fullOrderGroupedBySeat).length > 0 && (
                <div className="border-t border-subtle bg-surface-bg/30">
                    <button
                        onClick={() => setIsContextOpen(!isContextOpen)}
                        className="w-full flex items-center justify-between p-4 text-secondary hover:text-primary hover:bg-surface-bg transition-colors"
                    >
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Commande Complète (Accords)</span>
                            <span className="px-2 py-0.5 rounded-full bg-surface-card border border-subtle text-[9px] font-black">
                                {fullOrder?.items.length}
                            </span>
                        </div>
                        {isContextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <AnimatePresence>
                        {isContextOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <div className="p-4 pt-0 flex flex-col gap-4">
                                    {Object.entries(fullOrderGroupedBySeat).map(([seat, items]) => (
                                        <div key={seat} className="flex flex-col gap-2">
                                            <div className="text-[10px] font-bold text-muted uppercase tracking-wider pl-1 border-b border-subtle pb-1">
                                                {seat === 'Partagé' ? 'À Partager' : `Convive ${seat}`}
                                            </div>
                                            {items.map((cItem, i: number) => {
                                                const station = resolveStation(cItem.name as string);
                                                // Highlight the item if it belongs to the current ticket
                                                const cItemAny = cItem as unknown as Record<string, unknown>;
                                                const isActiveStation = ticket.items.some(ti => { const tiAny = ti as unknown as Record<string, unknown>; return (tiAny.cartId || ti.name) === (cItemAny.cartId || cItemAny.name); });
                                                return (
                                                    <div key={`${cItemAny.cartId || cItemAny.name}-${i}`}
                                                         className={cn(
                                                             "flex items-center justify-between p-2 rounded-lg border",
                                                             isActiveStation 
                                                                 ? "bg-surface-card border-accent-gold/30 shadow-sm" 
                                                                 : "bg-surface-bg/50 border-subtle opacity-75 grayscale-[0.5]"
                                                         )}>
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", isActiveStation ? "bg-accent-gold" : "bg-secondary")} />
                                                            <div className="flex flex-col">
                                                                <span className={cn("text-xs font-bold", isActiveStation ? "text-primary" : "text-secondary")}>
                                                                    {cItem.quantity && (cItem.quantity as number) > 1 ? `${cItem.quantity}x ` : ''}{cItem.name as string}
                                                                </span>
                                                                <span className="text-[9px] text-muted uppercase tracking-wider">{station}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}

            {/* ── Action Footer ───────────────────────────────────────────── */}
            <div className="p-6 pt-0 mt-auto">
                <div className="h-px w-full bg-surface-bg mb-6" />
                <AnimatePresence mode="wait">
                    {ticket.status === "ready" ? (
                        <motion.button
                            key="delivered"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all border border-subtle bg-surface-bg text-secondary hover:bg-surface-bg hover:border-default flex items-center justify-center gap-4 active:scale-[0.98] shadow-sm group"
                            onClick={() => updateOrderStatus(ticket.id, 'delivered')}
                        >
                            <CheckCircle2 className="w-5 h-5 group-hover:text-status-success transition-colors" strokeWidth={2.5} />
                            TERMINER
                        </motion.button>
                    ) : (
                        <motion.div key="progress" className="flex gap-4">
                            {ticket.status === "new" ? (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all bg-surface-bg text-primary hover:bg-surface-bg active:scale-[0.98] shadow-premium flex items-center justify-center gap-3"
                                    onClick={() => updateOrderStatus(ticket.id, 'preparing')}
                                >
                                    <Flame className="w-5 h-5 text-status-warning" strokeWidth={2.5} />
                                    LANCER
                                </button>
                            ) : (
                                <button
                                    className="w-full h-16 rounded-[20px] font-black uppercase tracking-[0.3em] text-[11px] transition-all bg-status-success text-text-primary hover:bg-status-success active:scale-[0.98] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                                    onClick={() => { void handleMarkReady(); }}
                                >
                                    <span className="flex items-center gap-3">
                                        PRÊT <CheckCircle2 className="w-5 h-5" strokeWidth={2.5} />
                                    </span>
                                </button>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
