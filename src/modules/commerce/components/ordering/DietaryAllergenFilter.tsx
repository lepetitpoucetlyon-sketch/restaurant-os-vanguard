'use client';

import React from 'react';
import { Leaf, Wheat, Milk, Sparkles, Check } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

export type DietaryPreference = 'all' | 'vegetarian' | 'vegan' | 'gluten_free' | 'dairy_free' | 'halal';

interface DietaryAllergenFilterProps {
  activeFilter: DietaryPreference;
  onSelectFilter: (filter: DietaryPreference) => void;
  availableAllergens?: string[];
  selectedExcludedAllergen?: string | null;
  onSelectExcludedAllergen?: (allergen: string | null) => void;
}

const UI_STRINGS = {
  withoutPrefix: "Sans :",
};

const DIETARY_OPTIONS: Array<{ id: DietaryPreference; label: string; icon: React.ElementType }> = [
  { id: 'all', label: 'Tous', icon: Sparkles },
  { id: 'vegetarian', label: 'Végétarien', icon: Leaf },
  { id: 'vegan', label: 'Vegan', icon: Leaf },
  { id: 'gluten_free', label: 'Sans Gluten', icon: Wheat },
  { id: 'dairy_free', label: 'Sans Lactose', icon: Milk },
];

export function DietaryAllergenFilter({
  activeFilter,
  onSelectFilter,
  availableAllergens = [],
  selectedExcludedAllergen = null,
  onSelectExcludedAllergen,
}: DietaryAllergenFilterProps) {
  return (
    <div className="flex flex-col gap-2.5 my-2">
      {/* Régimes alimentaires principaux */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {DIETARY_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeFilter === opt.id;
          return (
            <button
              type="button"
              key={opt.id}
              aria-label={opt.label}
              onClick={() => onSelectFilter(opt.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer",
                isActive
                  ? "bg-action-primary text-text-on-primary shadow-sm scale-102"
                  : "bg-surface-card border border-border-default text-text-secondary hover:text-text-primary hover:border-border-strong"
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", isActive ? "text-text-on-primary" : "text-text-muted")} />
              <span>{opt.label}</span>
              {isActive && opt.id !== 'all' && <Check className="w-3 h-3 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Filtre d'exclusion d'allergènes spécifiques si disponibles */}
      {availableAllergens.length > 0 && onSelectExcludedAllergen && (
        <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-text-muted no-scrollbar">
          <span className="font-medium text-text-secondary whitespace-nowrap">{UI_STRINGS.withoutPrefix}</span>
          {availableAllergens.slice(0, 6).map((allergen) => {
            const isExcluded = selectedExcludedAllergen === allergen;
            return (
              <button
                type="button"
                key={allergen}
                aria-label={`Exclure ${allergen}`}
                onClick={() => onSelectExcludedAllergen(isExcluded ? null : allergen)}
                className={cn(
                  "px-2 py-0.5 rounded-md border transition-all duration-150 cursor-pointer",
                  isExcluded
                    ? "bg-red-500/10 border-red-500/40 text-red-600 font-semibold dark:text-red-400"
                    : "border-border-subtle bg-surface-subtle text-text-muted hover:border-border-default hover:text-text-secondary"
                )}
              >
                {allergen}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
