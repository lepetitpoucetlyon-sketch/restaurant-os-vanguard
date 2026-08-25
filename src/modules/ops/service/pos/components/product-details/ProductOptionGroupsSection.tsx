"use client";

import React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { OptionGroup } from "@nexus/contracts";

interface ProductOptionGroupsSectionProps {
  optionGroups?: OptionGroup[];
  selections: Record<string, string[]>;
  onOptionToggle: (group: OptionGroup, optionId: string) => void;
  t: (key: string) => string;
}

export function ProductOptionGroupsSection({
  optionGroups,
  selections,
  onOptionToggle,
  t,
}: ProductOptionGroupsSectionProps) {
  if (!optionGroups || optionGroups.length === 0) return null;

  return (
    <div className="lg:col-span-12 space-y-12">
      {optionGroups.map(group => (
        <div key={group.id} className="space-y-6">
          <div className="flex items-center justify-between px-2 border-b border-border/50 pb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-xs md:text-sm font-black text-text-primary uppercase tracking-[0.3em] text-center">
                {t(`pos.options.${group.id}`)}
              </h3>
              {group.required && (
                <span className="text-nano font-black bg-accent-gold text-text-primary px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                  {t('pos.details.required')}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-1 h-1 rounded-full bg-border" />
              <span className="text-nano font-black text-text-muted uppercase tracking-widest opacity-60">
                {group.type === 'single'
                  ? t('pos.details.single_choice')
                  : `${t('pos.details.max_selection')}: ${group.maxSelections || '∞'}`}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {group.options.map(option => {
              const isSelected = (selections[group.id] || []).includes(option.id);
              return (
                <button
                  key={option.id}
                  onClick={() => onOptionToggle(group, option.id)}
                  className={cn(
                    "group relative flex items-center justify-between p-5 md:p-6 rounded-[24px] md:rounded-[32px] border transition-all duration-500",
                    isSelected
                      ? "border-accent-gold bg-surface-card dark:bg-surface-card/5 shadow-premium ring-4 ring-accent-gold/5"
                      : "border-border/60 bg-bg-tertiary/40 hover:border-accent-gold/40 hover:bg-bg-tertiary/60"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-xl border flex items-center justify-center transition-all duration-500",
                        isSelected
                          ? "bg-accent-gold border-accent-gold scale-110 shadow-premium"
                          : "border-border/80 bg-surface-card dark:bg-surface-sidebar group-hover:scale-105"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-text-primary" />}
                    </div>
                    <span
                      className={cn(
                        "text-[14px] font-black transition-colors uppercase tracking-tight",
                        isSelected ? "text-text-primary" : "text-text-secondary"
                      )}
                    >
                      {t(`pos.options.${option.id}`)}
                    </span>
                  </div>
                  {option.priceModifierInCents > 0 && (
                    <span
                      className={cn(
                        "text-micro font-serif italic font-bold px-3 py-1 rounded-full transition-all",
                        isSelected
                          ? "bg-accent-gold text-text-primary"
                          : "text-accent-gold bg-accent-gold/10"
                      )}
                    >
                      +{option.priceModifierInCents / 100}€
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
