'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight, X, Trash2, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import type { ProductItem } from './OrderProductCard';

export interface CartItemEntry {
  product: ProductItem;
  quantity: number;
  course?: 'entree' | 'plat' | 'dessert' | 'boisson';
  notes?: string;
}

interface OrderCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItemEntry[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onClearCart: () => void;
  onSubmitOrder: () => void;
  isSubmitting: boolean;
  tableNumber: string | null;
  orderMode: 'dine_in' | 'takeaway';
}

export function OrderCartDrawer({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onClearCart,
  onSubmitOrder,
  isSubmitting,
  tableNumber,
  orderMode,
}: OrderCartDrawerProps) {
  const totalInMicrounits = items.reduce(
    (sum, it) => sum + it.product.priceInMicrounits * it.quantity,
    0
  );
  const totalEuros = (totalInMicrounits / 1_000_000).toFixed(2);
  const totalItemsCount = items.reduce((sum, it) => sum + it.quantity, 0);

  if (totalItemsCount === 0 && !isOpen) return null;

  return (
    <>
      {/* Floating Bottom Bar when drawer is closed */}
      {!isOpen && totalItemsCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40"
        >
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-black font-semibold px-5 py-3.5 rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center font-bold text-xs">
                {totalItemsCount}
              </div>
              <span className="text-sm tracking-tight font-bold">Voir mon panier</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold font-mono">{totalEuros} €</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </motion.div>
      )}

      {/* Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity"
            />

            <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                className="w-screen max-w-md bg-slate-950 border-l border-white/10 flex flex-col justify-between shadow-2xl"
              >
                {/* Drawer Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">Mon Panier</h2>
                      <p className="text-xs text-slate-400">
                        {orderMode === 'dine_in' && tableNumber
                          ? `Table ${tableNumber}`
                          : 'Click & Collect à emporter'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Items List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {items.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-sm">
                      Votre panier est vide.
                    </div>
                  ) : (
                    items.map((it) => (
                      <div
                        key={it.product.id}
                        className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-white truncate">
                            {it.product.name}
                          </h4>
                          <span className="text-xs font-mono text-amber-400 font-semibold">
                            {((it.product.priceInMicrounits * it.quantity) / 1_000_000).toFixed(2)} €
                          </span>
                        </div>

                        <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/10">
                          <button
                            onClick={() => onUpdateQuantity(it.product.id, -1)}
                            className="w-6 h-6 rounded bg-white/10 text-white hover:bg-white/20 flex items-center justify-center text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="text-xs font-bold text-white font-mono px-1">
                            {it.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateQuantity(it.product.id, 1)}
                            className="w-6 h-6 rounded bg-amber-500 text-black hover:bg-amber-400 flex items-center justify-center text-xs font-bold"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Drawer Footer */}
                {items.length > 0 && (
                  <div className="p-4 border-t border-white/10 bg-slate-900/50 space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Total TTC</span>
                      <span className="text-xl font-bold font-mono text-amber-400">
                        {totalEuros} €
                      </span>
                    </div>

                    <button
                      onClick={onSubmitOrder}
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Transmission en cuisine...</span>
                        </>
                      ) : (
                        <>
                          <span>Envoyer la commande</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
