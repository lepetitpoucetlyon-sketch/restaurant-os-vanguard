"use client";

import { useMemo, useCallback, memo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, AlertTriangle, Clock, Package } from "lucide-react";
import { Product, Option } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { EmptyState, Button, SkeletonList } from "@/shared/components/ui";
import { posSearchQueryAtom, posSelectedProductAtom, posProductDetailsOpenAtom } from '../store/posAtoms';
import { performanceModeAtom } from "@/store/pillars/sovereign";
import { quarantinedProductsAtom } from "@/store/pillars/compliance";
import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { useLanguage } from "@/shared/hooks";
import { useInventory } from '../../../providers/hooks/catalogHooks';
import { useNexusFleet } from "@/shared/providers/fleet/NexusFleetProvider";

// ==========================================
// PERFORMANCE-OPTIMIZED SUB-COMPONENTS
// ==========================================

interface ProductCardProps {
    product: Product;
    idx: number;
    showImages: boolean;
    buttonSize: 'small' | 'medium' | 'large';
    isDisabled?: boolean;
    disabledReason?: 'expired' | 'stockout' | 'quarantine';
    t: (key: string) => string;
    onClick: (product: Product) => void;
    multiplier: number;
    performanceMode: boolean;
}

/**
 * Memoized Product Card to prevent unnecessary re-renders of the entire grid.
 * Uses layout="position" for efficient GPU-accelerated transitions during filtering.
 */
