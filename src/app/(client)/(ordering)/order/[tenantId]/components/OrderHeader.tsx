'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UtensilsCrossed, ShoppingBag, ShieldCheck, Filter, QrCode } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

interface OrderHeaderProps {
  tenantName: string;
  tableNumber: string | null;
  orderMode: 'dine_in' | 'takeaway';
  selectedAllergenFilter: string | null;
  onSelectAllergenFilter: (allergen: string | null) => void;
  availableAllergens: string[];
  activeCategory: string;
  categories: string[];
  onSelectCategory: (cat: string) => void;
}

export function OrderHeader({
  tenantName,
  tableNumber,
  orderMode,
  selectedAllergenFilter,
  onSelectAllergenFilter,
  availableAllergens,
  activeCategory,
  categories,
  onSelectCategory,
}: OrderHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-surface-card/80 backdrop-blur-xl border-b border-border-default px-4 py-3">
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        {/* Top Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {orderMode === 'dine_in' ? <UtensilsCrossed className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-base font-semibold text-text-primary tracking-tight leading-tight">
                {tenantName || 'Restaurant'}
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-text-muted">
                {orderMode === 'dine_in' && tableNumber ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                    <QrCode className="w-3 h-3" /> Table {tableNumber}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded-md border border-blue-500/20">
                    <ShoppingBag className="w-3 h-3" /> Click & Collect
                  </span>
                )}
                <span>• Commande directe</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-text-muted bg-surface-glass px-2.5 py-1 rounded-lg border border-border-default">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Conforme INCO</span>
          </div>
        </div>

        {/* Allergen Filter Pills */}
        {availableAllergens.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-micro text-text-muted flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3 h-3" /> Sans :
            </span>
            <button
              onClick={() => onSelectAllergenFilter(null)}
              className={cn(
                'text-xs px-2.5 py-1 rounded-full shrink-0 transition-all font-medium',
                selectedAllergenFilter === null
                  ? 'bg-amber-500 text-black shadow-sm'
                  : 'bg-surface-glass text-text-secondary hover:bg-surface-glass-hover'
              )}
            >
              Tous
            </button>
            {availableAllergens.map((alg) => (
              <button
                key={alg}
                onClick={() => onSelectAllergenFilter(selectedAllergenFilter === alg ? null : alg)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full shrink-0 transition-all font-medium flex items-center gap-1',
                  selectedAllergenFilter === alg
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-surface-glass text-text-secondary hover:bg-surface-glass-hover'
                )}
              >
                Sans {alg}
              </button>
            ))}
          </div>
        )}

        {/* Category Navigation Bar */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className={cn(
                  'text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-xl font-medium shrink-0 transition-all relative',
                  isActive
                    ? 'text-text-primary font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-surface-glass-hover rounded-xl border border-border-default shadow-sm"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
