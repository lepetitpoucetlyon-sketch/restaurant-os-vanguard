'use client';

/**
 * RecipeCostBadge — cui-1
 * Shows food cost, margin %, and recommended minimum price for a recipe.
 * Color thresholds: red >35%, amber 25-35%, green <25% food-cost ratio.
 */

import { TrendingUp, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { Recipe } from '@nexus/contracts';
import {
  computeRecipeFoodCostInMu,
  recipeSalePriceInMu,
  foodCostPct,
  marginPct,
  minPriceForFoodCostTarget,
  formatMicrounits,
} from './recipeUtils';

// ─── Color helpers ────────────────────────────────────────────────────────────

function getCostColorClass(pct: number | null): string {
  if (pct == null) return 'text-text-muted';
  if (pct > 35) return 'text-error';
  if (pct > 25) return 'text-warning';
  return 'text-success';
}

function getCostBgClass(pct: number | null): string {
  if (pct == null) return 'bg-bg-tertiary/30';
  if (pct > 35) return 'bg-error/10';
  if (pct > 25) return 'bg-warning/10';
  return 'bg-success/10';
}

function getCostBorderClass(pct: number | null): string {
  if (pct == null) return 'border-border/40';
  if (pct > 35) return 'border-error/20';
  if (pct > 25) return 'border-warning/20';
  return 'border-success/20';
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RecipeCostBadgeProps {
  recipe: Recipe;
  className?: string;
  /** Compact single-line mode for use inside recipe cards. */
  compact?: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RecipeCostBadge({ recipe, className, compact = false }: RecipeCostBadgeProps) {
  const saleMu = recipeSalePriceInMu(recipe);
  const foodCostMu = computeRecipeFoodCostInMu(recipe);

  // Nothing to show if no ingredient costs defined
  if (foodCostMu <= 0) return null;

  const costPct = foodCostPct(foodCostMu, saleMu);
  const mrgPct = marginPct(foodCostMu, saleMu);
  const minPrice = minPriceForFoodCostTarget(foodCostMu, 0.30);

  const colorClass = getCostColorClass(costPct);
  const bgClass = getCostBgClass(costPct);
  const borderClass = getCostBorderClass(costPct);

  // ── Compact variant ───────────────────────────────────────────────────────
  if (compact) {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        {costPct != null && costPct > 35 ? (
          <AlertTriangle className={cn('w-3 h-3', colorClass)} strokeWidth={2} />
        ) : (
          <TrendingUp className={cn('w-3 h-3', colorClass)} strokeWidth={2} />
        )}
        <span className={cn('text-[10px] font-black uppercase tracking-wider', colorClass)}>
          Coût: {formatMicrounits(foodCostMu)}
          {costPct != null && ` (${costPct.toFixed(0)}%)`}
        </span>
      </div>
    );
  }

  // ── Full variant ──────────────────────────────────────────────────────────
  return (
    <div className={cn('rounded-xl border p-4 space-y-2.5', bgClass, borderClass, className)}>
      {/* Food cost row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {costPct != null && costPct > 35 ? (
            <AlertTriangle className={cn('w-3.5 h-3.5', colorClass)} strokeWidth={2} />
          ) : (
            <TrendingUp className={cn('w-3.5 h-3.5', colorClass)} strokeWidth={2} />
          )}
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            Coût matière
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn('text-[12px] font-mono font-black', colorClass)}>
            {formatMicrounits(foodCostMu)}
          </span>
          {costPct != null && (
            <span
              className={cn(
                'px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border',
                bgClass,
                colorClass,
                borderClass,
              )}
            >
              {costPct.toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* Margin row */}
      {mrgPct != null && (
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
            Marge brute
          </span>
          <span className={cn('text-[11px] font-mono font-black', colorClass)}>
            {mrgPct.toFixed(0)}%
          </span>
        </div>
      )}

      {/* Recommended price row */}
      {minPrice != null && (
        <div className="flex items-center justify-between pt-2 border-t border-border/30">
          <div className="flex items-center gap-1.5">
            <Info className="w-3 h-3 text-text-muted" strokeWidth={2} />
            <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
              Prix mini (30%)
            </span>
          </div>
          <span className="text-[11px] font-mono font-black text-text-primary">
            {formatMicrounits(minPrice)}
          </span>
        </div>
      )}
    </div>
  );
}
