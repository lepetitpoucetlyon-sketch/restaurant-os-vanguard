"use client";

import React from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";

interface ProductFooterBarProps {
  quantity: number;
  totalInMicrounits: number;
  isValid: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
  onAdd: () => void;
  t: (key: string) => string;
}

export function ProductFooterBar({
  quantity,
  totalInMicrounits,
  isValid,
  onDecrement,
  onIncrement,
  onAdd,
  t,
}: ProductFooterBarProps) {
  return (
    <div className="p-10 border-t border-border/40 bg-surface-glass backdrop-blur-xl flex items-center justify-between gap-10 transition-colors relative flex-shrink-0">
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent-gold/20 to-transparent" />

      {/* Quality Selective Counter */}
      <div className="flex items-center gap-6 bg-surface-card dark:bg-surface-card/5 px-6 py-2.5 rounded-full border border-border/40 shadow-sm">
        <button
          onClick={onDecrement}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-accent-gold transition-all"
        >
          <Minus className="w-5 h-5" strokeWidth={1} />
        </button>
        <span className="text-2xl font-serif italic font-black text-text-primary min-w-[30px] text-center">
          {quantity}
        </span>
        <button
          onClick={onIncrement}
          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-accent-gold transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={1} />
        </button>
      </div>

      {/* Master Action Button */}
      <button
        disabled={!isValid}
        onClick={onAdd}
        className="flex-1 h-20 bg-action-primary hover:bg-action-primary-hover text-text-on-primary rounded-full shadow-premium flex items-center justify-between px-10 transition-all active:scale-[0.98] group relative overflow-hidden"
      >
        <div className="flex items-center gap-8">
          <ShoppingCart className="w-6 h-6 text-text-on-primary" strokeWidth={1.5} />
          <div className="flex flex-col items-start translate-y-[1px]">
            <span className="text-nano font-black uppercase tracking-[0.3em] text-text-on-primary/70 leading-none mb-1">
              {t('pos.details.add_to')}
            </span>
            <span className="text-[13px] font-black uppercase tracking-[0.3em] text-text-on-primary leading-none">
              {t('pos.details.archive')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-8 h-full">
          <div className="w-px h-8 bg-white/20" />
          <span className="text-2xl font-sans font-black tracking-tight text-text-on-primary">
            {(totalInMicrounits / 1_000_000).toFixed(2)}€
          </span>
        </div>
      </button>
    </div>
  );
}
