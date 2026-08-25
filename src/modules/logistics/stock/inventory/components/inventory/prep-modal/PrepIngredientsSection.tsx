'use client';

import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Minus } from "lucide-react";
import { PremiumSelect } from "@ui/PremiumSelect";
import type { UsedIngredient } from "./prepConstants";
import type { StockItem } from "@nexus/contracts";

interface PrepIngredientsSectionProps {
    usedIngredients: UsedIngredient[];
    selectedStockItem: string;
    setSelectedStockItem: (id: string) => void;
    ingredientQty: string;
    setIngredientQty: (qty: string) => void;
    availableStock: StockItem[];
    onAddIngredient: () => void;
    onRemoveIngredient: (index: number) => void;
}

export function PrepIngredientsSection({
    usedIngredients,
    selectedStockItem,
    setSelectedStockItem,
    ingredientQty,
    setIngredientQty,
    availableStock,
    onAddIngredient,
    onRemoveIngredient,
}: PrepIngredientsSectionProps) {
    return (
        <div className="bg-surface-card/40 backdrop-blur-md rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 lg:p-10 border border-border/40 space-y-6 sm:space-y-10 shadow-soft">
            <label className="flex items-center gap-3 sm:gap-4 text-nano sm:text-micro font-black text-text-primary uppercase tracking-[0.4em] sm:tracking-[0.5em] mb-4">
                <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center shadow-soft shrink-0">
                    <Package className="w-4 h-4 text-accent-gold" />
                </div>
                COMPOSITION ALCHIMIQUE.
            </label>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-6">
                <div className="flex-1 min-w-0">
                    <PremiumSelect
                        value={selectedStockItem}
                        onChange={setSelectedStockItem}
                        options={availableStock.map(s => ({
                            value: String(s.id),
                            label: String(s.ingredientName || '').toUpperCase(),
                            description: `${s.quantity} ${String(s.unit || '').toUpperCase()} EN ARCHIVE`
                        }))}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="number"
                        step="0.01"
                        value={ingredientQty}
                        onChange={(e) => setIngredientQty(e.target.value)}
                        placeholder="QTÉ"
                        className="w-full sm:w-36 px-4 sm:px-6 py-3.5 sm:py-6 bg-surface-card border border-border/40 rounded-2xl text-[16px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest placeholder:text-text-muted/20 shadow-soft"
                    />
                    <motion.button
                        whileHover={{ scale: 1.05, rotate: 90 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={onAddIngredient}
                        disabled={!selectedStockItem || !ingredientQty}
                        className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-text-primary text-text-primary flex items-center justify-center disabled:bg-text-muted/10 disabled:text-text-muted/20 transition-all shadow-premium shrink-0"
                    >
                        <Plus className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
                    </motion.button>
                </div>
            </div>

            {usedIngredients.length > 0 && (
                <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    <AnimatePresence mode="popLayout">
                        {usedIngredients.map((ing, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={idx}
                                className="flex items-center justify-between px-4 sm:px-8 py-3.5 sm:py-5 bg-surface-card/60 border border-border/20 rounded-2xl group/inv hover:bg-surface-card transition-all shadow-soft gap-4"
                            >
                                <div className="flex items-center gap-3 sm:gap-6 min-w-0">
                                    <div className="w-2 h-2 rounded-full bg-accent-gold shadow-glow shrink-0" />
                                    <span className="text-[12px] font-black text-text-primary uppercase tracking-widest truncate">{ing.ingredientName}</span>
                                </div>
                                <div className="flex items-center gap-4 sm:gap-8 shrink-0">
                                    <span className="text-[13px] sm:text-[14px] font-serif italic font-black text-accent-gold">{ing.quantityUsed} {ing.unit.toUpperCase()}</span>
                                    <button
                                        onClick={() => onRemoveIngredient(idx)}
                                        className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error hover:text-text-primary transition-all opacity-70 sm:opacity-0 sm:group-hover/inv:opacity-100"
                                    >
                                        <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
