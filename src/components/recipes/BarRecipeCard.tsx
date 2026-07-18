'use client';

/**
 * BarRecipeCard — cui-3
 * Minimal card for cocktail / bar recipes.
 * Renders bar-specific fields: baseSpirit, mixers, garnish, servingMethod, glassType.
 */

import { Wine, GlassWater, Layers, RotateCcw, Droplets, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/ui.foundations';
import type { Recipe } from '@nexus/contracts';
import { cinematicItem } from '@/lib/motion';
import type { ComponentType, SVGProps } from 'react';

// ─── Serving method metadata ─────────────────────────────────────────────────

type ServingMethod = 'shaken' | 'stirred' | 'built' | 'blended' | 'layered';

const SERVING_LABELS: Record<ServingMethod, string> = {
  shaken: 'Shaké',
  stirred: 'Remué',
  built: 'Construit',
  blended: 'Mixé',
  layered: 'En couches',
};

type LucideProps = SVGProps<SVGSVGElement> & { strokeWidth?: number };
type IconComponent = ComponentType<LucideProps>;

const SERVING_ICONS: Record<ServingMethod, IconComponent> = {
  shaken: RotateCcw,
  stirred: Layers,
  built: GlassWater,
  blended: Droplets,
  layered: Layers,
};

function resolveServingLabel(method: string | undefined): string | null {
  if (!method) return null;
  return SERVING_LABELS[method as ServingMethod] ?? method;
}

function resolveServingIcon(method: string | undefined): IconComponent {
  if (!method) return GlassWater;
  return SERVING_ICONS[method as ServingMethod] ?? GlassWater;
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface BarRecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  className?: string;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BarRecipeCard({ recipe, onClick, className }: BarRecipeCardProps) {
  const servingLabel = resolveServingLabel(recipe.servingMethod as string | undefined);
  const ServingIcon = resolveServingIcon(recipe.servingMethod as string | undefined);
  const mixers = (recipe.mixers || []) as string[];
  const categoryLabel = recipe.category?.toUpperCase() ?? 'BAR';

  return (
    <motion.div
      variants={cinematicItem}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={cn(
        'group bg-bg-secondary rounded-2xl border border-border shadow-sm',
        'hover:shadow-xl hover:shadow-accent/5 transition-all duration-500 cursor-pointer overflow-hidden p-6',
        className,
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Wine className="w-4 h-4 text-accent shrink-0" strokeWidth={1.5} />
            <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em]">
              {categoryLabel}
            </span>
          </div>
          <h3 className="font-serif font-semibold text-xl text-text-primary tracking-tight group-hover:text-accent transition-colors truncate">
            {String(recipe.name)}
          </h3>
        </div>

        {servingLabel && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 rounded-xl border border-accent/20 shrink-0 ml-3">
            <ServingIcon className="w-3 h-3 text-accent" strokeWidth={1.5} />
            <span className="text-[9px] font-black text-accent uppercase tracking-wider">
              {servingLabel}
            </span>
          </div>
        )}
      </div>

      {/* ── Base spirit ── */}
      {recipe.baseSpirit && (
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5 text-text-muted shrink-0" strokeWidth={1.5} />
          <span className="text-[9px] font-black text-text-muted uppercase tracking-widest">
            Base
          </span>
          <span className="text-[12px] font-bold text-text-primary">{String(recipe.baseSpirit)}</span>
        </div>
      )}

      {/* ── Mixers ── */}
      {mixers.length > 0 && (
        <div className="mb-4">
          <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-2">
            Mixeurs
          </span>
          <div className="flex flex-wrap gap-1.5">
            {mixers.map((mixer, i) => (
              <span
                key={i}
                className="px-2.5 py-1 bg-bg-tertiary/60 border border-border/50 rounded-lg text-[10px] font-bold text-text-muted"
              >
                {mixer}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ── Garnish + Glass ── */}
      {(recipe.garnish || recipe.glassType) && (
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-border/40">
          {recipe.garnish && (
            <div>
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">
                Garniture
              </span>
              <span className="text-[11px] font-bold text-text-primary">
                {String(recipe.garnish)}
              </span>
            </div>
          )}
          {recipe.glassType && (
            <div>
              <span className="text-[9px] font-black text-text-muted uppercase tracking-widest block mb-1">
                Verre
              </span>
              <div className="flex items-center gap-1.5">
                <GlassWater className="w-3 h-3 text-text-muted" strokeWidth={1.5} />
                <span className="text-[11px] font-bold text-text-primary">
                  {String(recipe.glassType)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Footer ── */}
      <div className="mt-4 pt-3 border-t border-border/30">
        <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
          {(recipe.ingredients || []).length} ingrédient
          {(recipe.ingredients || []).length !== 1 ? 's' : ''}
          {(recipe.prepTime || recipe.preparationTimeMinutes)
            ? ` • ${recipe.prepTime ?? recipe.preparationTimeMinutes} min`
            : ''}
        </span>
      </div>
    </motion.div>
  );
}
