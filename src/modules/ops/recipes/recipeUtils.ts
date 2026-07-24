'use client';

/**
 * recipeUtils.ts — Shared computation helpers for recipe financials & scaling.
 * Conventions: all monetary values in MICROUNITS (1€ = 1_000_000 µ).
 */

import type { Recipe, RecipeIngredient } from '@nexus/contracts';

export const MICROUNITS_PER_EURO = 1_000_000;
export const MICROUNITS_PER_CENT = 10_000; // 1 cent = 10 000 µ

// ─── Formatting helpers ──────────────────────────────────────────────────────

export function formatMicrounits(µ: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(µ / MICROUNITS_PER_EURO);
}

// ─── Ingredient line cost ────────────────────────────────────────────────────

/**
 * Returns the unit cost of one recipe ingredient line in microunits.
 * costInMicrounits / costInCents are assumed to be UNIT costs (per unit of measure).
 */
export function ingredientUnitCostInMu(ing: RecipeIngredient): number {
  if (ing.costInMicrounits != null) return Number(ing.costInMicrounits);
  if (ing.costInCents != null) return Number(ing.costInCents) * MICROUNITS_PER_CENT;
  if (ing.cost != null) return Number(ing.cost) * MICROUNITS_PER_CENT;
  return 0;
}

/** Total cost of one ingredient line = quantity × unit cost (in µ) */
export function ingredientLineCostInMu(ing: RecipeIngredient): number {
  return Number(ing.quantity || 0) * ingredientUnitCostInMu(ing);
}

// ─── Recipe food cost ────────────────────────────────────────────────────────

/** Sum of all ingredient line costs for a recipe (in µ). */
export function computeRecipeFoodCostInMu(recipe: Recipe): number {
  return (recipe.ingredients || []).reduce(
    (sum, ing) => sum + ingredientLineCostInMu(ing),
    0,
  );
}

/** Sale price from recipe in µ (prefers microunits field, falls back to cents). */
export function recipeSalePriceInMu(recipe: Recipe): number {
  if (recipe.sellingPriceInMicrounits != null) return Number(recipe.sellingPriceInMicrounits);
  if (recipe.sellingPriceInCents != null) return Number(recipe.sellingPriceInCents) * MICROUNITS_PER_CENT;
  return 0;
}

/** Food-cost percentage (0-100). null when sale price is zero. */
export function foodCostPct(foodCostMu: number, salePriceMu: number): number | null {
  if (salePriceMu <= 0) return null;
  return (foodCostMu / salePriceMu) * 100;
}

/** Gross-margin percentage (0-100). null when sale price is zero. */
export function marginPct(foodCostMu: number, salePriceMu: number): number | null {
  if (salePriceMu <= 0) return null;
  return ((salePriceMu - foodCostMu) / salePriceMu) * 100;
}

/** Recommended minimum sale price for a given food-cost target (in µ). */
export function minPriceForFoodCostTarget(
  foodCostMu: number,
  targetPct: number = 0.30,
): number | null {
  if (foodCostMu <= 0 || targetPct <= 0) return null;
  return foodCostMu / targetPct;
}

// ─── Scaling helpers ─────────────────────────────────────────────────────────

export interface SmartQuantity {
  value: string;
  unit: string;
}

/** Converts large quantities to a more readable unit (g→kg, ml→L). */
export function smartQuantity(rawQty: number, rawUnit: string): SmartQuantity {
  const qty = Math.abs(rawQty);

  if ((rawUnit === 'g' || rawUnit === 'gr') && qty >= 1000) {
    const kg = rawQty / 1000;
    return { value: (Number.isInteger(kg * 100) ? kg.toFixed(kg % 1 === 0 ? 0 : 2) : kg.toFixed(2)), unit: 'kg' };
  }
  if (rawUnit === 'ml' && qty >= 1000) {
    const l = rawQty / 1000;
    return { value: (l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)), unit: 'L' };
  }
  if (rawUnit === 'cl' && qty >= 100) {
    const l = rawQty / 100;
    return { value: (l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)), unit: 'L' };
  }
  const displayQty = rawQty % 1 === 0 ? rawQty.toFixed(0) : rawQty.toFixed(2);
  return { value: displayQty, unit: rawUnit };
}

/**
 * Scales ingredient quantity from basePortions to newPortions.
 * Returns a SmartQuantity with human-friendly unit.
 */
export function scaleIngredient(
  ing: RecipeIngredient,
  basePortions: number,
  newPortions: number,
): SmartQuantity {
  const base = Math.max(1, basePortions);
  const scaled = Number(ing.quantity || 0) * (newPortions / base);
  return smartQuantity(scaled, ing.unit);
}
