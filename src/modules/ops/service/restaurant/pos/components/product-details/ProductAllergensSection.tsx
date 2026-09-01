"use client";

import React from "react";
import { AlertTriangle, Plus, Check } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { COMMON_ALLERGENS } from "./allergensConstants";

interface ProductAllergensSectionProps {
  selectedAllergens: string[];
  customAllergen: string;
  showAllergenInput: boolean;
  onToggleAllergen: (id: string) => void;
  onChangeCustomAllergen: (val: string) => void;
  onAddCustomAllergen: () => void;
  onOpenAllergenInput: () => void;
  t: (key: string) => string;
}

export function ProductAllergensSection({
  selectedAllergens,
  customAllergen,
  showAllergenInput,
  onToggleAllergen,
  onChangeCustomAllergen,
  onAddCustomAllergen,
  onOpenAllergenInput,
  t,
}: ProductAllergensSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          <AlertTriangle className="w-5 h-5 text-accent-gold" />
          <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-[0.3em]">
            {t('pos.details.allergens')}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        {COMMON_ALLERGENS.map(allergen => {
          const isSelected = selectedAllergens.includes(allergen.id);
          return (
            <button
              key={allergen.id}
              onClick={() => onToggleAllergen(allergen.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all text-left group",
                isSelected
                  ? "border-red-500/50 bg-status-danger/5 text-status-danger dark:text-status-danger shadow-sm"
                  : "border-border bg-bg-tertiary/40 hover:border-red-500/30 text-text-secondary"
              )}
            >
              <span className="text-xl group-hover:scale-125 transition-transform">{allergen.icon}</span>
              <span className="text-[12px] font-black uppercase tracking-tight truncate">
                {t(`allergens.${allergen.id}`)}
              </span>
              {isSelected && <Check className="w-3.5 h-3.5 ml-auto text-status-danger shrink-0" />}
            </button>
          );
        })}
      </div>

      {showAllergenInput ? (
        <div className="flex items-center gap-3 px-1">
          <input
            type="text"
            placeholder={t('pos.details.allergen_placeholder')}
            value={customAllergen}
            onChange={(e) => onChangeCustomAllergen(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAddCustomAllergen()}
            className="flex-1 px-5 py-3.5 bg-bg-tertiary border border-border rounded-2xl text-sm text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 transition-all"
            autoFocus
          />
          <button aria-label="Ajouter"
            onClick={onAddCustomAllergen}
            disabled={!customAllergen.trim()}
            className="p-3.5 bg-accent-gold text-text-primary rounded-2xl transition-all shadow-premium disabled:opacity-30"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <button
          onClick={onOpenAllergenInput}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-bg-tertiary/40 hover:bg-bg-tertiary transition-all border border-dashed border-border rounded-[24px] text-micro font-black uppercase tracking-[0.2em] text-text-muted hover:text-accent-gold"
        >
          <Plus className="w-4 h-4" />
          {t('pos.details.add_custom_allergen')}
        </button>
      )}
    </div>
  );
}
