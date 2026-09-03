"use client";

import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { staggerContainer, staggerItem } from "@/shared/utils/motion";
import type { Recipe, RecipeIngredient } from "@nexus/contracts";
import { RecipeCostBadge } from '../../../recipes/RecipeCostBadge';
import { scaleIngredient } from "../../../recipes/recipeUtils";
import { useLanguage } from "@/shared/hooks";

interface RecipeIngredientsSectionProps {
    recipe: Recipe;
    basePortions: number;
    currentPortions: number;
}

export function RecipeIngredientsSection({
    recipe,
    basePortions,
    currentPortions,
}: RecipeIngredientsSectionProps) {
    const { t } = useLanguage();
    return (
        <div className="space-y-10">
            <div>
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-micro font-black uppercase tracking-[0.4em] transition-colors text-primary">{t('kitchen.recipeDetail.ingredients')}</h3>
                    <div className="h-px w-20 transition-colors bg-border" />
                </div>
                <motion.ul
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-2"
                >
                    {(recipe.ingredients ?? []).map((ing: RecipeIngredient, i: number) => {
                        const { value, unit } = scaleIngredient(ing, basePortions, currentPortions);
                        return (
                            <motion.li
                                variants={staggerItem}
                                key={i}
                                className="flex items-center justify-between py-3 border-b group px-2 rounded-xl transition-all border-border hover:bg-surface-glass"
                            >
                                <span className="text-[14px] font-medium transition-colors group-hover:text-accent text-primary">
                                    {ing.name}
                                </span>
                                <span className="text-[12px] font-mono font-bold px-3 py-1 rounded-lg border transition-colors text-secondary bg-surface-card/40 border-black/5">
                                    {value} {unit}
                                </span>
                            </motion.li>
                        );
                    })}
                </motion.ul>
            </div>

            {/* Allergens */}
            {recipe.allergens && recipe.allergens.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="p-6 bg-error/5 rounded-3xl border border-error/10"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="w-5 h-5 text-error" />
                        <span className="text-nano font-black uppercase text-error tracking-[0.3em]">{t('kitchen.recipeDetail.allergenAlerts')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {recipe.allergens.map((a: string) => (
                            <span key={a} className="px-3 py-1.5 rounded-xl border text-micro font-black text-error uppercase tracking-wider shadow-sm transition-colors bg-surface-card/40 border-error/20">
                                {a}
                            </span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Cost + margin badge */}
            <RecipeCostBadge recipe={recipe} />
        </div>
    );
}
