'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  priceInMicrounits: number;
  description?: string;
  allergens?: string[];
  available: boolean;
  imageUrl?: string;
}

interface OrderProductCardProps {
  product: ProductItem;
  quantityInCart: number;
  onAddToCart: (product: ProductItem) => void;
  onRemoveFromCart: (productId: string) => void;
}

export function OrderProductCard({
  product,
  quantityInCart,
  onAddToCart,
  onRemoveFromCart,
}: OrderProductCardProps) {
  const priceEuros = (product.priceInMicrounits / 1_000_000).toFixed(2);

  return (
    <div
      className={cn(
        'group relative bg-slate-900/60 hover:bg-slate-900/90 border border-white/10 hover:border-white/20 rounded-2xl p-4 transition-all duration-200 flex flex-col justify-between backdrop-blur-sm',
        !product.available && 'opacity-50 pointer-events-none'
      )}
    >
      <div>
        <div className="flex justify-between items-start gap-2 mb-1.5">
          <h3 className="text-sm font-semibold text-white group-hover:text-amber-400 transition-colors">
            {product.name}
          </h3>
          <span className="text-sm font-bold text-amber-400 shrink-0 font-mono">
            {priceEuros} €
          </span>
        </div>

        {product.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mb-2 leading-relaxed">
            {product.description}
          </p>
        )}

        {product.allergens && product.allergens.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {product.allergens.map((alg) => (
              <span
                key={alg}
                className="text-[10px] bg-rose-500/10 text-rose-300 border border-rose-500/20 px-1.5 py-0.5 rounded"
              >
                {alg}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-white/5">
        <span className="text-[11px] text-slate-500">
          {product.available ? 'En stock' : 'Épuisé'}
        </span>

        {quantityInCart > 0 ? (
          <div className="flex items-center gap-2 bg-amber-500/20 border border-amber-500/40 rounded-xl px-2 py-1">
            <button
              onClick={() => onRemoveFromCart(product.id)}
              className="w-6 h-6 rounded-lg bg-amber-500/30 text-amber-300 hover:bg-amber-500/50 flex items-center justify-center font-bold text-xs transition-colors"
            >
              -
            </button>
            <span className="text-xs font-bold text-amber-300 font-mono px-1">
              {quantityInCart}
            </span>
            <button
              onClick={() => onAddToCart(product)}
              className="w-6 h-6 rounded-lg bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center font-bold text-xs transition-colors"
            >
              +
            </button>
          </div>
        ) : (
          <button
            onClick={() => onAddToCart(product)}
            disabled={!product.available}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-amber-500 hover:text-black text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter</span>
          </button>
        )}
      </div>
    </div>
  );
}
