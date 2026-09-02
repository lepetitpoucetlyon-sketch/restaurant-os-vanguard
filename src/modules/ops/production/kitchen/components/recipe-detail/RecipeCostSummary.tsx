"use client";

import { useMemo } from "react";
import type { Recipe } from "@nexus/contracts";
import { RecipeBOMCostService } from "../../../kds/services/RecipeBOMCostService";
import { cn } from "@/lib/ui.foundations";

interface Props {
    recipe: Recipe;
    /** Portions affichées (le coût est ramené à 1 portion). */
    currentPortions: number;
}

const fmtEur = (mu: number) => `${(mu / 1_000_000).toFixed(2)} €`;

/**
 * Coût matière live d'une portion — RecipeBOMCostService.computeDishFoodCost
 * (BOM valorisée au prix d'achat courant) + ratio food-cost et marge brute.
 */
export function RecipeCostSummary({ recipe, currentPortions }: Props) {
    const analysis = useMemo(() => {
        const sellingTtc = recipe.sellingPriceInMicrounits
            ?? (recipe.sellingPriceInCents ?? 0) * 10_000;
        if (sellingTtc <= 0) return null;
        const basePortions = Math.max(1, recipe.portions ?? 1);
        const scale = currentPortions / basePortions;
        return RecipeBOMCostService.computeDishFoodCost({
            dishId: String(recipe.id),
            dishName: recipe.name,
            sellingPriceTtcInMicrounits: sellingTtc,
            taxRate: "0.10",
            ingredients: (recipe.ingredients ?? []).map(ing => ({
                ingredientId: ing.ingredientId || ing.name,
                ingredientName: ing.name,
                quantityRequired: (ing.quantity || 0) / (currentPortions > 0 ? currentPortions : 1) * scale,
                unitPriceInMicrounits: ing.costInMicrounits ?? (ing.costInCents ?? 0) * 10_000,
            })),
        });
    }, [recipe, currentPortions]);

    if (!analysis) {
        return (
            <p className="text-nano text-text-muted italic">
                Prix de vente non renseigné — coût matière indisponible.
            </p>
        );
    }

    return (
        <div className="space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-text-muted">Coût matière / portion</span>
                <span className="tabular-nums font-medium text-text-primary">{fmtEur(analysis.foodCostInMicrounits)}</span>
            </div>
            <div className="flex justify-between text-sm">
                <span className="text-text-muted">Marge brute HT</span>
                <span className="tabular-nums font-medium text-text-primary">{fmtEur(analysis.grossMarginInMicrounits)}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-text-muted">Ratio food-cost</span>
                <span
                    className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
                        analysis.isFoodCostProfitable
                            ? "bg-status-success/15 text-status-success"
                            : "bg-error/15 text-error",
                    )}
                >
                    {analysis.foodCostRatioPct}%
                </span>
            </div>
        </div>
    );
}
