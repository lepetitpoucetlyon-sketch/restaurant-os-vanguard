'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import { useSearchParams } from 'next/navigation';
import { Utensils, Bell, Split, ShoppingBag, ArrowLeft } from 'lucide-react';
import { OrderHeader } from './components/OrderHeader';
import { OrderProductCard, type ProductItem } from './components/OrderProductCard';
import { OrderCartDrawer, type CartItemEntry } from './components/OrderCartDrawer';
import {
  DietaryAllergenFilter,
  type DietaryPreference,
  WaiterCallDrawer,
  TableSplitBillModal,
  LiveOrderTracker,
} from '@/modules/commerce';
import { formatMu } from '@/lib/formatters';

interface OrderPageProps {
  params: Promise<{ tenantId: string }>;
}

const UI_STRINGS = {
  emptyProducts: 'Aucun produit ne correspond à vos filtres.',
  splitBillBtn: "Partager l'addition",
  waiterCallBtn: 'Appel serveur',
  backToMenuBtn: 'Retour à la carte',
  viewCartPrefix: 'Voir le panier',
  waiterAria: 'Appeler un serveur',
  submitError: 'Envoi de la commande impossible. Appelez un serveur ou réessayez.',
};

export default function OrderPage({ params }: OrderPageProps) {
  const { tenantId } = use(params);
  const searchParams = useSearchParams();
  const tableParam = searchParams.get('table');
  const modeParam = searchParams.get('mode') === 'takeaway' ? 'takeaway' : 'dine_in';

  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [dietaryFilter, setDietaryFilter] = useState<DietaryPreference>('all');
  const [selectedExcludedAllergen, setSelectedExcludedAllergen] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItemEntry[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isWaiterDrawerOpen, setIsWaiterDrawerOpen] = useState(false);
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedOrderId, setConfirmedOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Menu public v1 (endpoint non authentifié — parcours QR convive).
  useEffect(() => {
    async function loadMenu() {
      try {
        setLoading(true);
        const res = await fetch(`/api/v1/menu?tenantId=${encodeURIComponent(tenantId)}`, { cache: 'no-store' });
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

  const availableAllergens = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.allergens?.forEach((a) => set.add(a)));
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = activeCategory ? p.category === activeCategory : true;
      const matchExcludedAllergen = selectedExcludedAllergen
        ? !p.allergens?.includes(selectedExcludedAllergen)
        : true;

      let matchDiet = true;
      if (dietaryFilter === 'vegetarian') {
        matchDiet = p.isVegetarian || (p.tags && p.tags.includes('vegetarian')) || false;
      } else if (dietaryFilter === 'vegan') {
        matchDiet = p.isVegan || (p.tags && p.tags.includes('vegan')) || false;
      } else if (dietaryFilter === 'gluten_free') {
        matchDiet = !p.allergens?.includes('gluten') && !p.allergens?.includes('Gluten');
      } else if (dietaryFilter === 'dairy_free') {
        matchDiet = !p.allergens?.includes('lait') && !p.allergens?.includes('Lactose');
      }

      return matchCat && matchExcludedAllergen && matchDiet;
    });
  }, [products, activeCategory, selectedExcludedAllergen, dietaryFilter]);

  const cartItemsCount = useMemo(() => cart.reduce((sum, it) => sum + it.quantity, 0), [cart]);

  const cartTotalInMicrounits = useMemo(
    () => cart.reduce((sum, it) => sum + it.product.priceInMicrounits * it.quantity, 0),
    [cart],
  );

  const billItemsForSplit = useMemo(
    () =>
      cart.map((it) => ({
        id: it.product.id,
        name: it.product.name,
        priceInMicrounits: it.product.priceInMicrounits,
        quantity: it.quantity,
      })),
    [cart],
  );

  const handleAddToCart = (product: ProductItem) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === product.id);
      if (existing) {
        return prev.map((it) =>
          it.product.id === product.id ? { ...it, quantity: it.quantity + 1 } : it,
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((it) => it.product.id === productId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter((it) => it.product.id !== productId);
      return prev.map((it) =>
        it.product.id === productId ? { ...it, quantity: it.quantity - 1 } : it,
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
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          tableId: tableParam || undefined,
          channel: modeParam === 'takeaway' ? 'CLICK_AND_COLLECT' : 'QR_TABLE',
          items: cart.map((it) => ({
            productId: it.product.id,
            name: it.product.name,
            quantity: it.quantity,
            unitPriceInMicrounits: it.product.priceInMicrounits,
            notes: it.notes,
          })),
        }),
      });

      if (!res.ok) throw new Error(`orders ${res.status}`);
      const result = await res.json();
      if (!result.orderId) throw new Error('orderId manquant');

      setConfirmedOrderId(result.orderId);
      setIsDrawerOpen(false);
    } catch (err) {
      console.error('Failed to submit order', err);
      setSubmitError(UI_STRINGS.submitError);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Écran de suivi en direct : la commande existe réellement côté serveur.
  if (confirmedOrderId) {
    return (
      <div className="min-h-[100dvh] bg-surface-bg text-text-primary flex items-center justify-center p-4">
        <div className="max-w-md w-full flex flex-col gap-4">
          <LiveOrderTracker
            orderId={confirmedOrderId}
            tenantId={tenantId}
            tableNumber={tableParam}
            itemsCount={cartItemsCount || 1}
            totalInMicrounits={cartTotalInMicrounits}
          />

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label={UI_STRINGS.splitBillBtn}
              onClick={() => setIsSplitModalOpen(true)}
              className="py-3 px-4 rounded-2xl bg-surface-card border border-border-default text-text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-subtle transition-all cursor-pointer shadow-sm"
            >
              <Split className="w-4 h-4 text-action-primary" />
              <span>{UI_STRINGS.splitBillBtn}</span>
            </button>

            <button
              type="button"
              aria-label={UI_STRINGS.waiterCallBtn}
              onClick={() => setIsWaiterDrawerOpen(true)}
              className="py-3 px-4 rounded-2xl bg-surface-card border border-border-default text-text-primary font-bold text-xs flex items-center justify-center gap-2 hover:bg-surface-subtle transition-all cursor-pointer shadow-sm"
            >
              <Bell className="w-4 h-4 text-action-primary" />
              <span>{UI_STRINGS.waiterCallBtn}</span>
            </button>
          </div>

          <button
            type="button"
            aria-label={UI_STRINGS.backToMenuBtn}
            onClick={() => {
              setConfirmedOrderId(null);
              setCart([]);
            }}
            className="w-full py-3 rounded-2xl bg-surface-subtle text-text-secondary font-bold text-xs flex items-center justify-center gap-2 hover:text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{UI_STRINGS.backToMenuBtn}</span>
          </button>
        </div>

        <TableSplitBillModal
          isOpen={isSplitModalOpen}
          onClose={() => setIsSplitModalOpen(false)}
          tenantId={tenantId}
          orderId={confirmedOrderId}
          tableNumber={tableParam}
          items={billItemsForSplit}
          totalInMicrounits={cartTotalInMicrounits}
        />

        <WaiterCallDrawer
          isOpen={isWaiterDrawerOpen}
          onClose={() => setIsWaiterDrawerOpen(false)}
          tenantId={tenantId}
          tableNumber={tableParam}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-bg text-text-primary flex flex-col pb-28">
      <OrderHeader
        tenantName={tenantId}
        tableNumber={tableParam}
        orderMode={modeParam}
        selectedAllergenFilter={selectedExcludedAllergen}
        onSelectAllergenFilter={setSelectedExcludedAllergen}
        availableAllergens={availableAllergens}
        activeCategory={activeCategory}
        categories={categories}
        onSelectCategory={setActiveCategory}
      />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-4">
        <DietaryAllergenFilter
          activeFilter={dietaryFilter}
          onSelectFilter={setDietaryFilter}
          availableAllergens={availableAllergens}
          selectedExcludedAllergen={selectedExcludedAllergen}
          onSelectExcludedAllergen={setSelectedExcludedAllergen}
        />

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-pulse mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-surface-glass rounded-2xl border border-border-default" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <Utensils className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{UI_STRINGS.emptyProducts}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
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

        {submitError && <p className="mt-4 text-center text-xs font-medium text-error">{submitError}</p>}
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
        <div className="bg-surface-card/95 backdrop-blur-md border border-border-default rounded-3xl p-2 shadow-2xl flex items-center justify-between gap-2">
          <button
            type="button"
            aria-label={UI_STRINGS.waiterAria}
            onClick={() => setIsWaiterDrawerOpen(true)}
            className="p-3 rounded-2xl bg-surface-subtle text-text-secondary hover:text-text-primary hover:bg-surface-card transition-all cursor-pointer flex items-center justify-center border border-border-subtle"
          >
            <Bell className="w-5 h-5 text-action-primary" />
          </button>

          <button
            type="button"
            aria-label={`${UI_STRINGS.viewCartPrefix} (${cartItemsCount})`}
            onClick={() => setIsDrawerOpen(true)}
            className="flex-1 py-3 px-4 rounded-2xl bg-action-primary text-text-on-primary font-bold text-xs flex items-center justify-between shadow-lg hover:opacity-95 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              <span>{UI_STRINGS.viewCartPrefix} ({cartItemsCount})</span>
            </div>
            <span>{formatMu(cartTotalInMicrounits)}</span>
          </button>
        </div>
      </div>

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

      <WaiterCallDrawer
        isOpen={isWaiterDrawerOpen}
        onClose={() => setIsWaiterDrawerOpen(false)}
        tenantId={tenantId}
        tableNumber={tableParam}
      />
    </div>
  );
}
