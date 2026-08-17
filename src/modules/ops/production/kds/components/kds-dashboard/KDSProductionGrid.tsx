"use client";

import { motion } from "framer-motion";
import type { Order, Recipe } from "@nexus/contracts";
import { KDSTicket } from "../KDSTicket";
import { KDSEmptyState } from "../KDSEmptyState";

interface KDSProductionGridProps {
    displayOrders: Order[];
    orders: Order[];
    isLoading: boolean;
    tenantId: string;
    gridColumns: number;
    rushMode: boolean;
    updateOrderStatus: (id: string, status: any) => Promise<void>;
    setSelectedRecipe: (recipe: Recipe | null) => void;
    setIsAuditOpen: (open: boolean) => void;
    setAuditTicket: (ticket: any) => void;
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
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-text-muted">Chargement…</span>
                </motion.div>
            );
        }
        return <KDSEmptyState key="empty" />;
    }

    return (
        <motion.div
            layout
            className="grid gap-6 md:gap-10 relative z-10"
            style={{ gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))` }}
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
