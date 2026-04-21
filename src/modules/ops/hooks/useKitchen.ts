"use client";

import { useCallback } from "react";
import { useAtomValue } from "jotai";
import { 
    recipesNodeAtom, 
    prepTasksNodeAtom, 
    miseEnPlaceTargetSelector,
    stockItemsNodeAtom
} from "@/store/operationalAtoms";
import { Recipe, StockItem } from "@/types";
import { useNexusMutation } from "@/shared/hooks/useNexusMutation";
import { useVisibilityPurge } from "@/hooks/useVisibilityPurge";

/**
 * 👨‍🍳 useKitchen - Grade VI Atomic Bridge
 * Pilotage de la production culinaire et de l'ingénierie des menus.
 */
export function useKitchen() {
    useVisibilityPurge('recipes');
    const recipesNode = useAtomValue(recipesNodeAtom);
    const prepTasksNode = useAtomValue(prepTasksNodeAtom);
    const miseEnPlaceTarget = useAtomValue(miseEnPlaceTargetSelector);
    const stockItemsNode = useAtomValue(stockItemsNodeAtom);

    // --- 🔨 LA FORGE ---
    const recipeForge = useNexusMutation<Recipe>(recipesNodeAtom, 'recipes', 'KITCHEN');
    const prepForge = useNexusMutation<any>(prepTasksNodeAtom, 'prepTasks', 'KITCHEN');

    const calculateRecipeCost = useCallback((recipeIngredients: { ingredientId: string; quantity: number }[]) => {
        if (!recipeIngredients) return 0;
        return recipeIngredients.reduce((total, ri) => {
            const ingredient = (stockItemsNode.data || []).find((i: StockItem) => i.id === ri.ingredientId);
            const cost = ingredient?.costInCents || ingredient?.unitCostInCents || 0;
            return total + (cost * ri.quantity);
        }, 0);
    }, [stockItemsNode.data]);

    return { 
        data: recipesNode.data || [], 
        recipes: recipesNode.data || [],
        isLoading: recipesNode.loading, 
        error: recipesNode.error,
        prepTasks: prepTasksNode.data || [],
        isPrepLoading: prepTasksNode.loading,
        miseEnPlaceTarget,
        
        // --- Forge Actions ---
        addRecipe: (data: Partial<Recipe>) => recipeForge.mutate('SET', `rec_${Date.now()}`, data),
        updateRecipe: (id: string, data: Partial<Recipe>) => recipeForge.mutate('UPDATE', id, data),
        deleteRecipe: (id: string) => recipeForge.mutate('DELETE', id, {}),
        togglePrepTask: (id: string, completed: boolean) => prepForge.mutate('UPDATE', id, { completed }),
        
        calculateRecipeCost
    };
}

// Alias for legacy support
export const useRecipes = useKitchen;
