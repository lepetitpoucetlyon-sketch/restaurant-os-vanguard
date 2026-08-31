'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Utensils, CheckCircle2, Clock } from 'lucide-react';
import { OrderHeader } from './components/OrderHeader';
import { OrderProductCard, type ProductItem } from './components/OrderProductCard';
import { OrderCartDrawer, type CartItemEntry } from './components/OrderCartDrawer';
import { authedFetch } from '@/lib/client/authedFetch';

interface OrderPageProps {
  params: Promise<{ tenantId: string }>;
}

export default function OrderPage({ params }: OrderPageProps) {
  const { tenantId } = use(params);
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');
  const modeParam = searchParams.get('mode') === 'takeaway' ? 'takeaway' : 'dine_in';

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [selectedAllergenFilter, setSelectedAllergenFilter] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItemEntry[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Charger le menu public v1
  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        const res = await authedFetch(`/api/v1/menu?tenantId=${encodeURIComponent(tenantId)}`);
        if (res.ok) {
          const data = await res.json();
          setCategories(data.categories || ['Entrées', 'Plats', 'Desserts', 'Boissons']);
          setProducts(data.products || []);
          if (data.categories?.length > 0) {
            setActiveCategory(data.categories[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load menu', err);
      } finally {
        setLoading(false);
      }
    }
    loadMenu();
  }, [tenantId]);

  // Allergènes disponibles dans le menu
  const availableAllergens = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.allergens?.forEach((a) => set.add(a)));
    return Array.from(set);
  }, [products]);

  // Filtrage par catégorie et allergène
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory ? p.category === activeCategory : true;
      const matchAllergen = selectedAllergenFilter
        ? !p.allergens?.includes(selectedAllergenFilter)
        : true;
      return matchCat && matchAllergen;
    });
  }, [products, activeCategory, selectedAllergenFilter]);

  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) {
        return prev.filter((it) => it.product.id !== productId);
      }
      return prev.map((it) =>
        it.product.id === productId ? { ...it, quantity: it.quantity - 1 } : it
      );
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    if (delta > 0) {
      const p = products.find((x) => x.id === productId);
      if (p) handleAddToCart(p);
    } else {
      handleRemoveFromCart(productId);
    }
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    try {
      setIsSubmitting(true);
      const payload = {
        tableId: tableParam || undefined,
        channel: modeParam === 'takeaway' ? 'CLICK_AND_COLLECT' : 'QR_TABLE',
        items: cart.map((it) => ({
          productId: it.product.id,
          name: it.product.name,
          quantity: it.quantity,
          unitPriceInMicrounits: it.product.priceInMicrounits,
          notes: it.notes,
        })),
      };

      const res = await authedFetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const result = await res.json();
        setConfirmedOrderId(result.orderId);
        setCart([]);
        setIsDrawerOpen(false);
      }
    } catch (err) {
      console.error('Failed to submit order', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (confirmedOrderId) {
    return (
      <div className="min-h-[100dvh] bg-surface-bg text-text-primary flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full bg-surface-card border border-emerald-500/30 rounded-3xl p-6 text-center space-y-4 backdrop-blur-xl shadow-2xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h2 className="text-xl font-bold text-text-primary">Commande Envoyée !</h2>
          <p className="text-sm text-text-secondary">
            Votre commande a été transmise directement en cuisine.
          </p>

          <div className="bg-surface-glass rounded-2xl p-4 border border-border-default text-left space-y-1.5 font-mono text-xs">
            <div className="flex justify-between text-text-muted">
              <span>Numéro de commande :</span>
              <span className="text-text-primary font-bold">{confirmedOrderId}</span>
            </div>
            {tableParam && (
              <div className="flex justify-between text-text-muted">
                <span>Table :</span>
                <span className="text-emerald-400 font-bold">{tableParam}</span>
              </div>
            )}
            <div className="flex justify-between text-text-muted">
              <span>Statut :</span>
              <span className="text-amber-400 font-bold flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" /> En préparation
              </span>
            </div>
          </div>

          <button
            onClick={() => setConfirmedOrderId(null)}
            className="w-full bg-surface-glass hover:bg-surface-glass-hover text-text-primary font-semibold py-3 rounded-xl transition-all border border-border-default"
          >
            Passer une autre commande
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-bg text-text-primary flex flex-col pb-24">
      <OrderHeader
        tenantName={tenantId}
        tableNumber={tableParam}
        orderMode={modeParam}
        selectedAllergenFilter={selectedAllergenFilter}
        onSelectAllergenFilter={setSelectedAllergenFilter}
        availableAllergens={availableAllergens}
        activeCategory={activeCategory}
        categories={categories}
        onSelectCategory={setActiveCategory}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface-glass rounded-2xl border border-border-default" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun produit disponible dans cette catégorie.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredProducts.map((product) => {
              const inCart = cart.find((it) => it.product.id === product.id)?.quantity || 0;
              return (
                <OrderProductCard
                  key={product.id}
                  product={product}
                  quantityInCart={inCart}
                  onAddToCart={handleAddToCart}
                  onRemoveFromCart={handleRemoveFromCart}
                />
              );
            })}
          </div>
        )}
      </main>

      <OrderCartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={() => setCart([])}
        onSubmitOrder={handleSubmitOrder}
        isSubmitting={isSubmitting}
        tableNumber={tableParam}
        orderMode={modeParam}
      />
    </div>
  );
}
