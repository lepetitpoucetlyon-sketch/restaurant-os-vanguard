'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Minus } from 'lucide-react';
import { PremiumSelect } from '@ui/PremiumSelect';
import type { IngredientUnit } from '@nexus/contracts';

export interface UsedIngredient {
    stockItemId: string;
    ingredientName: string;
    quantityUsed: number;
    unit: IngredientUnit;
}

interface IngredientCompositionProps {
    usedIngredients: UsedIngredient[];
    availableStock: { id: string; ingredientName: string | unknown; quantity: number | unknown; unit: string | unknown }[];
    selectedStockItem: string;
    ingredientQty: string;
    onSelectStockItem: (id: string) => void;
    onChangeQty: (qty: string) => void;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

export function IngredientComposition({
    usedIngredients, availableStock, selectedStockItem, ingredientQty,
    onSelectStockItem, onChangeQty, onAdd, onRemove,
}: IngredientCompositionProps) {
    return (
        <div className="bg-surface-card/40 backdrop-blur-md rounded-[2.5rem] p-10 border border-border/40 space-y-10 shadow-soft">
            <label className="flex items-center gap-4 text-[11px] font-black text-text-primary uppercase tracking-[0.5em] mb-4">
                <div className="w-8 h-8 rounded-xl bg-accent-gold/10 flex items-center justify-center shadow-soft">
                    <Package className="w-4 h-4 text-accent-gold" />
                </div>
                COMPOSITION ALCHIMIQUE.
            </label>

            <div className="flex items-center gap-6">
                <div className="flex-1">
                    <PremiumSelect
                        value={selectedStockItem}
                        onChange={onSelectStockItem}
                        options={availableStock.map(s => ({
                            value: String(s.id),
                            label: String(s.ingredientName || '').toUpperCase(),
                            description: `${s.quantity} ${String(s.unit || '').toUpperCase()} EN ARCHIVE`
                        }))}
                    />
                </div>
                <input
                    type="number"
                    step="0.01"
                    value={ingredientQty}
                    onChange={(e) => onChangeQty(e.target.value)}
                    placeholder="QTÉ"
                    className="w-40 px-6 py-6 bg-surface-card border border-border/40 rounded-2xl text-[16px] font-serif italic font-black text-text-primary text-center focus:outline-none focus:border-accent-gold transition-all tracking-widest placeholder:text-text-muted/20 shadow-soft"
                />
                <motion.button
                    whileHover={{ scale: 1.05, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onAdd}
                    disabled={!selectedStockItem || !ingredientQty}
                    className="w-16 h-16 rounded-2xl bg-text-primary text-text-primary flex items-center justify-center disabled:bg-text-muted/10 disabled:text-text-muted/20 transition-all shadow-premium"
                >
                    <Plus className="w-8 h-8" strokeWidth={2.5} />
                </motion.button>
            </div>

            {usedIngredients.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    <AnimatePresence mode="popLayout">
                        {usedIngredients.map((ing, idx) => (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                key={idx}
                                className="flex items-center justify-between px-8 py-5 bg-surface-card/60 border border-border/20 rounded-2xl group/inv hover:bg-surface-card transition-all shadow-soft"
                            >
                                <div className="flex items-center gap-6">
                                    <div className="w-2 h-2 rounded-full bg-accent-gold shadow-glow" />
                                    <span className="text-[12px] font-black text-text-primary uppercase tracking-widest">{ing.ingredientName}</span>
                                </div>
                                <div className="flex items-center gap-8">
                                    <span className="text-[14px] font-serif italic font-black text-accent-gold">{ing.quantityUsed} {ing.unit.toUpperCase()}</span>
                                    <button
                                        onClick={() => onRemove(idx)}
                                        className="w-10 h-10 rounded-xl bg-error/5 text-error flex items-center justify-center hover:bg-error hover:text-text-primary transition-all opacity-0 group-hover/inv:opacity-100"
                                    >
                                        <Minus className="w-5 h-5" />
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
