import { describe, it, expect } from 'vitest';
import { aggregateRecipeIngredients } from '@/modules/logistics/services/StockEngine';
import type { Recipe } from '@nexus/contracts';

const makeRecipe = (ingredients: { id: string; name: string; quantity: number }[]): Recipe =>
    ({ id: 'r1', name: 'Test Recipe', ingredients } as unknown as Recipe);

describe('aggregateRecipeIngredients', () => {
    it("initialise les ingredients depuis la recette", () => {
        const recipe = makeRecipe([
            { id: 'ing-1', name: 'Farine', quantity: 0.2 },
            { id: 'ing-2', name: 'Sel',    quantity: 0.01 },
        ]);
        const result = aggregateRecipeIngredients(recipe, []);

        expect(result.get('ing-1')).toEqual({ id: 'ing-1', name: 'Farine', quantity: 0.2 });
        expect(result.get('ing-2')).toEqual({ id: 'ing-2', name: 'Sel',    quantity: 0.01 });
    });

    it("modifier add incremente la quantite", () => {
        const recipe = makeRecipe([{ id: 'ing-1', name: 'Mozza', quantity: 0.15 }]);
        const modifiers = [{ action: 'add', ingredientId: 'ing-1', name: 'Mozza extra', quantityImpact: 0.05 }];

        const result = aggregateRecipeIngredients(recipe, modifiers);
        expect(result.get('ing-1')?.quantity).toBeCloseTo(0.2);
    });

    it("modifier remove supprime l'ingredient", () => {
        const recipe = makeRecipe([{ id: 'ing-1', name: 'Anchois', quantity: 0.03 }]);
        const modifiers = [{ action: 'remove', ingredientId: 'ing-1', name: 'Anchois' }];

        const result = aggregateRecipeIngredients(recipe, modifiers);
        expect(result.has('ing-1')).toBe(false);
    });

    it("modifier add sur ingredient inexistant le cree", () => {
        const recipe = makeRecipe([]);
        const modifiers = [{ action: 'add', ingredientId: 'ing-new', name: 'Truffe', quantityImpact: 0.01 }];

        const result = aggregateRecipeIngredients(recipe, modifiers);
        expect(result.get('ing-new')).toEqual({ id: 'ing-new', name: 'Truffe', quantity: 0.01 });
    });

    it("modifier sans ingredientId est ignore", () => {
        const recipe = makeRecipe([{ id: 'ing-1', name: 'Sel', quantity: 0.01 }]);
        const modifiers = [{ action: 'add', name: 'Extra sans id', quantityImpact: 5 }];

        const result = aggregateRecipeIngredients(recipe, modifiers);
        expect(result.size).toBe(1);
    });

    it("recette sans ingredients retourne une Map vide", () => {
        const recipe = makeRecipe([]);
        expect(aggregateRecipeIngredients(recipe, []).size).toBe(0);
    });

    it("plusieurs modifiers s'appliquent dans l'ordre", () => {
        const recipe = makeRecipe([{ id: 'ing-1', name: 'Parmesan', quantity: 0.1 }]);
        const modifiers = [
            { action: 'add',    ingredientId: 'ing-1', name: 'Parmesan', quantityImpact: 0.05 },
            { action: 'remove', ingredientId: 'ing-1', name: 'Parmesan' },
        ];

        const result = aggregateRecipeIngredients(recipe, modifiers);
        expect(result.has('ing-1')).toBe(false);
    });
});
