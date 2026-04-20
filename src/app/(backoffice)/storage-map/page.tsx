"use client";

import { useState, useMemo } from "react";
import {
    Package,
    Search,
    X,
    Refrigerator,
    Snowflake,
    AlertTriangle,
    GripVertical
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";;
import { useInventory } from "@/engines/ops/NexusOpsProvider";
import { StorageLocation, StockItem, Preparation, Ingredient } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/components/ui/Toast";
import { useAtomValue } from "jotai";
import { performanceModeAtom } from "@/store/operationalAtoms";
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    closestCenter,
} from "@dnd-kit/core";

import { DraggableIngredient } from "@/modules/inventory/components/storage-map/DraggableIngredient";
import { DraggingIngredientOverlay } from "@/modules/inventory/components/storage-map/DraggingIngredientOverlay";
import { DroppableStorageCard } from "@/modules/inventory/components/storage-map/DroppableStorageCard";
import { StorageDetailBubble } from "@/modules/inventory/components/storage-map/StorageDetailBubble";

// ============================================
// MAIN PAGE
// ============================================
export default function StorageMapPage() {
    const {
        storageLocations,
        stockItems,
        preparations,
        ingredients,
        getExpiringStock,
        getExpiringPreparations,
        transferStock,
        transferPreparation,
        addStockItem
    } = useInventory();
    const { showToast } = useToast();
    const performanceMode = useAtomValue(performanceModeAtom);

    const [selectedLocation, setSelectedLocation] = useState<StorageLocation | null>(null);
    const [filterZone, setFilterZone] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [ingredientSearch, setIngredientSearch] = useState("");
    const [selectedIngCategory, setSelectedIngCategory] = useState<string | null>(null);
    const [showIngredientPanel, setShowIngredientPanel] = useState(true);
    const [activeIngredient, setActiveIngredient] = useState<Ingredient | null>(null);
    const [selectedIngredientId, setSelectedIngredientId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    );

    const highlightedLocationIds = useMemo(() => {
        if (!selectedIngredientId) return new Set<string>();
        return new Set(stockItems
            .filter((s: any) => s.ingredientId === selectedIngredientId)
            .map((s: any) => s.storageLocationId)
        );
    }, [selectedIngredientId, stockItems]);

    const expiringStock = (getExpiringStock as any)(2);
    const expiringPreps = (getExpiringPreparations as any)(1);

    // Ingredient filtering
    const ingredientCategories = useMemo(() => {
        const cats = new Set<string>();
        (ingredients as any).forEach((ing: any) => cats.add(ing.category));
        return Array.from(cats).sort();
    }, [ingredients]);

    const filteredIngredients = useMemo(() => {
        return ingredients.filter(ing => {
            const matchesSearch = ing.name.toLowerCase().includes(ingredientSearch.toLowerCase()) ||
                ing.category.toLowerCase().includes(ingredientSearch.toLowerCase());
            const matchesCategory = !selectedIngCategory || ing.category === selectedIngCategory;
            return matchesSearch && matchesCategory;
        });
    }, [ingredients, ingredientSearch, selectedIngCategory]);

    // Filtered locations based on selected ingredient
    const baseFilteredLocations = useMemo(() => {
        let locs = storageLocations.filter(l => l.isActive);
        if (selectedIngredientId) {
            locs = locs.filter(l => highlightedLocationIds.has(l.id));
        }
        return locs;
    }, [storageLocations, selectedIngredientId, highlightedLocationIds]);

    // Group locations by zone
    const locationsByZone = useMemo(() => {
        const zones: Record<string, StorageLocation[]> = {};
        baseFilteredLocations.forEach(loc => {
            const zone = loc.zone || 'Autre';
            if (!zones[zone]) zones[zone] = [];
            zones[zone].push(loc);
        });
        return zones;
    }, [baseFilteredLocations]);

    const zones = Object.keys(locationsByZone);

    const filteredLocations = useMemo(() => {
        let locs = [...baseFilteredLocations];
        if (filterZone) locs = locs.filter(l => l.zone === filterZone);
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            locs = locs.filter(l =>
                l.name.toLowerCase().includes(query) ||
                stockItems.some((s: any) => s.storageLocationId === l.id && s.ingredientName.toLowerCase().includes(query)) ||
                preparations.some((p: any) => p.storageLocationId === l.id && p.name.toLowerCase().includes(query))
            );
        }
        return locs;
    }, [baseFilteredLocations, filterZone, searchQuery, stockItems, preparations]);

    const stockCountByIngredient = useMemo(() => {
        const counts: Record<string, number> = {};
        stockItems.forEach(s => { counts[s.ingredientId] = (counts[s.ingredientId] || 0) + 1; });
        return counts;
    }, [stockItems]);

    const getLocationStats = (locationId: string) => {
        const stock = stockItems.filter(s => s.storageLocationId === locationId);
        const preps = preparations.filter(p => p.storageLocationId === locationId);
        const expiring = expiringStock.filter((s: any) => s.storageLocationId === locationId).length +
            expiringPreps.filter((p: any) => p.storageLocationId === locationId).length;
        return { stockCount: stock.length, prepCount: preps.length, expiringCount: expiring };
    };

    const selectedLocationItems = selectedLocation ? {
        stock: stockItems.filter(s => s.storageLocationId === selectedLocation.id),
        preps: preparations.filter(p => p.storageLocationId === selectedLocation.id)
    } : null;

    const handleTransferStock = async (stockItemId: string, toLocationId: string) => {
        await (transferStock as any)(stockItemId, toLocationId);
        showToast('Stock transféré avec succès !', 'success');
    };

    const handleTransferPreparation = async (prepId: string, toLocationId: string) => {
        try {
            await transferPreparation(prepId, toLocationId);
            showToast('Préparation déplacée avec succès !', 'success');
        } catch (error) {
            showToast('Erreur lors du déplacement', 'error');
        }
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const data = active.data.current;
        if (data?.type === 'ingredient') {
            setActiveIngredient(data.ingredient);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveIngredient(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        if (activeData?.type === 'ingredient' && overData?.location) {
            const ingredient = activeData.ingredient as Ingredient;
            const location = overData.location as StorageLocation;

            const dlcDate = new Date();
            dlcDate.setDate(dlcDate.getDate() + (ingredient.shelfLifeDays || 7));

            await addStockItem({
                ingredientId: ingredient.id,
                ingredientName: ingredient.name,
                category: ingredient.category,
                quantity: 1,
                unit: ingredient.unit,
                storageLocationId: location.id,
                batchNumber: `${ingredient.id.toUpperCase()}-${Date.now()}`,
                receptionDate: new Date().toISOString().split('T')[0],
                dlc: dlcDate.toISOString().split('T')[0],
                supplierName: ingredient.supplier,
                unitCostInCents: ingredient.costInCents,
                status: 'available'
            });

            showToast(`${ingredient.name} ajouté à ${location.name} !`, 'success');
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex flex-1 h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] -m-4 md:-m-8 bg-bg-primary overflow-hidden">
                {/* Left Panel - Ingredients List */}
                <AnimatePresence>
                    {showIngredientPanel && (
                        <>
                            {/* Backdrop for mobile */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setShowIngredientPanel(false)}
                                className="md:hidden fixed inset-0 bg-black/50 z-20 backdrop-blur-sm"
                            />

                            <motion.div
                                initial={{ x: -340, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: -340, opacity: 0 }}
                                transition={performanceMode ? { duration: 0 } : { type: "spring", stiffness: 300, damping: 30 }}
                                className="fixed md:relative top-0 bottom-0 left-0 w-[85vw] md:w-[340px] bg-bg-secondary border-r border-border flex flex-col overflow-hidden shadow-2xl z-30 h-full"
                            >
                                <div className="p-6 border-b border-border bg-bg-secondary space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-lg font-serif font-light text-text-primary italic flex items-center gap-3">
                                            <Package className="w-5 h-5 text-accent" strokeWidth={1.5} />
                                            Ingrédients
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-6 h-6 rounded-lg bg-bg-tertiary flex items-center justify-center text-[9px] font-black text-text-primary border border-border">
                                                {filteredIngredients.length}
                                            </span>
                                            {/* Close button for mobile */}
                                            <button
                                                onClick={() => setShowIngredientPanel(false)}
                                                className="md:hidden w-6 h-6 rounded-lg bg-bg-tertiary flex items-center justify-center text-text-primary border border-border"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                                            <input
                                                type="text"
                                                value={ingredientSearch}
                                                onChange={(e) => setIngredientSearch(e.target.value)}
                                                placeholder="TROUVER UN PRODUIT..."
                                                className="w-full pl-12 pr-10 py-3.5 bg-bg-primary border border-border rounded-xl text-[10px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:border-accent/50 transition-all placeholder:text-text-muted"
                                            />
                                            <AnimatePresence>
                                                {ingredientSearch && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        transition={performanceMode ? { duration: 0 } : {}}
                                                        onClick={() => setIngredientSearch("")}
                                                        className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                                                    >
                                                        <X className="w-3 h-3 text-text-primary" />
                                                    </motion.button>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Category Quick Filter Chips */}
                                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar mask-gradient-right">
                                            <button
                                                onClick={() => setSelectedIngCategory(null)}
                                                className={cn(
                                                    "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                                    !selectedIngCategory
                                                        ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-500/20"
                                                        : "bg-bg-primary dark:bg-bg-tertiary text-text-muted border-border hover:border-emerald-300 hover:text-emerald-600"
                                                )}
                                            >
                                                Tout
                                            </button>
                                            {ingredientCategories.map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setSelectedIngCategory(cat)}
                                                    className={cn(
                                                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                                                        selectedIngCategory === cat
                                                            ? "bg-neutral-900 text-white border-neutral-900 shadow-lg shadow-black/10"
                                                            : "bg-white text-neutral-400 border-neutral-200 hover:border-neutral-300 hover:text-neutral-600"
                                                    )}
                                                >
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 space-y-2 elegant-scrollbar bg-bg-tertiary/20">
                                    <p className="text-[9px] font-black text-neutral-400 uppercase tracking-[0.2em] px-2 mb-4 flex items-center gap-2 opacity-60">
                                        <GripVertical className="w-3 h-3" />
                                        Glissez vers un emplacement
                                    </p>

                                    {filteredIngredients.length === 0 ? (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={performanceMode ? { duration: 0 } : {}}
                                            className="py-20 text-center px-6"
                                        >
                                            <div className="w-20 h-20 bg-bg-tertiary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                                                <Search className="w-8 h-8 text-neutral-300" />
                                            </div>
                                            <h4 className="text-sm font-black text-neutral-900 uppercase tracking-tight mb-2">Aucun résultat</h4>
                                            <p className="text-xs text-neutral-400 font-medium italic">Essayez un autre mot-clé ou vérifiez les filtres de catégorie.</p>
                                            <button
                                                onClick={() => { setIngredientSearch(""); setSelectedIngCategory(null); }}
                                                className="mt-6 text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] hover:opacity-70"
                                            >
                                                Réinitialiser tout
                                            </button>
                                        </motion.div>
                                    ) : (
                                        <div className="space-y-3">
                                            {filteredIngredients.map(ing => (
                                                <DraggableIngredient
                                                    key={ing.id}
                                                    ingredient={ing}
                                                    stockCount={stockCountByIngredient[ing.id] || 0}
                                                    highlightQuery={ingredientSearch}
                                                    isSelected={selectedIngredientId === ing.id}
                                                    onClick={() => setSelectedIngredientId(prev => prev === ing.id ? null : ing.id)}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden bg-bg-primary">
                    {/* Header */}
                    <div className="bg-white/80 dark:bg-bg-secondary/80 backdrop-blur-xl border-b border-border px-4 md:px-8 py-4 md:py-6 z-20 sticky top-0">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">

                            <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">
                                {/* Mobile Toggle for Ingredient Panel */}
                                <div className="md:hidden flex items-center justify-between w-full mb-2">
                                    <button
                                        onClick={() => setShowIngredientPanel(!showIngredientPanel)}
                                        className="flex items-center gap-2 px-3 py-2 bg-text-primary text-bg-primary rounded-lg text-xs font-black uppercase tracking-widest shadow-lg"
                                    >
                                        <Package className="w-4 h-4" />
                                        {showIngredientPanel ? "Masquer" : "Ingrédients"}
                                    </button>
                                </div>

                                {/* Global Search Hooked to stock items */}
                                <div className="flex items-center relative group w-full md:w-auto md:min-w-[320px]">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted group-focus-within:text-accent transition-colors" />
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="CHERCHER UN LIEU..."
                                        className="w-full pl-12 pr-10 py-3 bg-bg-tertiary border border-border rounded-xl text-[11px] font-black uppercase tracking-widest text-text-primary focus:outline-none focus:bg-bg-primary focus:border-accent/50 transition-all placeholder:text-text-muted"
                                    />
                                    {searchQuery && (
                                        <button
                                            onClick={() => setSearchQuery("")}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-1 p-1 bg-bg-tertiary rounded-xl border border-border overflow-x-auto no-scrollbar w-full md:w-auto mask-gradient-right">
                                    <button
                                        onClick={() => setFilterZone(null)}
                                        className={cn(
                                            "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0",
                                            !filterZone ? "bg-bg-primary shadow-sm text-text-primary border border-black/5" : "text-text-muted hover:text-text-primary"
                                        )}
                                    >
                                        Tous
                                    </button>
                                    {zones.map(zone => (
                                        <button
                                            key={zone}
                                            onClick={() => setFilterZone(zone)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0",
                                                filterZone === zone ? "bg-bg-primary shadow-sm text-text-primary border border-black/5" : "text-text-muted hover:text-text-primary"
                                            )}
                                        >
                                            {zone}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Bar - Scrollable on mobile */}
                        <div className="flex overflow-x-auto gap-4 md:gap-6 mt-6 pb-2 md:pb-0 no-scrollbar snap-x">
                            <div className="min-w-[200px] md:min-w-0 flex-1 p-4 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-xl flex items-center gap-4 snap-start">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                                    <Refrigerator className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl md:text-2xl font-serif font-light text-text-primary">{storageLocations.filter(l => l.type === 'fridge').length}</p>
                                    <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest truncate">Réfris</p>
                                </div>
                            </div>

                            <div className="min-w-[200px] md:min-w-0 flex-1 p-4 bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-800/30 rounded-xl flex items-center gap-4 snap-start">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 flex-shrink-0">
                                    <Snowflake className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl md:text-2xl font-serif font-light text-text-primary">{storageLocations.filter(l => l.type === 'freezer').length}</p>
                                    <p className="text-[9px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest truncate">Congéls</p>
                                </div>
                            </div>

                            <div className="min-w-[200px] md:min-w-0 flex-1 p-4 bg-error-soft/30 border border-error/10 rounded-xl flex items-center gap-4 snap-start">
                                <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-error text-white flex items-center justify-center shadow-lg shadow-error/20 flex-shrink-0">
                                    <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-xl md:text-2xl font-serif font-light text-text-primary">{expiringStock.length + expiringPreps.length}</p>
                                    <p className="text-[9px] font-black text-error uppercase tracking-widest truncate">À risque</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div
                        className="flex-1 overflow-auto p-4 md:p-8 bg-bg-primary"
                        onClick={() => setSelectedIngredientId(null)}
                    >
                        {filterZone ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredLocations.map(location => {
                                    const stats = getLocationStats(location.id);
                                    return (
                                        <DroppableStorageCard
                                            key={location.id}
                                            location={location}
                                            stockCount={stats.stockCount}
                                            prepCount={stats.prepCount}
                                            expiringCount={stats.expiringCount}
                                            onClick={() => setSelectedLocation(location)}
                                            isSelected={selectedLocation?.id === location.id}
                                            isHighlighted={highlightedLocationIds.has(location.id)}
                                        />
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {zones.map(zone => (
                                    <div key={zone}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <h2 className="text-xl font-serif font-light text-text-primary italic">{zone}</h2>
                                            <div className="flex-1 h-px bg-border" />
                                            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
                                                {locationsByZone[zone].length} EMPLACEMENTS
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {locationsByZone[zone].map(location => {
                                                const stats = getLocationStats(location.id);
                                                return (
                                                    <DroppableStorageCard
                                                        key={location.id}
                                                        location={location}
                                                        stockCount={stats.stockCount}
                                                        prepCount={stats.prepCount}
                                                        expiringCount={stats.expiringCount}
                                                        onClick={() => setSelectedLocation(location)}
                                                        isSelected={selectedLocation?.id === location.id}
                                                        isHighlighted={highlightedLocationIds.has(location.id)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Detail Bubble Popup */}
                <AnimatePresence>
                    {selectedLocation && selectedLocationItems && (
                        <StorageDetailBubble
                            location={selectedLocation}
                            stockItems={selectedLocationItems.stock}
                            preparations={selectedLocationItems.preps}
                            onClose={() => setSelectedLocation(null)}
                            onTransferStock={handleTransferStock}
                            onTransferPreparation={handleTransferPreparation}
                            allLocations={storageLocations as any}
                        />
                    )}
                </AnimatePresence>

            </div>

            {/* Drag Overlay - Shows the dragged item */}
            <DragOverlay>
                {activeIngredient && (
                    <DraggingIngredientOverlay ingredient={activeIngredient} />
                )}
            </DragOverlay>
        </DndContext>
    );
}
