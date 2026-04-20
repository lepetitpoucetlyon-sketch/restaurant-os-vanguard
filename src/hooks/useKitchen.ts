// @ts-nocheck
// @ts-nocheck
"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { 
    recipesNodeAtom, 
    prepTasksNodeAtom, 
    miseEnPlaceTargetSelector,
    tenantIdAtom,
    stockItemsNodeAtom
} from "@/store/operationalAtoms";
import { upsertRecipeAction, deleteRecipeAction, togglePrepTaskAction } from "@/app/actions/kitchen";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";

/**
 * 👨‍🍳 useKitchen - Grade VI Atomic Bridge
 * Pilotage de la production culinaire et de l'ingénierie des menus.
 */
export function useKitchen() {
    useVisibilityPurge('recipes');
    const recipes = useAtomValue(recipesNodeAtom);
    const prepTasks = useAtomValue(prepTasksNodeAtom);
    const miseEnPlaceTarget = useAtomValue(miseEnPlaceTargetSelector);
    const tenantId = useAtomValue(tenantIdAtom);
    const stockItemsNode = useAtomValue(stockItemsNodeAtom);

    const calculateRecipeCost = useCallback((recipeIngredients: any[]) => {
        if (!recipeIngredients) return 0;
        return recipeIngredients.reduce((total, ri) => {
            const ingredient = (stockItemsNode.data || []).find(i => i.id === ri.ingredientId);
            const cost = ingredient?.costInCents || 0;
            return total + (cost * ri.quantity);
        }, 0);
    }, [stockItemsNode.data]);

    return { 
        data: recipes.data || [], 
        recipes: recipes.data || [],
        isLoading: recipes.loading, 
        error: recipes.error,
        prepTasks: prepTasks.data || [],
        isPrepLoading: prepTasks.loading,
        miseEnPlaceTarget,
        addRecipe: (data: any) => upsertRecipeAction(tenantId, data),
        updateRecipe: (id: string, data: any) => upsertRecipeAction(tenantId, { ...data, id }),
        deleteRecipe: (id: string) => deleteRecipeAction(tenantId, id),
        togglePrepTask: (id: string) => togglePrepTaskAction(tenantId, id),
        calculateRecipeCost
    };
}

// Alias for legacy support
export const useRecipes = useKitchen;
