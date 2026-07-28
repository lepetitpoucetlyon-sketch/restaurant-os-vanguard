"use client";

import { UtensilsCrossed, Plus, Trash2, ChefHat } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@ui/button";
import { PremiumSelect } from "@ui/PremiumSelect";

import type { Ingredient as MasterIngredient } from "@nexus/contracts";

interface RecipeIngredientSlot {
    ingredientId: string;
    quantity: number;
}

interface ProductIngredientsProps {
    recipeIngredients: RecipeIngredientSlot[];
    ingredients: MasterIngredient[]; // From InventoryContext
    addIngredient: () => void;
    updateIngredient: (index: number, field: 'ingredientId' | 'quantity', value: string | number) => void;
    removeIngredient: (index: number) => void;
}

export function ProductIngredients({
    recipeIngredients,
    ingredients,
    addIngredient,
    updateIngredient,
    removeIngredient
}: ProductIngredientsProps) {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <UtensilsCrossed className="w-4 h-4 text-accent" />
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Nomenclature technique</h3>
                </div>
                <Button
                    type="button"
                    variant="outline"
                    onClick={addIngredient}
                    className="h-10 rounded-xl bg-surface-card font-black text-[10px] tracking-widest uppercase border-border hover:bg-bg-tertiary"
                >
                    <Plus className="w-3 h-3 mr-2" /> Injecter Composant
                </Button>
            </div>
            <div className="space-y-3">
                {recipeIngredients.length === 0 ? (
                    <div className="py-12 bg-bg-tertiary/50 border-2 border-dashed border-border rounded-[2rem] text-center">
                        <p className="text-text-muted font-bold italic text-sm">Définissez les ingrédients pour calculer la marge brute.</p>
                    </div>
                ) : (
                    recipeIngredients.map((ing, i) => (
                        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} key={i} className="flex items-center gap-4 p-4 bg-surface-card dark:bg-bg-secondary rounded-3xl border border-border">
                            <div className="flex-1">
                                <PremiumSelect
                                    value={ing.ingredientId}
                                    onChange={val => updateIngredient(i, 'ingredientId', val)}
                                    options={ingredients.map(item => ({
                                        value: item.id,
                                        label: item.name,
                                        description: item.unit,
                                        icon: <ChefHat className="w-4 h-4" />
                                    }))}
                                    placeholder="SÉLECTIONNER INGRÉDIENT..."
                                />
                            </div>
                            <div className="w-32 relative pt-8">
                                <input
                                    type="number"
                                    step="0.01"
                                    value={ing.quantity}
                                    onChange={e => updateIngredient(i, 'quantity', parseFloat(e.target.value) || 0)}
                                    className="w-full h-16 px-4 bg-bg-tertiary rounded-2xl border-2 border-border font-serif font-black text-center outline-none focus:border-accent transition-all"
                                    placeholder="QTÉ"
                                />
                            </div>
                            <div className="pt-8">
                                <button
                                    type="button"
                                    onClick={() => removeIngredient(i)}
                                    className="w-14 h-16 rounded-2xl bg-error/5 hover:bg-error text-error hover:text-text-primary flex items-center justify-center transition-all border-2 border-transparent hover:border-error/20"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
