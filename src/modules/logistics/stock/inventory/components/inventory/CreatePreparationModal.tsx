'use client';

import { useState } from "react";
import { motion } from "framer-motion";
import { Modal } from "@ui/Modal";
import { ChefHat, X, Check, RefreshCw } from "lucide-react";
import { useInventory } from "../../hooks/useInventory";
import { useAuth } from "@/shared/hooks";
import { IngredientUnit, PreparationType, DEFAULT_STORAGE_LOCATIONS, type StockItem } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";

import type { UsedIngredient } from "./prep-modal/prepConstants";
import { PrepIdentitySection } from "./prep-modal/PrepIdentitySection";
import { PrepMeasurementGrid } from "./prep-modal/PrepMeasurementGrid";
import { PrepLogisticsGrid } from "./prep-modal/PrepLogisticsGrid";
import { PrepIngredientsSection } from "./prep-modal/PrepIngredientsSection";
import { PrepLifecycleSection } from "./prep-modal/PrepLifecycleSection";

interface CreatePreparationModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreatePreparationModal({ isOpen, onClose }: CreatePreparationModalProps) {
    const { stockItems, addPreparation, storageLocations, consumeStock } = useInventory();
    const { currentUser } = useAuth();

    const [name, setName] = useState('');
    const [type, setType] = useState<PreparationType>('sauce');
    const [quantity, setQuantity] = useState('');
    const [unit, setUnit] = useState<IngredientUnit>('kg');
    const [portions, setPortions] = useState('');
    const [storageLocation, setStorageLocation] = useState('');
    const [containerId, setContainerId] = useState('');
    const [dlcDays, setDlcDays] = useState('3');
    const [notes, setNotes] = useState('');