const ProductCard = memo(({ product, idx, showImages, buttonSize, isDisabled, disabledReason, t, onClick, multiplier, performanceMode }: ProductCardProps) => {
    const finalPrice = (product.priceInMicrounits / 1_000_000 * multiplier);

    return (
    <motion.div
        layout={performanceMode ? false : "position"}
        initial={performanceMode ? false : { opacity: 0, y: 15 }}
        animate={performanceMode ? false : { opacity: 1, y: 0 }}
        transition={performanceMode ? { duration: 0 } : { 
            delay: idx * 0.015, 
            duration: 0.35, 
            ease: [0.16, 1, 0.3, 1] 
        }}
        exit={performanceMode ? { opacity: 0 } : { opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
        onClick={() => !isDisabled && onClick(product)}
        className={cn(
            "group rounded-2xl border transition-all duration-200 relative flex flex-col h-full overflow-hidden p-3",
            isDisabled 
                ? "bg-surface-glass grayscale cursor-not-allowed border-red-500/20 opacity-50" 
                : "bg-surface-card dark:bg-bg-secondary border-border/70 dark:border-white/10 cursor-pointer hover:border-action-primary/60 hover:shadow-lg active:scale-[var(--motion-tap-scale,0.97)] transition-all duration-[var(--motion-duration-fast,150ms)]"
        )}
    >
        {/* Compliance Overlays */}
        <AnimatePresence>
            {isDisabled && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-center"
                >
                    <div className="w-10 h-10 rounded-full bg-status-danger/20 flex items-center justify-center mb-2">
                        {disabledReason === 'expired' || disabledReason === 'quarantine' ? (
                            <Clock className="w-5 h-5 text-status-danger animate-pulse" />
                        ) : (
                            <AlertTriangle className="w-5 h-5 text-status-danger" />
                        )}
                    </div>
                    <span className="text-white text-xs font-bold uppercase tracking-wider">
                        {disabledReason === 'expired' ? 'DLC Critique' : disabledReason === 'quarantine' ? 'Quarantaine HACCP' : 'Rupture'}
                    </span>
                </motion.div>
            )}
        </AnimatePresence>

        {/* Product Image Holder */}
        {showImages && (
            <div className="h-40 md:h-44 bg-bg-tertiary relative overflow-hidden rounded-xl border border-border/40 mb-3">
                {product.image ? (
                    <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-105">
                        <img
                            src={`/images/${product.image}.png`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80';
                            }}
                        />
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-30 bg-bg-secondary">
                        <Plus className="w-10 h-10 text-text-muted" />
                    </div>
                )}
            </div>
        )}

        <div className="flex flex-col flex-1 justify-between px-1">
            <div>
                <h3 className="text-sm md:text-base font-semibold text-text-primary group-hover:text-action-primary transition-colors line-clamp-1 leading-snug">
                    {product.name}
                </h3>
                {product.description && (
                    <p className="text-xs text-text-muted line-clamp-2 mt-1 leading-relaxed">
                        {product.description}
                    </p>
                )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
                <div className="flex items-baseline gap-2">
                    <span className="text-base md:text-lg font-bold font-mono text-text-primary tracking-tight tabular-nums">
                        {finalPrice.toFixed(2)} €
                    </span>
                    {multiplier !== 1 && (
                        <span className="text-xs text-text-muted line-through font-mono opacity-50">
                            {(product.priceInMicrounits / 1_000_000).toFixed(2)} €
                        </span>
                    )}
                </div>

                <div className="w-8 h-8 rounded-lg bg-bg-secondary dark:bg-white/5 border border-border group-hover:border-action-primary group-hover:bg-action-primary group-hover:text-text-on-primary flex items-center justify-center transition-all">
                    <Plus className="w-4 h-4" />
                </div>
            </div>
        </div>
    </motion.div>
    );
});

ProductCard.displayName = "ProductCard";

interface ProductGridProps {
    categoryFilter: string;
    products: Product[];
    isLoading: boolean;
    onAddToCart: (product: Product, quantity: number, options: Record<string, Option[]>) => void;
    /**
     * Optional set of out-of-stock product IDs / lowercased names from useStockAlerts.
     * Augments the ingredient-based stock check already performed internally.
     */
    outOfStockIds?: Set<string>;
}

export function ProductGrid({ categoryFilter, products, isLoading, onAddToCart, outOfStockIds }: ProductGridProps) {
    const [selectedProduct, setSelectedProduct] = useAtom(posSelectedProductAtom) as [Product | null, (p: Product | null) => void];
    const [isDialogOpen, setIsDialogOpen] = useAtom(posProductDetailsOpenAtom);
    const [searchQuery, setSearchQuery] = useAtom(posSearchQueryAtom);
    const { t } = useLanguage();
    const inventory = useInventory();
    const { priceMultiplier } = useNexusFleet();
    const performanceMode = useAtomValue(performanceModeAtom);
    const quarantinedProducts = useAtomValue(quarantinedProductsAtom);
    const stockItems = (inventory.data || []) as Array<{ ingredientId?: string; dlc?: string | number; status?: string; quantity?: number }>;

    // Read show_images setting from context (defaults to true)
    const showImages = usePageSetting('pos', 'show_images', true);
    const buttonSize = usePageSetting<'small' | 'medium' | 'large'>('pos', 'button_size', 'medium');

    const filteredProductsWithStatus = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const now = new Date();

        return products.filter(p => {
            const matchesSearch = String(p.name || '').toLowerCase().includes(query);
            const matchesCategory = categoryFilter === "all" || String(p.category || '') === categoryFilter || String(p.categoryId || '') === categoryFilter;
            return matchesSearch && matchesCategory;
        }).map(product => {
            // COMPLIANCE GUARD LOGIC
            // Check if unknown required ingredient is completely unavailable or expired
            let isDisabled = false;
            let disabledReason: 'expired' | 'stockout' | 'quarantine' | undefined;

            // P2: Check Quarantine HACCP first
            if (quarantinedProducts[product.id]) {
                isDisabled = true;
                disabledReason = 'quarantine';
            }

            if (!isDisabled && product.ingredients && product.ingredients.length > 0) {
                for (const req of product.ingredients) {
                    const relatedStock = stockItems.filter(s => s.ingredientId === req.ingredientId);
                    
                    const nonExpiredStock = relatedStock.filter(s => {
                        const dlc = new Date(String(s.dlc || ''));
                        return dlc > now && s.status !== 'expired' && s.status !== 'discarded';
                    });

                    const totalQty = nonExpiredStock.reduce((acc, s) => acc + Number(s.quantity || 0), 0);

                    if (totalQty < req.quantity) {
                        isDisabled = true;
                        // If there IS stock but it's all expired, reason is 'expired'
                        // Otherwise it's a simple 'stockout'
                        const expiredOnly = relatedStock.length > 0 && nonExpiredStock.length === 0;
                        disabledReason = expiredOnly ? 'expired' : 'stockout';
                        break;
                    }
                }
            }

            // Secondary stockout check: useStockAlerts set (matches by productId or lowercased name)
            if (!isDisabled && outOfStockIds && outOfStockIds.size > 0) {
                const nameKey = (product.name || '').toLowerCase();
                if (outOfStockIds.has(product.id) || outOfStockIds.has(nameKey)) {
                    isDisabled = true;
                    disabledReason = 'stockout';
                }
            }

            return { ...product, isDisabled, disabledReason };
        });
    }, [products, searchQuery, categoryFilter, stockItems]);

    const handleProductClick = useCallback((product: Product) => {
        if (product.optionGroups && product.optionGroups.length > 0) {
            setSelectedProduct(product);
            setIsDialogOpen(true);
        } else {
            onAddToCart(product, 1, {});
        }
    }, [onAddToCart, setSelectedProduct, setIsDialogOpen]);

    return (
        <div className="flex-1 flex flex-col h-full bg-bg-primary transition-colors duration-700 overflow-hidden relative">
            {/* Visual Background Glow */}
            <div className="absolute top-1/4 right-0 w-[40%] h-[40%] rounded-full bg-accent-gold/5 blur-[120px] pointer-events-none" />

            {/* Top Toolbar - Precision Nav Tier */}
            <div className="px-8 md:px-14 py-8 md:py-8 flex flex-col md:flex-row items-stretch md:items-center justify-center gap-8 md:gap-14 transition-all duration-700 relative z-20">
                <div className="relative flex-1 md:max-w-2xl group">
                    <Search strokeWidth={1} className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-hover:text-accent-gold transition-all duration-500" />
                    <input
                        type="text"
                        placeholder={t('pos.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-card dark:bg-surface-card/5 border border-border/50 rounded-[28px] md:rounded-[32px] pl-16 pr-8 py-4 md:py-5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-accent-gold/50 focus:ring-4 focus:ring-accent-gold/5 transition-all duration-700 font-serif italic shadow-premium hover:border-accent-gold/30"
                    />
                </div>
            </div>

            {/* Product Grid - Exhibition Deck */}
            <div className="flex-1 p-6 md:p-12 overflow-y-auto scrollbar-hide relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-[var(--density-gap-md,1rem)] lg:gap-[var(--density-gap-lg,1.25rem)]">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <div className="col-span-full py-10">
                                <SkeletonList count={6} variant="card" />
                            </div>
                        ) : filteredProductsWithStatus.length > 0 ? (
                            filteredProductsWithStatus.map((p, idx) => (
                                <ProductCard 
                                    key={p.id}
                                    product={p}
                                    idx={idx}
                                    showImages={showImages}
                                    buttonSize={buttonSize}
                                    isDisabled={p.isDisabled}
                                    disabledReason={p.disabledReason}
                                    t={t}
                                    onClick={handleProductClick}
                                    multiplier={priceMultiplier}
                                    performanceMode={performanceMode}
                                />
                            ))
                        ) : (
                            <div className="col-span-full py-12">
                                <EmptyState
                                    icon={searchQuery ? Search : Package}
                                    title={searchQuery ? "Aucun produit trouvé" : "Catégorie vide"}
                                    description={
                                        searchQuery 
                                            ? `Aucun article ne correspond à "${searchQuery}".` 
                                            : "Aucun produit n'est configuré dans cette catégorie."
                                    }
                                    action={
                                        searchQuery ? (
                                            <Button 
                                                size="sm" 
                                                variant="default" 
                                                onClick={() => setSearchQuery('')}
                                                className="text-xs"
                                            >
                                                Effacer la recherche
                                            </Button>
                                        ) : undefined
                                    }
                                />
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <ProductDetailsDialog
                product={selectedProduct}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onAddToCart={onAddToCart}
            />
        </div>
    );
}
