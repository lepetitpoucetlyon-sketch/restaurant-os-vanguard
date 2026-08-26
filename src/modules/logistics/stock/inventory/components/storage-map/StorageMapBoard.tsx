"use client";

import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Warehouse, Search } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import type { StorageLocation, StockItem, Preparation, Ingredient } from "@nexus/contracts";
import { DroppableStorageCard } from "./DroppableStorageCard";
import { StorageDetailBubble } from "./StorageDetailBubble";
import { DraggingIngredientOverlay } from "./DraggingIngredientOverlay";

interface StorageMapBoardProps {
    locations: StorageLocation[];
    stockItems: StockItem[];
    preparations?: Preparation[];
    onTransferStock?: (stockItemId: string, toLocationId: string) => void;
    onTransferPreparation?: (prepId: string, toLocationId: string) => void;
}

export function StorageMapBoard({
    locations,
    stockItems,
    preparations = [],
    onTransferStock,
    onTransferPreparation,
}: StorageMapBoardProps) {
    const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeDragIngredient, setActiveDragIngredient] = useState<Ingredient | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8, // Empêche les conflits de scrolling tactile sur tablette
            },
        })
    );

    const locationStats = useMemo(() => {
        const stats: Record<string, { stockCount: number; prepCount: number; expiringCount: number }> = {};
        const now = Date.now();
        const twoDaysMs = 48 * 3600 * 1000;

        for (const loc of locations) {
            const locId = String(loc.id);
            stats[locId] = { stockCount: 0, prepCount: 0, expiringCount: 0 };
        }

        for (const item of stockItems) {
            const locId = item.locationId ? String(item.locationId) : 'other';
            if (!stats[locId]) {
                stats[locId] = { stockCount: 0, prepCount: 0, expiringCount: 0 };
            }
            stats[locId].stockCount++;

            if (item.expirationDate) {
                const expTime = new Date(String(item.expirationDate)).getTime();
                if (expTime - now < twoDaysMs) {
                    stats[locId].expiringCount++;
                }
            }
        }

        for (const prep of preparations) {
            const locId = prep.locationId ? String(prep.locationId) : 'other';
            if (stats[locId]) {
                stats[locId].prepCount++;
            }
        }

        return stats;
    }, [locations, stockItems, preparations]);

    const filteredLocations = useMemo(() => {
        if (!searchQuery) return locations;
        const q = searchQuery.toLowerCase();
        return locations.filter(l => 
            String(l.name ?? '').toLowerCase().includes(q) || 
            (l.type && String(l.type).toLowerCase().includes(q))
        );
    }, [locations, searchQuery]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragIngredient(null);

        if (!over) return;

        const overLocationId = String(over.id).replace('location-', '');
        const activeData = active.data.current;

        if (activeData?.type === 'stock' && onTransferStock) {
            onTransferStock(String(active.id).replace('stock-', ''), overLocationId);
        } else if (activeData?.type === 'preparation' && onTransferPreparation) {
            onTransferPreparation(String(active.id).replace('prep-', ''), overLocationId);
        }
    };

    const selectedLocationStock = useMemo(() => {
        if (!selectedLocation) return [];
        return stockItems.filter(i => String(i.locationId || 'other') === String(selectedLocation.id));
    }, [selectedLocation, stockItems]);

    const selectedLocationPreps = useMemo(() => {
        if (!selectedLocation) return [];
        return preparations.filter(p => String(p.locationId || 'other') === String(selectedLocation.id));
    }, [selectedLocation, preparations]);

    return (
        <div className="space-y-6">
            {/* Header & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher une zone, frigo, réserve..."
                        className="w-full bg-bg-secondary border border-border rounded-xl pl-9 pr-4 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                    />
                </div>
            </div>

            {/* Storage Grid */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredLocations.map((loc) => {
                        const locId = String(loc.id);
                        const stat = locationStats[locId] || { stockCount: 0, prepCount: 0, expiringCount: 0 };
                        return (
                            <DroppableStorageCard
                                key={loc.id}
                                location={loc}
                                stockCount={stat.stockCount}
                                prepCount={stat.prepCount}
                                expiringCount={stat.expiringCount}
                                isSelected={selectedLocation?.id === loc.id}
                                onClick={() => setSelectedLocation(loc)}
                            />
                        );
                    })}

                    {filteredLocations.length === 0 && (
                        <div className="col-span-full text-center py-12 border border-dashed border-border rounded-2xl bg-bg-secondary/50">
                            <Warehouse className="w-12 h-12 text-text-muted mx-auto mb-3 opacity-50" />
                            <p className="text-text-muted font-medium">Aucun emplacement de stockage trouvé.</p>
                        </div>
                    )}
                </div>

                <DragOverlay>
                    {activeDragIngredient && (
                        <DraggingIngredientOverlay
                            ingredient={activeDragIngredient}
                        />
                    )}
                </DragOverlay>
            </DndContext>

            {/* Storage Detail Bubble */}
            <AnimatePresence>
                {selectedLocation && (
                    <StorageDetailBubble
                        location={selectedLocation}
                        stockItems={selectedLocationStock}
                        preparations={selectedLocationPreps}
                        allLocations={locations}
                        onClose={() => setSelectedLocation(null)}
                        onTransferStock={(stockId, toLoc) => {
                            if (onTransferStock) onTransferStock(stockId, toLoc);
                        }}
                        onTransferPreparation={(prepId, toLoc) => {
                            if (onTransferPreparation) onTransferPreparation(prepId, toLoc);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
