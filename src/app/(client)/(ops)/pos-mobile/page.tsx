"use client";

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductGrid, Cart, TableSelector, usePOSController } from '@/modules/ops';
import { useAuth, useTenant } from '@/shared/providers/NexusCoreProvider';
import { ArrowLeft, ShoppingCart, Send, X } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { formatCurrency } from '@/lib/formatters';
import { useStockAlerts } from '../pos/useStockAlerts';
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

function POSMobilePage() {
    const { currentUser } = useAuth();
    const { activeTenantId } = useTenant();
    const outOfStockIds = useStockAlerts();

    const {
        selectedTableId, setSelectedTableId,
        selectedCategory, setSelectedCategory,
        categories, products, isLoading,
        cartItems,
        currentTable, cartTotal, cartCount,
        handleAddToCart, handleUpdateQuantity, handleClearCart,
        handleSendToKitchen, handleCheckout,
    } = usePOSController();

    const [isCartOpen, setIsCartOpen] = useState(false);

    if (!selectedTableId) {
        return (
            <div className="h-[100dvh] bg-bg-primary p-4">
                <div className="mb-4">
                    <h1 className="text-lg font-black uppercase tracking-widest text-text-primary">
                        POS Mobile
                    </h1>
                    <p className="text-[10px] text-text-muted">
                        {currentUser?.name ?? 'Serveur'} — sélectionnez une table
                    </p>
                </div>
                <TableSelector onSelectTable={setSelectedTableId} />
            </div>
        );
    }

    return (
        <div className="h-[100dvh] flex flex-col bg-bg-primary overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-surface-card/80 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => setSelectedTableId(null)} className="text-text-muted">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <span className="text-base font-black font-serif italic text-text-primary">
                            Table {currentTable?.number || '—'}
                        </span>
                        <span className="text-[9px] text-text-muted block font-bold uppercase tracking-widest">
                            {currentUser?.name ?? 'Serveur'}
                        </span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => handleSendToKitchen()}
                        disabled={cartItems.length === 0}
                        className="h-10 px-4 rounded-full bg-status-success text-text-primary text-chip-label disabled:opacity-30 flex items-center gap-2"
                    >
                        <Send className="w-3.5 h-3.5" />
                        Envoyer
                    </button>
                </div>
            </div>

            {/* Category strip */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 py-2 shrink-0">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                        'h-9 px-4 rounded-full text-chip-label-sm whitespace-nowrap transition-all',
                        selectedCategory === 'all' ? 'bg-accent-gold text-text-primary' : 'bg-bg-tertiary text-text-muted'
                    )}
                >
                    Tout
                </button>
                {categories.map((cat) => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={cn(
                            'h-9 px-4 rounded-full text-chip-label-sm whitespace-nowrap transition-all',
                            selectedCategory === cat.id ? 'bg-accent-gold text-text-primary' : 'bg-bg-tertiary text-text-muted'
                        )}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* Product grid */}
            <div className="flex-1 overflow-auto p-4">
                <ProductGrid
                    categoryFilter={selectedCategory}
                    onAddToCart={handleAddToCart}
                    products={products}
                    isLoading={isLoading}
                    outOfStockIds={outOfStockIds}
                />
            </div>

            {/* Cart dock */}
            <AnimatePresence>
                {cartItems.length > 0 && !isCartOpen && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="fixed bottom-6 left-4 right-4 z-50"
                    >
                        <button
                            onClick={() => setIsCartOpen(true)}
                            className="w-full h-14 rounded-2xl bg-text-primary dark:bg-accent-gold px-6 flex items-center justify-between shadow-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-white/20 rounded-xl flex items-center justify-center text-text-primary text-xs font-black">
                                    {cartCount}
                                </div>
                                <ShoppingCart className="w-4 h-4 text-text-primary" />
                            </div>
                            <span className="text-lg font-mono font-bold text-text-primary">{formatCurrency(cartTotal)}</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Cart overlay */}
            <AnimatePresence>
                {isCartOpen && (
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                        className="fixed inset-0 z-50 bg-surface-card flex flex-col"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                            <h2 className="text-sm font-black uppercase tracking-widest text-text-primary">
                                Panier — Table {currentTable?.number}
                            </h2>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center"
                            >
                                <X className="w-4 h-4 text-text-muted" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            <Cart
                                items={cartItems}
                                onUpdateQuantity={handleUpdateQuantity}
                                onClearCart={handleClearCart}
                                onCheckout={() => { setIsCartOpen(false); handleCheckout(); }}
                                onSendToKitchen={() => { setIsCartOpen(false); handleSendToKitchen(); }}
                                onSplitBill={() => {}}
                                tableNumber={currentTable?.number}
                                guestCount={currentTable?.seats}
                                showClose={false}
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default withPageGuard(POSMobilePage, "pos_mobile");
