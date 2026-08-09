"use client";

import { useMemo, useCallback, memo } from "react";
import { useAtom, useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, AlertTriangle, Clock } from "lucide-react";
import { Product, Option } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import dynamic from "next/dynamic";
import { posSearchQueryAtom, posSelectedProductAtom, posProductDetailsOpenAtom } from '../store/posAtoms';
import { performanceModeAtom } from "@/store/pillars/sovereign";
import { quarantinedProductsAtom } from "@/store/pillars/compliance";
import { categoriesAtom } from "@/store/pillars/logistics";
import { isProductInCategory } from "@/shared/utils/categoryMatcher";
import { POSModalSkeleton } from "./POSModalSkeleton";
import { usePageSetting } from "@/shared/components/settings/ContextualSettings";
import { useLanguage } from "@/shared/hooks";
import { useInventory } from '../../../providers/hooks/catalogHooks';

const ProductDetailsDialog = dynamic(() => import("./ProductDetailsDialog").then(m => m.ProductDetailsDialog), { loading: () => <POSModalSkeleton /> });
        // FIXME (Modular Monolith): Remove cross-module import. Use domain/ or NexusEventBus.
        // eslint-disable-next-line vanguard/no-inter-module-imports
import { useNexusFleet } from "@/modules/intelligence";

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
        initial={performanceMode ? false : { opacity: 0, scale: 0.96 }}
        animate={performanceMode ? false : { opacity: 1, scale: 1 }}
        transition={performanceMode ? { duration: 0 } : { 
            duration: 0.15, 
            ease: "easeOut" 
        }}
        exit={performanceMode ? { opacity: 0 } : { opacity: 0, scale: 0.95, transition: { duration: 0.1 } }}
        onClick={() => !isDisabled && onClick(product)}
        className={cn(
            "group rounded-[32px] border border-border/40 overflow-hidden transition-all relative flex flex-col h-full",
            performanceMode ? "duration-0" : "duration-200",
            !performanceMode && "backdrop-blur-xl",
            isDisabled 
                ? "opacity-50 grayscale cursor-not-allowed bg-bg-tertiary/20" 
                : "bg-surface-card dark:bg-surface-card/10 hover:border-accent-gold/40 hover:shadow-premium hover:-translate-y-1 cursor-pointer active:scale-[0.98]"
        )}
    >
        {/* Compliance Overlays */}
        <AnimatePresence>
            {isDisabled && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-surface-sidebar/40 backdrop-blur-sm p-6 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-status-danger/20 flex items-center justify-center mb-4">
                        {disabledReason === 'expired' || disabledReason === 'quarantine' ? (
                            <Clock className="w-8 h-8 text-status-danger animate-pulse" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-status-danger" />
                        )}
                    </div>
                    <span className="text-text-primary font-serif italic text-xl font-bold uppercase tracking-widest drop-shadow-lg text-center">
                        {disabledReason === 'expired' ? 'DLC CRITIQUE' : disabledReason === 'quarantine' ? 'QUARANTAINE HACCP' : 'RUPTURE STOCK'}
                    </span>
                    <p className="text-text-primary/70 text-sm mt-2 font-medium text-center px-4">
                        {disabledReason === 'expired' 
                            ? "Produit retiré par mesure d'hygiène" 
                            : disabledReason === 'quarantine'
                            ? "Produit isolé (Alerte Capteur)"
                            : "Ingrédients manquants pour ce plat"}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
        {/* Categorical Glow Aura */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-accent-gold/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        {/* Product Image Holder - Museum Frame */}
        <div className="h-60 md:h-72 bg-bg-tertiary relative overflow-hidden m-4 rounded-[32px] border border-black/5 dark:border-white/5">
            {showImages && product.image ? (
                <div className="absolute inset-0 transition-transform duration-1000 group-hover:scale-110">
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
                <div className={cn("absolute inset-0 flex items-center justify-center opacity-40 bg-gradient-to-br from-bg-tertiary to-border")}>
                    <Plus strokeWidth={0.5} className="w-20 h-20 text-text-muted opacity-20" />
                </div>
            )}

            {/* Aesthetic Spotlight Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        <div className="px-8 pb-8 flex flex-col flex-1">
            <h3 className="text-2xl md:text-2xl font-serif font-black text-text-primary mb-3 group-hover:text-accent-gold transition-colors leading-tight italic decoration-accent-gold/20 decoration-2 underline-offset-8 group-hover:underline">
                {product.name}
            </h3>

            <p className="text-[12px] md:text-[13px] text-text-muted/80 leading-relaxed flex-1 font-medium font-sans mb-8">
                {product.description || t('pos.fallback_description')}
            </p>

            <div className="flex items-center justify-between border-t border-border/30 pt-6">
                <div className="flex items-center gap-4">
                    <span className="text-3xl md:text-3xl font-serif font-black text-text-primary mb-3 group-hover:text-accent-gold transition-colors leading-tight italic decoration-accent-gold/20 decoration-2 underline-offset-8 group-hover:underline">
                        {finalPrice.toFixed(2)}€
                    </span>
                    {multiplier !== 1 && (
                        <span className="text-xs text-text-muted line-through opacity-50">
                            {(product.priceInMicrounits / 1_000_000).toFixed(2)}€
                        </span>
                    )}
                    <div className="flex items-center gap-3 bg-surface-card/5 rounded-full p-1 border border-subtle">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                                "rounded-full bg-text-primary text-text-primary dark:bg-surface-card dark:text-primary flex items-center justify-center shadow-premium hover:bg-accent-gold hover:text-text-primary transition-all duration-500",
                                buttonSize === 'small' ? 'w-10 h-10' :
                                buttonSize === 'large' ? 'w-14 h-14' : 'w-12 h-12'
                            )}
                        >
                            <Plus strokeWidth={2.5} className={cn(
                                buttonSize === 'small' ? 'w-4 h-4' :
                                buttonSize === 'large' ? 'w-6 h-6' : 'w-5 h-5'
                            )} />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    </motion.div>
)});

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
    const categories = useAtomValue(categoriesAtom);
    // Référence stable : `inventory.data || []` créait un nouveau tableau à chaque
    // render, invalidant availableStockMap puis toute la grille filtrée.
    const stockItems = useMemo(() => inventory.data ?? [], [inventory.data]);

    // Read show_images setting from context (defaults to true)
    const showImages = usePageSetting('pos', 'show_images', true);
    const buttonSize = usePageSetting<'small' | 'medium' | 'large'>('pos', 'button_size', 'medium');

    // FAST O(1) STOCK LOOKUP MAP
    const { availableStockMap, expiredIngredientIds } = useMemo(() => {
        const now = Date.now();
        const map = new Map<string, number>();
        const expiredSet = new Set<string>();

        for (let i = 0; i < stockItems.length; i++) {
            const s = stockItems[i];
            if (!s.ingredientId) continue;
            if (s.status === 'expired' || s.status === 'discarded') {
                expiredSet.add(s.ingredientId);
                continue;
            }
            if (s.dlc) {
                const dlcTime = new Date(String(s.dlc)).getTime();
                if (!isNaN(dlcTime) && dlcTime <= now) {
                    expiredSet.add(s.ingredientId);
                    continue;
                }
            }
            const current = map.get(s.ingredientId) || 0;
            map.set(s.ingredientId, current + (Number(s.quantity) || 0));
        }
        return { availableStockMap: map, expiredIngredientIds: expiredSet };
    }, [stockItems]);

    const filteredProductsWithStatus = useMemo(() => {
        const query = searchQuery.toLowerCase();

        return products.filter(p => {
            const matchesSearch = String(p.name || '').toLowerCase().includes(query);
            const matchesCategory = isProductInCategory(p, categoryFilter, categories);
            return matchesSearch && matchesCategory;
        }).map(product => {
            let isDisabled = false;
            let disabledReason: 'expired' | 'stockout' | 'quarantine' | undefined;

            if (quarantinedProducts[product.id]) {
                isDisabled = true;
                disabledReason = 'quarantine';
            }

            if (!isDisabled && product.ingredients && product.ingredients.length > 0) {
                for (let i = 0; i < product.ingredients.length; i++) {
                    const req = product.ingredients[i];
                    const totalQty = availableStockMap.get(req.ingredientId) || 0;
                    if (totalQty < req.quantity) {
                        isDisabled = true;
                        disabledReason = expiredIngredientIds.has(req.ingredientId) ? 'expired' : 'stockout';
                        break;
                    }
                }
            }

            if (!isDisabled && outOfStockIds && outOfStockIds.size > 0) {
                const nameKey = (product.name || '').toLowerCase();
                if (outOfStockIds.has(product.id) || outOfStockIds.has(nameKey)) {
                    isDisabled = true;
                    disabledReason = 'stockout';
                }
            }

            return { ...product, isDisabled, disabledReason };
        });
    }, [products, searchQuery, categoryFilter, availableStockMap, expiredIngredientIds, quarantinedProducts, outOfStockIds]);

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-10 md:gap-14">
                    {/* Pas de mode="wait" : il sérialise les sorties de TOUS les produits
                        avant de monter les nouveaux → grille figée au changement de catégorie.
                        Le mode par défaut anime entrées et sorties en parallèle. */}
                    <AnimatePresence>
                        {isLoading ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-accent-gold/20 border-t-accent-gold rounded-full animate-spin" />
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
                            <div className="col-span-full text-center py-20">
                                <p className="text-text-muted font-serif italic">Aucun produit trouvé dans cette catégorie</p>
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
