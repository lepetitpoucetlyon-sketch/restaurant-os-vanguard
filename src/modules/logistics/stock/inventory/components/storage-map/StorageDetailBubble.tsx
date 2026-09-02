"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ChefHat } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import type { StorageLocation, StockItem, Preparation } from "@nexus/contracts";

import { StorageBubbleHeader } from "./detail-bubble/StorageBubbleHeader";
import { StorageStockItemCard } from "./detail-bubble/StorageStockItemCard";
import { StoragePreparationCard } from "./detail-bubble/StoragePreparationCard";

interface StorageDetailBubbleProps {
    location: StorageLocation;
    stockItems: StockItem[];
    preparations: Preparation[];
    onClose: () => void;
    onTransferStock: (stockItemId: string, toLocation: string) => void;
    onTransferPreparation: (prepId: string, toLocation: string) => void;
    allLocations: StorageLocation[];
}

export function StorageDetailBubble({
    location,
    stockItems,
    preparations,
    onClose,
    onTransferStock,
    onTransferPreparation,
    allLocations,
}: StorageDetailBubbleProps) {
    const [activeTab, setActiveTab] = useState<'stock' | 'preparations'>('stock');
    const [movingItemId, setMovingItemId] = useState<string | null>(null);
    const [movingPrepId, setMovingPrepId] = useState<string | null>(null);

    const otherLocations = allLocations.filter(l => l.id !== location.id && l.isActive);

    return (
        <>
            {/* Backdrop */}
            <motion.div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            />

            {/* Bubble Popup */}
            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32.5rem] max-h-[85vh] bg-bg-secondary/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 z-50 flex flex-col overflow-hidden border border-border"
            >
                <StorageBubbleHeader
                    location={location}
                    stockItems={stockItems}
                    onClose={onClose}
                />

                {/* Tabs */}
                <div className="flex gap-2 px-6 py-4 bg-bg-tertiary/50 border-b border-border">
                    <button
                        onClick={() => setActiveTab('stock')}
                        className={cn(
                            "flex-1 py-3 rounded-xl text-chip-label transition-all",
                            activeTab === 'stock'
                                ? "bg-bg-primary shadow-sm text-text-primary ring-1 ring-black/5 dark:ring-white/5"
                                : "text-text-muted hover:text-text-primary hover:bg-bg-primary/50"
                        )}
                    >
                        Ingrédients ({stockItems.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('preparations')}
                        className={cn(
                            "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                            activeTab === 'preparations'
                                ? "bg-surface-card dark:bg-surface-card/10 shadow-md text-primary dark:text-text-primary"
                                : "text-secondary dark:text-muted hover:text-primary dark:hover:text-muted hover:bg-surface-card/50 dark:hover:bg-surface-card/5"
                        )}
                    >
                        Préparations ({preparations.length})
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[400px]">
                    <AnimatePresence mode="wait">
                        {activeTab === 'stock' ? (
                            <motion.div
                                key="stock"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {stockItems.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 mx-auto rounded-xl bg-bg-tertiary flex items-center justify-center mb-4 border border-border">
                                            <Package className="w-8 h-8 text-text-muted" />
                                        </div>
                                        <p className="font-bold text-text-muted">Aucun ingrédient</p>
                                        <p className="text-nano text-text-muted mt-1 uppercase tracking-widest">Glissez des ingrédients ici</p>
                                    </div>
                                ) : (
                                    stockItems.map(item => (
                                        <StorageStockItemCard
                                            key={item.id}
                                            item={item}
                                            isMoving={movingItemId === item.id}
                                            setMovingItemId={setMovingItemId}
                                            onTransferStock={onTransferStock}
                                            otherLocations={otherLocations}
                                        />
                                    ))
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preparations"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                className="space-y-2"
                            >
                                {preparations.length === 0 ? (
                                    <div className="text-center py-10">
                                        <div className="w-16 h-16 mx-auto rounded-xl bg-bg-tertiary flex items-center justify-center mb-4 border border-border">
                                            <ChefHat className="w-8 h-8 text-text-muted" />
                                        </div>
                                        <p className="font-bold text-text-muted">Aucune préparation</p>
                                    </div>
                                ) : (
                                    preparations.map(prep => (
                                        <StoragePreparationCard
                                            key={prep.id}
                                            prep={prep}
                                            isMoving={movingPrepId === prep.id}
                                            setMovingPrepId={setMovingPrepId}
                                            onTransferPreparation={onTransferPreparation}
                                            otherLocations={otherLocations}
                                        />
                                    ))
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </>
    );
}
