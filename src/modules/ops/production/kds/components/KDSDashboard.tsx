"use client";

import { useState, useEffect, useMemo } from "react";
import { useAtomValue } from "jotai";
import { useRecipes } from '../../../providers/hooks/kitchenHooks';
import { useKDSController } from '../hooks/useKDSController';
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/ui.foundations";
import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { Recipe } from "@nexus/contracts";
import type { Order } from "@nexus/contracts";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { tenantIdAtom } from "@/store/pillars/sovereign";
import { toast } from "sonner";

import { KDSHeader } from "./KDSHeader";
import { hasAllergens } from "./kds-ticket/kdsTicketHelpers";
import { KDSRecallSection } from "./kds-dashboard/KDSRecallSection";
import { KDSProductionGrid } from "./kds-dashboard/KDSProductionGrid";
import { KDSModalsLayer, type AuditTicket } from "./kds-dashboard/KDSModalsLayer";
import { ResponsiveShell } from "@/shared/components/ui/ResponsiveShell";

export function KDSDashboard() {
    const {
        orders: filteredOrders,
        allOrders: orders,
        updateOrderStatus,
        isLoading,
        activeStation,
        lockedStation,
        setActiveStation,
        rushMode,
        setRushMode,
        searchQuery,
        setSearchQuery,
        preparingOrdersCount,
        pendingModificationsCount,
    } = useKDSController();

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

    // Recall mode
    const [isRecallMode, setIsRecallMode] = useState(false);
    const [recalledOrders, setRecalledOrders] = useState<Order[]>([]);
    const [isRecallLoading, setIsRecallLoading] = useState(false);
    const tenantId = useAtomValue(tenantIdAtom) as string | undefined;

    const [lastOrderCount, setLastOrderCount] = useState(orders.length);

    useEffect(() => { setGridColumns(columnsFromSettings); }, [columnsFromSettings]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

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
            } catch { /* ignore */ }
        }
        setLastOrderCount(orders.length);
    }, [orders.length, lastOrderCount]);

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
            const fallback = (orders as Order[])
                .filter(o => o.status === 'served' || o.status === 'delivered')
                .sort((a, b) => (Number(b.updatedAt ?? 0)) - (Number(a.updatedAt ?? 0)))
                .slice(0, 20);
            setRecalledOrders(fallback);
        }).finally(() => {
            setIsRecallLoading(false);
        });
    }, [isRecallMode, tenantId]);

    const displayOrders = useMemo(() =>
        [...filteredOrders].sort((a, b) => {
            const aAllergic = hasAllergens(a.items).length > 0 ? 0 : 1;
            const bAllergic = hasAllergens(b.items).length > 0 ? 0 : 1;
            return aAllergic - bAllergic;
        }),
    [filteredOrders]);

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
                lockedStation={lockedStation}
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
                isRecallMode={isRecallMode}
                setIsRecallMode={setIsRecallMode}
            />

            <div className="flex-1 p-3 md:p-6 lg:p-10 overflow-auto relative custom-scrollbar bg-surface-bg">
                <div className="absolute top-[10%] left-[5%] w-[60%] h-[60%] blur-[250px] pointer-events-none rounded-full bg-status-success/10" />
                <div className="absolute bottom-[10%] right-[5%] w-[50%] h-[50%] blur-[200px] pointer-events-none rounded-full bg-action-primary/5" />

                <AnimatePresence>
                    <KDSRecallSection
                        isRecallMode={isRecallMode}
                        setIsRecallMode={setIsRecallMode}
                        isRecallLoading={isRecallLoading}
                        recalledOrders={recalledOrders}
                        gridColumns={gridColumns}
                        handleRenvoyer={handleRenvoyer}
                    />
                </AnimatePresence>

                <ResponsiveShell
                    mobile={
                        <AnimatePresence mode="popLayout">
                            <KDSProductionGrid
                                displayOrders={displayOrders}
                                orders={orders}
                                isLoading={isLoading}
                                tenantId={tenantId ?? ''}
                                gridColumns={1}
                                rushMode={rushMode}
                                updateOrderStatus={updateOrderStatus}
                                setSelectedRecipe={setSelectedRecipe}
                                setIsAuditOpen={setIsAuditOpen}
                                setAuditTicket={setAuditTicket}
                                recipes={recipes}
                            />
                        </AnimatePresence>
                    }
                    tablet={
                        <AnimatePresence mode="popLayout">
                            <KDSProductionGrid
                                displayOrders={displayOrders}
                                orders={orders}
                                isLoading={isLoading}
                                tenantId={tenantId ?? ''}
                                gridColumns={2}
                                rushMode={rushMode}
                                updateOrderStatus={updateOrderStatus}
                                setSelectedRecipe={setSelectedRecipe}
                                setIsAuditOpen={setIsAuditOpen}
                                setAuditTicket={setAuditTicket}
                                recipes={recipes}
                            />
                        </AnimatePresence>
                    }
                    desktop={
                        <AnimatePresence mode="popLayout">
                            <KDSProductionGrid
                                displayOrders={displayOrders}
                                orders={orders}
                                isLoading={isLoading}
                                tenantId={tenantId ?? ''}
                                gridColumns={gridColumns}
                                rushMode={rushMode}
                                updateOrderStatus={updateOrderStatus}
                                setSelectedRecipe={setSelectedRecipe}
                                setIsAuditOpen={setIsAuditOpen}
                                setAuditTicket={setAuditTicket}
                                recipes={recipes}
                            />
                        </AnimatePresence>
                    }
                />
            </div>

            <KDSModalsLayer
                showModificationAlerts={showModificationAlerts}
                setShowModificationAlerts={setShowModificationAlerts}
                selectedRecipe={selectedRecipe}
                setSelectedRecipe={setSelectedRecipe}
                isAuditOpen={isAuditOpen}
                setIsAuditOpen={setIsAuditOpen}
                auditTicket={auditTicket}
                setAuditTicket={setAuditTicket}
                displayOrders={displayOrders}
                tenantId={tenantId}
                updateOrderStatus={updateOrderStatus}
            />
        </div>
    );
}