    const [usedIngredients, setUsedIngredients] = useState<UsedIngredient[]>([]);
    const [selectedStockItem, setSelectedStockItem] = useState('');
    const [ingredientQty, setIngredientQty] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);

    const addIngredient = () => {
        const stock = stockItems.find((s: StockItem) => s.id === selectedStockItem);
        if (!stock || !ingredientQty) return;

        setUsedIngredients([...usedIngredients, {
            stockItemId: stock.id,
            ingredientName: stock.ingredientName as string,
            quantityUsed: parseFloat(ingredientQty),
            unit: stock.unit as IngredientUnit
        }]);
        setSelectedStockItem('');
        setIngredientQty('');
    };

    const removeIngredient = (index: number) => {
        setUsedIngredients(usedIngredients.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!name || !quantity || !storageLocation) return;

        setIsSubmitting(true);

        const dlcDate = new Date();
        dlcDate.setDate(dlcDate.getDate() + parseInt(dlcDays));

        // Deduct stock for used ingredients
        for (const ing of usedIngredients) {
            await consumeStock(ing.stockItemId, ing.quantityUsed, `Préparation: ${name}`);
        }

        // Calculate total cost in cents
        const totalCostInCents = usedIngredients.reduce((acc, used) => {
            const stock = stockItems.find((s: StockItem) => s.id === used.stockItemId);
            if (stock && stock.unitCostInCents) {
                return acc + Math.round(used.quantityUsed * (Number(stock.unitCostInCents) || 0));
            }
            return acc;
        }, 0);

        // Create the preparation
        await addPreparation({
            name,
            type,
            quantity: parseFloat(quantity),
            unit,
            portions: portions ? parseInt(portions) : undefined,
            storageLocationId: storageLocation,
            containerId: containerId || undefined,
            preparationDate: new Date().toISOString().split('T')[0],
            preparedBy: currentUser?.name || 'Chef',
            dlc: dlcDate.toISOString().split('T')[0],
            ingredients: usedIngredients,
            status: 'fresh',
            notes: notes || '',
            costInCents: totalCostInCents
        });

        setIsSubmitting(false);
        setSuccess(true);

        setName('');
        setQuantity('');
        setPortions('');
        setNotes('');
        setUsedIngredients([]);
        onClose();
    };

    const activeLocations = storageLocations.length > 0 ? storageLocations : DEFAULT_STORAGE_LOCATIONS;
    const availableStock = stockItems.filter((s: StockItem) => s.status === 'available' && (Number(s.quantity) || 0) > 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            showClose={false}
            className="p-0 border-none bg-transparent"
        >
            <div className="relative bg-bg-primary border border-white/40 rounded-2xl sm:rounded-[3rem] shadow-premium w-full max-h-[90vh] flex flex-col overflow-hidden group/modal">
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent-gold/10 blur-[100px] pointer-events-none rounded-full" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/5 blur-[80px] pointer-events-none rounded-full" />

                {/* Header */}
                <div className="p-5 sm:p-8 lg:p-10 border-b border-border/40 bg-surface-card/40 backdrop-blur-md relative z-10">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-[22px] bg-text-primary flex items-center justify-center shadow-premium shrink-0">
                                <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-text-primary" strokeWidth={1.5} />
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-xl sm:text-2xl lg:text-4xl font-serif font-black text-text-primary italic tracking-tight truncate">Sceau de Préparation.</h2>
                                <p className="text-nano font-black text-accent-gold uppercase tracking-[0.4em] mt-1 sm:mt-2">Mise en place & Alchimie Culinaire</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-surface-card/60 hover:bg-surface-card flex items-center justify-center transition-all border border-border/40 hover:rotate-90 hover:scale-110 shadow-soft shrink-0"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    </div>
                </div>

                {/* Form Content */}
                <div className="flex-1 overflow-y-auto p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-10 elegant-scrollbar relative z-10">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-16 sm:py-24 text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -45 }}
                                animate={{ scale: 1, rotate: 0 }}
                                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-[2.5rem] bg-text-primary flex items-center justify-center mb-8 sm:mb-10 shadow-premium"
                            >
                                <Check className="w-10 h-10 sm:w-12 sm:h-12 text-text-primary" strokeWidth={3} />
                            </motion.div>
                            <p className="text-2xl sm:text-4xl font-serif font-black text-text-primary italic">Mise en Place Scellée.</p>
                            <p className="text-nano font-black text-accent-gold uppercase tracking-[0.4em] mt-3 sm:mt-4">L&apos;œuvre culinaire a été archivée avec succès</p>
                        </div>
                    ) : (
                        <div className="space-y-6 sm:space-y-10">
                            <PrepIdentitySection
                                name={name}
                                setName={setName}
                                type={type}
                                setType={setType}
                            />
                            <PrepMeasurementGrid
                                quantity={quantity}
                                setQuantity={setQuantity}
                                unit={unit}
                                setUnit={setUnit}
                                portions={portions}
                                setPortions={setPortions}
                            />
                            <PrepLogisticsGrid
                                storageLocation={storageLocation}
                                setStorageLocation={setStorageLocation}
                                containerId={containerId}
                                setContainerId={setContainerId}
                                activeLocations={activeLocations}
                            />
                            <PrepIngredientsSection
                                usedIngredients={usedIngredients}
                                selectedStockItem={selectedStockItem}
                                setSelectedStockItem={setSelectedStockItem}
                                ingredientQty={ingredientQty}
                                setIngredientQty={setIngredientQty}
                                availableStock={availableStock}
                                onAddIngredient={addIngredient}
                                onRemoveIngredient={removeIngredient}
                            />
                            <PrepLifecycleSection
                                dlcDays={dlcDays}
                                setDlcDays={setDlcDays}
                                notes={notes}
                                setNotes={setNotes}
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                {!success && (
                    <div className="p-5 sm:p-8 lg:p-10 border-t border-border/40 bg-surface-card/40 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative z-10">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onClose}
                            className="px-6 sm:px-10 py-3 sm:py-5 text-nano font-black uppercase tracking-[0.5em] text-text-muted hover:text-text-primary transition-all rounded-xl sm:rounded-[22px] w-full sm:w-auto text-center"
                        >
                            ANNULATION
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleSubmit}
                            disabled={!name || !quantity || !storageLocation || isSubmitting}
                            className={cn(
                                "flex items-center justify-center gap-4 sm:gap-6 px-8 sm:px-16 py-3.5 sm:py-6 rounded-xl sm:rounded-[22px] text-micro font-black uppercase tracking-[0.5em] transition-all duration-500 shadow-premium w-full sm:w-auto",
                                name && quantity && storageLocation
                                    ? "bg-text-primary text-text-primary hover:bg-accent-gold"
                                    : "bg-text-muted/10 text-text-muted/20 cursor-not-allowed"
                            )}
                        >
                            {isSubmitting ? (
                                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                            ) : (
                                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
                            )}
                            {isSubmitting ? "SCELLAGE..." : "SCELLER L'ALCHIMIE"}
                        </motion.button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
