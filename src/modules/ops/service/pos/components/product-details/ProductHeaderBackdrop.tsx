"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Product } from "@nexus/contracts";

interface ProductHeaderBackdropProps {
  product: Product;
  priceMultiplier: number;
  t: (key: string) => string;
  onClose: () => void;
}

export function ProductHeaderBackdrop({
  product,
  priceMultiplier,
  t,
  onClose,
}: ProductHeaderBackdropProps) {
  return (
    <div className="relative h-40 md:h-52 bg-bg-tertiary overflow-hidden flex-shrink-0 transition-colors">
      <div className="absolute inset-0">
        {product.image ? (
          <img
            src={`/images/${product.image}.png`}
            alt={product.name}
            className="w-full h-full object-cover blur-[2px] scale-105 opacity-40 transition-transform duration-1000 group-hover:scale-110"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80';
            }}
          />
        ) : (
          <div className={cn("absolute inset-0 opacity-20", product.color)} />
        )}
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-bg-secondary via-bg-secondary/40 to-transparent" />

      {/* Visual Gold Glow */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-accent-gold/10 blur-[100px] pointer-events-none" />

      <div className="absolute bottom-8 left-8 md:left-12 right-8 md:right-12 flex justify-between items-end">
        <div className="min-w-0 max-w-2xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-accent-gold" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent-gold">
              {t('pos.details.selection')}
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-serif font-black text-text-primary tracking-tighter italic leading-tight">
            {product.name}
          </h2>
          <p className="text-text-muted text-sm md:text-base font-serif italic mt-3 line-clamp-2 opacity-80 leading-relaxed max-wxl">
            {product.description || t('pos.fallback_description')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-3xl md:text-3xl font-serif font-black text-accent-gold italic drop-shadow-sm">
            {((product.priceInMicrounits / 1_000_000) * priceMultiplier).toFixed(2)}€
          </span>
          <div className="flex items-center gap-3 bg-surface-card/5 rounded-full p-1 border border-subtle">
            <button
              onClick={onClose}
              className="w-12 h-12 bg-surface-card/10 dark:bg-surface-sidebar/20 hover:bg-accent-gold hover:text-text-primary backdrop-blur-xl rounded-2xl flex items-center justify-center text-text-primary transition-all border border-subtle shadow-premium group"
            >
              <X className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
