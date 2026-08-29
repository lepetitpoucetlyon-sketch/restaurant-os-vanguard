"use client";

import { motion } from "framer-motion";
import type { Order, OrderStatus, Recipe } from "@nexus/contracts";
import type { AuditTicket } from "./KDSModalsLayer";
import { KDSTicket } from "../KDSTicket";
import { KDSEmptyState } from "../KDSEmptyState";

interface KDSProductionGridProps {
    displayOrders: Order[];
    orders: Order[];
    isLoading: boolean;
    tenantId: string;
    gridColumns: number;
    rushMode: boolean;
    updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
    setSelectedRecipe: (recipe: Recipe | null) => void;
    setIsAuditOpen: (open: boolean) => void;
    setAuditTicket: (ticket: AuditTicket | null) => void;
    recipes: Recipe[] | undefined;
}

export function KDSProductionGrid({
    displayOrders,
    orders,
    isLoading,
    tenantId,
    gridColumns,
    rushMode,
    updateOrderStatus,
    setSelectedRecipe,
    setIsAuditOpen,
    setAuditTicket,
    recipes,
}: KDSProductionGridProps) {
    if (displayOrders.length === 0) {
        if (isLoading) {
            return (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center py-24 gap-3"
                >
                    <div className="w-6 h-6 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
                    <span className="text-micro font-black uppercase tracking-[0.3em] text-text-muted">Chargement…</span>
                </motion.div>
            );
        }
        return <KDSEmptyState key="empty" />;
    }

    return (
        <motion.div
            layout
            className="grid gap-[var(--density-gap-md,1rem)] lg:gap-[var(--density-gap-lg,1.5rem)] relative z-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"
            style={{
                gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, max(280px, calc((100% - ${(gridColumns - 1) * 24}px) / ${gridColumns}))), 1fr))`
            }}
        >
            {displayOrders.map(ticket => (
                <KDSTicket
                    key={ticket.id}
                    ticket={ticket}
                    fullOrder={orders.find((o: Order) => o.id === ticket.id) || ticket}
                    tenantId={tenantId}
                    gridColumns={gridColumns}
                    rushMode={rushMode}
                    updateOrderStatus={updateOrderStatus}
                    setSelectedRecipe={setSelectedRecipe}
                    setIsAuditOpen={setIsAuditOpen}
                    setAuditTicket={setAuditTicket}
                    recipes={recipes ?? []}
                />
            ))}
        </motion.div>
    );
}
