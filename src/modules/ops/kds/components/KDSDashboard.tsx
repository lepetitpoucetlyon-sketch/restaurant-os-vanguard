"use client";

import { useState, useEffect, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useRecipes } from "@/modules/ops/providers/NexusOpsProvider";
import { useKDSController } from "@modules/ops/kds";
import { useNexusOps } from "@modules/ops";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { Recipe } from "@nexus/contracts";
import type { Order } from "@nexus/contracts";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { toast } from "sonner";
import { pushToUser, pushToRole } from '@/lib/push/pushClient';
import { tenantScopedKey } from '@/infrastructure/services/storage/tenantScopedKey';

// Components
import { KDSHeader, ServiceStation } from "./KDSHeader";
import { KDSTicket, hasAllergens } from "./KDSTicket";
import { KDSEmptyState } from "./KDSEmptyState";

// UI Components (Modals)
import { ModificationAlertsPanel } from "@modules/ops";
import { RecipeDetailDialog } from "@modules/ops";
import { PlateAuditWizard } from "@modules/ops";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const LS_KEY_BASE = 'kds-station-filter';

function readSavedServiceStation(): ServiceStation {
    try {
        const saved = localStorage.getItem(tenantScopedKey(LS_KEY_BASE));
        if (saved === 'cuisine' || saved === 'bar') return saved;
    } catch { /* ignore */ }
    return 'all';
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditTicket {
    id: string;
    recipeName: string;
    standardImage?: string;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function KDSDashboard() {
    const {
        orders: filteredOrders,
        allOrders: orders,
        updateOrderStatus,
        getPendingModifications: _getPendingModifications,
        isLoading,
        activeStation,
        setActiveStation,
        rushMode,
        setRushMode,
        searchQuery,
        setSearchQuery,
        preparingOrdersCount,
        pendingModificationsCount,
    } = useKDSController();

    const { floorOps: _floorOps } = useNexusOps();
    const { data: recipes } = useRecipes();

    // Core State
    const [currentTime, setCurrentTime] = useState(new Date());

    // UI State
    const [showModificationAlerts, setShowModificationAlerts] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [auditTicket, setAuditTicket] = useState<AuditTicket | null>(null);
    const [isAuditOpen, setIsAuditOpen] = useState(false);

    // Settings
    const columnsFromSettings = usePageSetting('kds', 'columns', 3);
    const [gridColumns, setGridColumns] = useState(columnsFromSettings);

    // kds-5: service station filter (Tout / Cuisine / Bar)
    const [serviceStation, setServiceStation] = useState<ServiceStation>(readSavedServiceStation);

    // kds-6: recall mode
    const [isRecallMode, setIsRecallMode] = useState(false);
    const [recalledOrders, setRecalledOrders] = useState<Order[]>([]);
    const [isRecallLoading, setIsRecallLoading] = useState(false);
    const tenantId = useAtomValue(tenantIdAtom) as string | undefined;

    const [lastOrderCount, setLastOrderCount] = useState(orders.length);

    // Sync settings
    useEffect(() => { setGridColumns(columnsFromSettings); }, [columnsFromSettings]);

    // Clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Notification Sound — generated via Web Audio API (no CDN dependency)
    useEffect(() => {
        if (orders.length > lastOrderCount) {
            try {
                const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.setValueAtTime(880, ctx.currentTime);
                osc.frequency.setValueAtTime(660, ctx.currentTime + 0.12);
                gain.gain.setValueAtTime(0.4, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.28);
                osc.start(ctx.currentTime);
                osc.stop(ctx.currentTime + 0.28);
            } catch { /* ignore if AudioContext unavailable */ }
        }
        setLastOrderCount(orders.length);
    }, [orders.length, lastOrderCount]);

    // kds-6: load recalled orders from Nexus when recall mode is activated
    useEffect(() => {
        if (!isRecallMode || !tenantId) return;
        setIsRecallLoading(true);
        Nexus.adapter.query<Order>(
            `tenants/${tenantId}/ops_flows`,
            {
                where: [{ field: 'attributes.status', operator: 'in', value: ['served', 'delivered'] }],
                orderBy: { field: 'updatedAt', direction: 'desc' },
                limit: 20,
            }
        ).then(results => {
            setRecalledOrders(results);
        }).catch(() => {
            // Fallback: filter from in-memory atom data
            const fallback = (orders as Order[])
                .filter(o => o.status === 'served' || o.status === 'delivered')
                .sort((a, b) => (Number(b.updatedAt ?? 0)) - (Number(a.updatedAt ?? 0)))
                .slice(0, 20);
            setRecalledOrders(fallback);
        }).finally(() => {
            setIsRecallLoading(false);
        });
    }, [isRecallMode, tenantId]);

    // kds-5: filter by service station
    const serviceFilteredOrders = useMemo(() => {
        if (serviceStation === 'all') return filteredOrders;

        if (serviceStation === 'bar') {
            return filteredOrders.filter(o =>
                o.items.some(item => {
                    const extra = item as unknown as { station?: string; category?: string };
                    return extra.station === 'bar' || extra.category === 'boissons';
                })
            ).map(o => ({
                ...o,
                items: o.items.filter(item => {
                    const extra = item as unknown as { station?: string; category?: string };
                    return extra.station === 'bar' || extra.category === 'boissons';
                }),
            }));
        }

        // cuisine: exclude bar items
        return filteredOrders
            .map(o => ({
                ...o,
                items: o.items.filter(item => {
                    const extra = item as unknown as { station?: string; category?: string };
                    return extra.station !== 'bar' && extra.category !== 'boissons';
                }),
            }))
            .filter(o => o.items.length > 0);
    }, [filteredOrders, serviceStation]);

    // kds-3: sort allergic tickets first
    const displayOrders = useMemo(() =>
        [...serviceFilteredOrders].sort((a, b) => {
            const aAllergic = hasAllergens(a.items).length > 0 ? 0 : 1;
            const bAllergic = hasAllergens(b.items).length > 0 ? 0 : 1;
            return aAllergic - bAllergic;
        }),
    [serviceFilteredOrders]);

    // kds-6: renvoyer (resend) a recalled ticket
    const handleRenvoyer = async (ticket: Order) => {
        try {
            await updateOrderStatus(ticket.id, 'preparing');
            setRecalledOrders(prev => prev.filter(t => t.id !== ticket.id));
            toast.success(`Table ${ticket.tableNumber ?? '?'} — remis en préparation`);
        } catch {
            toast.error('Impossible de renvoyer le ticket');
        }
    };

    return (
        <div className={cn(
            "h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 flex flex-col overflow-hidden animate-fade-in transition-all duration-700",
            "bg-bg-primary text-text-primary",
            rushMode && "bg-error/5"
        )}>
            {/* Rush Mode Atmospheric Overlay */}
            <AnimatePresence>
                {rushMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-error/5 to-transparent animate-pulse"
                    />
                )}
            </AnimatePresence>

            <KDSHeader
                activeStation={activeStation}
                setActiveStation={setActiveStation}
                ordersCount={orders.length}
                preparingOrdersCount={preparingOrdersCount}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                gridColumns={gridColumns}
                setGridColumns={setGridColumns}
                currentTime={currentTime}
                rushMode={rushMode}
                setRushMode={setRushMode}
                pendingModificationsCount={pendingModificationsCount}
                setShowModificationAlerts={setShowModificationAlerts}
                serviceStation={serviceStation}
                setServiceStation={setServiceStation}
                isRecallMode={isRecallMode}
                setIsRecallMode={setIsRecallMode}
            />

            {/* Production Display Area */}
            <div className="flex-1 p-4 md:p-10 overflow-auto relative custom-scrollbar bg-bg-primary">
                {/* Immersive Background Decor */}
                <div className="absolute top-[10%] left-[5%] w-[60%] h-[60%] blur-[250px] pointer-events-none rounded-full bg-success-soft/30" />
                <div className="absolute bottom-[10%] right-[5%] w-[50%] h-[50%] blur-[200px] pointer-events-none rounded-full bg-action-primary/5" />

                {/* kds-6: Recall section */}
                <AnimatePresence>
                    {isRecallMode && (
                        <motion.div
                            key="recall-section"
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative z-10 mb-10"
                        >
                            {/* Recall header */}
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-px h-6 bg-action-primary/50" />
                                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-action-primary">
                                        Rappel — {isRecallLoading ? '…' : `${recalledOrders.length} ticket${recalledOrders.length !== 1 ? 's' : ''}`}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setIsRecallMode(false)}
                                    className="flex items-center gap-2 px-4 h-9 rounded-full text-[10px] font-black uppercase tracking-widest text-muted hover:text-primary border border-subtle hover:border-default bg-surface-card transition-all"
                                >
                                    Fermer rappel
                                </button>
                            </div>

                            {isRecallLoading ? (
                                <div className="flex items-center justify-center py-12 text-muted text-sm font-medium">
                                    Chargement…
                                </div>
                            ) : recalledOrders.length === 0 ? (
                                <div className="flex items-center justify-center py-12 text-muted text-sm font-medium">
                                    Aucun ticket servi récemment
                                </div>
                            ) : (
                                <div
                                    className="grid gap-4 relative z-10"
                                    style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                                >
                                    {recalledOrders.map(ticket => (
                                        <div
                                            key={ticket.id}
                                            className="relative flex flex-col rounded-[20px] border border-subtle bg-surface-bg/50 grayscale-[0.4] opacity-70 hover:opacity-90 hover:grayscale-0 transition-all duration-300 overflow-hidden"
                                        >
                                            {/* Muted ticket summary */}
                                            <div className="flex items-center justify-between p-4 border-b border-subtle">
                                                <div>
                                                    <span className="font-serif italic text-2xl text-primary font-medium">
                                                        Table <span className="text-accent-gold font-bold not-italic">{ticket.tableNumber ?? '?'}.</span>
                                                    </span>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-muted mt-0.5">
                                                        {ticket.items.length} article{ticket.items.length !== 1 ? 's' : ''}
                                                        {ticket.serverName ? ` · ${ticket.serverName}` : ''}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border",
                                                    ticket.status === 'delivered'
                                                        ? "bg-status-success/10 text-status-success border-status-success/30"
                                                        : "bg-surface-card text-muted border-subtle"
                                                )}>
                                                    {ticket.status}
                                                </span>
                                            </div>

                                            {/* Item list summary */}
                                            <div className="flex-1 px-4 py-3 flex flex-col gap-1">
                                                {ticket.items.slice(0, 4).map((item, i) => (
                                                    <div key={i} className="flex items-center gap-2 text-[11px] text-secondary">
                                                        <span className="w-5 h-5 rounded-full bg-surface-card border border-subtle flex items-center justify-center text-[9px] font-black text-muted shrink-0">
                                                            {item.quantity}
                                                        </span>
                                                        <span className="truncate font-medium">{item.name}</span>
                                                    </div>
                                                ))}
                                                {ticket.items.length > 4 && (
                                                    <p className="text-[10px] text-muted mt-1">+{ticket.items.length - 4} autre{ticket.items.length - 4 > 1 ? 's' : ''}</p>
                                                )}
                                            </div>

                                            {/* Renvoyer button */}
                                            <div className="p-3 pt-0">
                                                <button
                                                    onClick={() => handleRenvoyer(ticket)}
                                                    className="w-full h-10 rounded-[14px] font-black text-[10px] uppercase tracking-[0.2em] bg-action-primary/10 text-action-primary border border-action-primary/30 hover:bg-action-primary hover:text-white transition-all duration-200 active:scale-95"
                                                >
                                                    Renvoyer
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Divider */}
                            <div className="mt-10 flex items-center gap-4">
                                <div className="flex-1 h-px bg-border/40" />
                                <span className="text-[9px] font-black uppercase tracking-[0.4em] text-muted">Production en cours</span>
                                <div className="flex-1 h-px bg-border/40" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Active ticket grid */}
                <AnimatePresence mode="popLayout">
                    {displayOrders.length === 0 ? (
                        isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center py-24 gap-3"
                            >
                                <div className="w-6 h-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                                <span className="text-[11px] font-black uppercase tracking-[0.3em] text-text-muted">Chargement…</span>
                            </motion.div>
                        ) : (
                            <KDSEmptyState key="empty" />
                        )
                    ) : (
                        <motion.div
                            layout
                            className="grid gap-6 md:gap-10 relative z-10"
                            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
                        >
                            {displayOrders.map(ticket => (
                                <KDSTicket
                                    key={ticket.id}
                                    ticket={ticket}
                                    tenantId={tenantId ?? ''}
                                    gridColumns={gridColumns}
                                    rushMode={rushMode}
                                    updateOrderStatus={updateOrderStatus}
                                    setSelectedRecipe={setSelectedRecipe}
                                    setIsAuditOpen={setIsAuditOpen}
                                    setAuditTicket={setAuditTicket}
                                    recipes={recipes}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <ModificationAlertsPanel
                isOpen={showModificationAlerts}
                onClose={() => setShowModificationAlerts(false)}
            />

            {selectedRecipe && (
                <RecipeDetailDialog
                    recipe={selectedRecipe}
                    isOpen={true}
                    onClose={() => setSelectedRecipe(null)}
                />
            )}

            <AnimatePresence>
                {isAuditOpen && auditTicket && (
                    <PlateAuditWizard
                        recipeName={auditTicket.recipeName}
                        standardImage={auditTicket.standardImage}
                        onClose={() => setIsAuditOpen(false)}
                        onComplete={() => {
                            void (async () => {
                                await updateOrderStatus(auditTicket.id, 'ready');
                                // not-2: Push notification when audit wizard confirms ticket ready
                                const fullTicket = displayOrders.find(o => o.id === auditTicket.id);
                                if (fullTicket) {
                                    const serverId = (fullTicket as unknown as { serverId?: string }).serverId;
                                    const pushPayload = {
                                        title: 'Plat prêt !',
                                        body: fullTicket.items.slice(0, 3).map(i => i.name).join(', '),
                                        url: '/pos',
                                    };
                                    if (serverId) {
                                        pushToUser(tenantId ?? '', serverId, pushPayload);
                                    } else {
                                        pushToRole(tenantId ?? '', 'serveur', pushPayload);
                                    }
                                    if (process.env.NODE_ENV !== 'production') {
                                        console.info('[KDS] Push envoyé pour ticket', auditTicket.id);
                                    }
                                }
                                setIsAuditOpen(false);
                                setAuditTicket(null);
                            })();
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
