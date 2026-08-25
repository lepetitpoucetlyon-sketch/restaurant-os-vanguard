"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Utensils, 
  ShoppingBag, 
  ArrowRight, 
  CheckCircle2, 
  Plus, 
  Minus, 
  Sparkles, 
  CreditCard,
  RotateCcw,
  Coffee,
  Pizza,
  Wine
} from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { useProducts, useCategories } from "@/modules/logistics";
import { formatCurrency } from "@/lib/formatters";
import type { Product } from "@nexus/contracts";

interface CartItem {
  product: Product;
  quantity: number;
}

export function KioskPage() {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();

  const [diningOption, setDiningOption] = useState<'dine-in' | 'takeaway' | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderStep, setOrderStep] = useState<'welcome' | 'menu' | 'checkout' | 'success'>('welcome');

  const activeCategory = selectedCategoryId || categories[0]?.id || '';

  const filteredProducts = useMemo(() => {
    if (!activeCategory) return products;
    return products.filter((p) => p.categoryId === activeCategory);
  }, [products, activeCategory]);

  const totalCents = useMemo(() => {
    return cart.reduce((sum, item) => sum + ((item.product.priceInMicrounits || 0) / 10_000) * item.quantity, 0);
  }, [cart]);

  const totalItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter((item): item is CartItem => item !== null)
    );
  };

  const handleReset = () => {
    setCart([]);
    setDiningOption(null);
    setOrderStep('welcome');
  };

  if (orderStep === 'welcome') {
    return (
      <div className="h-screen w-full bg-surface-bg flex flex-col items-center justify-center p-8 text-center select-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-xl w-full space-y-12"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-action-primary/10 border border-action-primary/30 flex items-center justify-center text-action-primary shadow-2xl">
            <Sparkles className="w-12 h-12" />
          </div>

          <div>
            <h1 className="text-4xl md:text-6xl font-serif font-black text-text-primary tracking-tight">
              Bienvenue
            </h1>
            <p className="text-text-muted mt-3 text-lg font-medium">
              Commandez sur borne autonome en quelques instants.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <button
              onClick={() => { setDiningOption('dine-in'); setOrderStep('menu'); }}
              className="p-8 rounded-3xl bg-surface-card border border-border-default hover:border-action-primary hover:bg-action-primary/5 active:scale-95 transition-all flex flex-col items-center gap-4 group shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-bg flex items-center justify-center text-action-primary group-hover:scale-110 transition-transform">
                <Utensils className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold text-text-primary">Sur Place</span>
            </button>

            <button
              onClick={() => { setDiningOption('takeaway'); setOrderStep('menu'); }}
              className="p-8 rounded-3xl bg-surface-card border border-border-default hover:border-action-primary hover:bg-action-primary/5 active:scale-95 transition-all flex flex-col items-center gap-4 group shadow-xl"
            >
              <div className="w-16 h-16 rounded-2xl bg-surface-bg flex items-center justify-center text-action-primary group-hover:scale-110 transition-transform">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <span className="text-xl font-bold text-text-primary">À Emporter</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (orderStep === 'success') {
    return (
      <div className="h-screen w-full bg-surface-bg flex flex-col items-center justify-center p-8 text-center select-none">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full p-8 rounded-3xl bg-surface-card border border-action-primary/30 space-y-6 shadow-2xl"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-status-success/10 text-status-success flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-serif font-bold text-text-primary">Commande Validée !</h2>
          <p className="text-sm text-text-muted">
            Votre commande est envoyée directement en cuisine. Merci de récupérer votre ticket.
          </p>
          <div className="p-4 rounded-2xl bg-surface-bg border border-border-default">
            <span className="text-xs text-text-muted uppercase font-bold">Numéro de Commande</span>
            <p className="text-4xl font-serif font-black text-action-primary mt-1">#{Math.floor(100 + Math.random() * 900)}</p>
          </div>
          <button
            onClick={handleReset}
            className="w-full py-4 rounded-2xl bg-action-primary text-text-on-primary font-bold text-sm shadow-xl active:scale-95 transition-all"
          >
            Nouvelle Commande
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-surface-bg flex overflow-hidden select-none">
      {/* Category Sidebar */}
      <div className="w-64 bg-surface-card border-r border-border-default flex flex-col p-4 shrink-0 justify-between">
        <div className="space-y-2">
          <div className="p-3 mb-4 rounded-2xl bg-surface-bg border border-border-default flex items-center justify-between">
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              {diningOption === 'dine-in' ? '🍽️ Sur Place' : '🛍️ À Emporter'}
            </span>
            <button onClick={handleReset} className="text-text-muted hover:text-text-primary p-1">
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all text-left",
                  isActive
                    ? "bg-action-primary text-text-on-primary shadow-lg shadow-action-primary/20"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-bg"
                )}
              >
                <Utensils className="w-4 h-4 shrink-0" />
                <span className="truncate">{cat.name}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 rounded-2xl bg-surface-bg border border-border-default text-center">
          <span className="text-nano uppercase font-bold text-text-muted">Borne Active</span>
          <p className="text-xs font-bold text-text-primary mt-0.5">Kiosk #1</p>
        </div>
      </div>

      {/* Product Catalog Grid */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 elegant-scrollbar">
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id);
            const price = (product.priceInMicrounits || 0) / 10_000;
            return (
              <div
                key={product.id}
                onClick={() => handleAddToCart(product)}
                className="bg-surface-card border border-border-default rounded-3xl p-4 flex flex-col justify-between hover:border-action-primary/40 cursor-pointer active:scale-98 transition-all group shadow-sm"
              >
                <div className="space-y-2">
                  <div className="w-full h-32 rounded-2xl bg-surface-bg border border-border-default flex items-center justify-center text-text-muted group-hover:scale-[1.02] transition-transform overflow-hidden">
                    <Pizza className="w-12 h-12 text-action-primary/60" />
                  </div>
                  <h3 className="font-bold text-sm text-text-primary line-clamp-2">{product.name}</h3>
                  <p className="text-xs text-text-muted line-clamp-2">{product.description || "Ingrédients frais & recette maison"}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-default">
                  <span className="font-mono font-bold text-action-primary text-base">
                    {formatCurrency(price)}
                  </span>
                  {inCart ? (
                    <div className="flex items-center gap-2 bg-action-primary/10 rounded-xl p-1 text-action-primary">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(product.id, -1); }}
                        className="p-1 hover:bg-action-primary/20 rounded-lg"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-xs px-1">{inCart.quantity}</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleUpdateQuantity(product.id, 1); }}
                        className="p-1 hover:bg-action-primary/20 rounded-lg"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-xl bg-action-primary text-text-on-primary flex items-center justify-center shadow-md">
                      <Plus className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cart Summary Panel */}
      <div className="w-80 bg-surface-card border-l border-border-default flex flex-col p-6 shrink-0 justify-between">
        <div>
          <div className="flex items-center justify-between border-b border-border-default pb-4 mb-4">
            <h2 className="font-serif font-black text-xl text-text-primary">Mon Panier</h2>
            <span className="px-2.5 py-1 rounded-full bg-action-primary/10 text-action-primary text-xs font-bold">
              {totalItemsCount} articles
            </span>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[50vh] pr-1 elegant-scrollbar">
            {cart.map((item) => (
              <div key={item.product.id} className="p-3 rounded-2xl bg-surface-bg border border-border-default flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-2">
                  <h4 className="font-bold text-xs text-text-primary truncate">{item.product.name}</h4>
                  <span className="font-mono text-xs text-action-primary">
                    {formatCurrency(((item.product.priceInMicrounits || 0) / 10_000) * item.quantity)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleUpdateQuantity(item.product.id, -1)}
                    className="w-6 h-6 rounded-lg bg-surface-card border border-border-default flex items-center justify-center text-text-muted"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="font-bold text-xs px-1">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.product.id, 1)}
                    className="w-6 h-6 rounded-lg bg-surface-card border border-border-default flex items-center justify-center text-text-muted"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="py-12 text-center text-text-muted text-xs italic">
                Votre panier est vide.
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-border-default space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-text-muted">Total TTC</span>
            <span className="text-2xl font-serif font-black text-text-primary">
              {formatCurrency(totalCents)}
            </span>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setOrderStep('success')}
            className="w-full py-4 rounded-2xl bg-action-primary text-text-on-primary font-bold text-base shadow-xl flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95 transition-all"
          >
            <CreditCard className="w-5 h-5" />
            <span>Payer sur TPE</span>
          </button>
        </div>
      </div>
    </div>
  );
}
