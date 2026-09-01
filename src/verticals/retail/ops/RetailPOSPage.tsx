'use client';

import React, { useState } from 'react';
import { Barcode, ShoppingCart, CreditCard, Trash2, Plus, Minus, Search, CheckCircle2, Tag } from 'lucide-react';
import { useTenant } from '@/shared/hooks/useTenant';
import { useSovereignCollection } from '@/kernel/hooks/useSovereignCollection';
import { RetailOpsAdapter } from '@/verticals/retail/adapters';

interface RetailProduct {
  id: string;
  ean: string;
  name: string;
  category: string;
  variant: string;
  priceInMicrounits: number;
  stock: number;
}

interface CartItem extends RetailProduct {
  quantity: number;
}



export function RetailPOSPage() {
  const { activeTenantId } = useTenant();
  // Le catalogue est souverain ; le panier reste un état d'écran (il n'existe
  // qu'entre le scan et l'encaissement).
  const {
    data: catalog,
    isLoading,
  } = useSovereignCollection<RetailProduct>('retailCatalog', { tenantId: activeTenantId ?? undefined });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [paidSuccess, setPaidSuccess] = useState(false);

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput) return;
    const found = catalog.find(p => p.ean === scanInput || p.id === scanInput);
    if (found) {
      addToCart(found);
      setScanInput('');
    } else {
      alert(`Code-barres introuvable : ${scanInput}`);
    }
  };

  const addToCart = (product: RetailProduct) => {
    setPaidSuccess(false);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id !== id) return item;
      const newQty = item.quantity + delta;
      return newQty > 0 ? { ...item, quantity: newQty } : null;
    }).filter(Boolean) as CartItem[]);
  };

  const totalAmountMu = cart.reduce((acc, it) => acc + (it.priceInMicrounits * it.quantity), 0);
  const totalEur = (totalAmountMu / 1_000_000).toFixed(2);
  const tvaEur = ((totalAmountMu * 0.20) / 1_200_000).toFixed(2);

  const handleCheckout = () => {
    if (cart.length === 0 || !activeTenantId) return;
    // La vente part sur le bus : la comptabilité, le stock et la fidélité y réagissent.
    RetailOpsAdapter.emitSaleCompleted({
      tenantId: activeTenantId,
      saleId: `sale_${Date.now()}`,
      lines: cart.map(it => ({
        productId: it.id,
        quantity: it.quantity,
        unitPriceInMicrounits: it.priceInMicrounits,
      })),
      totalInMicrounits: totalAmountMu,
      paymentMethod: 'card',
    });
    setPaidSuccess(true);
    setCart([]);
  };

  if (isLoading) {
    return <div className="p-6 text-sm text-text-muted">{"Chargement du catalogue…"}</div>;
  }

  const filteredCatalog = catalog.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.variant.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.ean.includes(searchQuery)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{"🛍️"}</span>
            <h1 className="text-xl font-bold font-serif">{"Caisse Point de Vente Retail (POS)"}</h1>
          </div>
          <p className="text-xs text-text-muted mt-1">
            {"Encaissement rapide au scanner 2D, gestion des variantes taille/couleur et conformité fiscale NF525."}
          </p>
        </div>

        {/* Scan Barcode Form */}
        <form onSubmit={handleScan} className="flex items-center gap-2">
          <div className="relative">
            <Barcode className="w-4 h-4 absolute left-3 top-2.5 text-pink-500" />
            <input
              type="text"
              value={scanInput}
              onChange={e => setScanInput(e.target.value)}
              placeholder="Scanner EAN13..."
              className="pl-9 pr-3 py-1.5 rounded-lg border border-border bg-surface-card text-xs font-mono focus:border-pink-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium transition-colors"
          >
            {"Ajouter"}
          </button>
        </form>
      </div>

      {paidSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <div>
            <p className="text-xs font-semibold">{"Vente encaissée et scellée avec succès !"}</p>
            <p className="text-[11px] text-text-muted">{"Ticket Z mis à jour et déduction immédiate des stocks boutique effectuée."}</p>
          </div>
        </div>
      )}

      {/* Main split: Catalog (left) & Cart/Terminal (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Colonne Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Rechercher par article, taille, couleur ou EAN..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface-card text-xs focus:border-pink-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredCatalog.map(product => {
              const price = (product.priceInMicrounits / 1_000_000).toFixed(2);
              return (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="text-left p-3.5 rounded-xl border border-border bg-surface-card hover:border-pink-500/40 hover:bg-surface-hover transition-all flex flex-col justify-between space-y-2 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-text-muted">
                      <span>{product.category}</span>
                      <span className="font-mono">{product.ean}</span>
                    </div>
                    <p className="text-xs font-semibold text-text-primary group-hover:text-pink-500 transition-colors">
                      {product.name}
                    </p>
                    <span className="inline-block text-[10px] px-2 py-0.5 rounded bg-surface-base border border-border font-medium">
                      {product.variant}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-xs font-mono font-bold text-text-primary">{price} {"€"}</span>
                    <span className="text-[10px] text-emerald-600 font-medium">
                      {product.stock} {"en stock"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Colonne Panier & Encaissement (5 cols) */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-border bg-surface-card p-5 space-y-4 sticky top-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-pink-500" />
                {"Panier en cours"}
              </h2>
              <span className="text-xs text-text-muted">
                {cart.reduce((s, it) => s + it.quantity, 0)} {"articles"}
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center text-text-muted space-y-2">
                <ShoppingCart className="w-12 h-12 mx-auto opacity-30" />
                <p className="text-xs">{"Panier vide. Scannez un article pour commencer."}</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 divide-y divide-border/60">
                {cart.map(item => {
                  const lineTotalEur = ((item.priceInMicrounits * item.quantity) / 1_000_000).toFixed(2);
                  return (
                    <div key={item.id} className="pt-3 first:pt-0 flex items-center justify-between gap-2 text-xs">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="font-medium truncate">{item.name}</p>
                        <p className="text-[11px] text-text-muted">{item.variant}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded border border-border bg-surface-base hover:bg-surface-hover flex items-center justify-center text-xs"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-mono font-medium w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded border border-border bg-surface-base hover:bg-surface-hover flex items-center justify-center text-xs"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right w-16 font-mono font-semibold">
                        {lineTotalEur} {"€"}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Totaux & Paiement */}
            <div className="pt-4 border-t border-border space-y-2 text-xs">
              <div className="flex justify-between text-text-muted">
                <span>{"Dont TVA (20%) :"}</span>
                <span className="font-mono">{tvaEur} {"€"}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-text-primary pt-1 border-t border-border/40">
                <span>{"Total TTC :"}</span>
                <span className="font-mono text-pink-600 dark:text-pink-400">{totalEur} {"€"}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3">
                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="py-2.5 rounded-lg bg-pink-600 hover:bg-pink-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  {"Carte Bancaire"}
                </button>
                <button
                  disabled={cart.length === 0}
                  onClick={handleCheckout}
                  className="py-2.5 rounded-lg bg-surface-base hover:bg-surface-hover border border-border disabled:opacity-40 text-text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Tag className="w-4 h-4" />
                  {"Espèces / Autre"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
