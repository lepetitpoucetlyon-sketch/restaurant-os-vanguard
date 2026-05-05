"use client";

import { useMemo, useCallback, memo } from "react";
import { useAtom, useSetAtom, useAtomValue } from "jotai";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search } from "lucide-react";
import { Product, Option, StockItem } from "@nexus/contracts";
import { cn } from "@/lib/ui.foundations";
import { posSearchQueryAtom, posSelectedProductAtom, posProductDetailsOpenAtom } from "../hooks/posAtoms";
import { performanceModeAtom } from "@/store/pillars/sovereign";
import { ProductDetailsDialog } from "./ProductDetailsDialog";
import { usePageSetting } from "@/components/settings/ContextualSettings";
// import { useLanguage } from "@/context/LanguageContext";
const useLanguage = () => ({ t: (s: string) => s });
import { useInventory } from "@/engines/ops/NexusOpsProvider";
import { AlertTriangle, Clock } from "lucide-react";
import { useNexusFleet } from "@/engines/fleet/NexusFleetProvider";


// ==========================================
// PERFORMANCE-OPTIMIZED SUB-COMPONENTS
// ==========================================

interface ProductCardProps {
    product: Product;
    idx: number;
    showImages: boolean;
    buttonSize: 'small' | 'medium' | 'large';
    isDisabled?: boolean;
    disabledReason?: 'expired' | 'stockout';
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
    const finalPrice = ((product.priceInCents ?? 0) * multiplier) / 100;

    return (
    <motion.div
        layout={performanceMode ? false : "position"}
        initial={performanceMode ? false : { opacity: 0, y: 30 }}
        animate={performanceMode ? false : { opacity: 1, y: 0 }}
        transition={performanceMode ? { duration: 0 } : { 
            delay: idx * 0.02, 
            duration: 0.8, 
            ease: [0.16, 1, 0.3, 1] 
        }}
        exit={performanceMode ? { opacity: 0 } : { opacity: 0, scale: 0.9, transition: { duration: 0.4 } }}
        onClick={() => !isDisabled && onClick(product)}
        className={cn(
            "group rounded-[42px] border border-border/40 overflow-hidden transition-all relative flex flex-col h-full",
            performanceMode ? "duration-0" : "duration-700",
            !performanceMode && "backdrop-blur-xl",
            isDisabled 
                ? "bg-black/5 grayscale cursor-not-allowed border-status-danger/20 shadow-none opacity-60" 
                : "bg-surface-card dark:bg-white/[0.02] cursor-pointer hover:border-action-primary/40 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] active:scale-[0.98]"
        )}
    >
        {/* Compliance Overlays */}
        <AnimatePresence>
            {isDisabled && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 text-center"
                >
                    <div className="w-16 h-16 rounded-full bg-status-danger/20 flex items-center justify-center mb-4">
                        {disabledReason === 'expired' ? (
                            <Clock className="w-8 h-8 text-status-danger animate-pulse" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-status-danger" />
                        )}
                    </div>
                    <span className="text-white font-brand italic text-xl font-bold uppercase tracking-widest drop-shadow-lg">
                        {disabledReason === 'expired' ? 'DLC CRITIQUE' : 'RUPTURE STOCK'}
                    </span>
                    <p className="text-white/70 text-sm mt-2 font-medium">
                        {disabledReason === 'expired' 
                            ? "Produit retiré par mesure d'hygiène" 
                            : "Ingrédients manquants pour ce plat"}
                    </p>
                </motion.div>
            )}
        </AnimatePresence>
        {/* Categorical Glow Aura */}
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-action-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

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
                <div className={cn("absolute inset-0 flex items-center justify-center opacity-40 bg-gradient-to-br from-surface-bg to-border-default")}>
                    <Plus strokeWidth={0.5} className="w-20 h-20 text-text-muted opacity-20" />
                </div>
            )}

            {/* Aesthetic Spotlight Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </div>

        <div className="px-8 pb-8 flex flex-col flex-1">
            <h3 className="text-2xl md:text-2xl font-brand font-black text-text-primary mb-3 group-hover:text-action-primary transition-colors leading-tight italic decoration-action-primary/20 decoration-2 underline-offset-8 group-hover:underline">
                {product.name}
            </h3>

            <p className="text-[12px] md:text-[13px] text-text-muted/80 leading-relaxed flex-1 font-medium font-sans mb-8">
                {product.description || t('pos.fallback_description')}
            </p>

            <div className="flex items-center justify-between border-t border-border-default/30 pt-6">
                <div className="flex items-center gap-4">
                    <span className="text-3xl md:text-3xl font-brand font-black text-text-primary mb-3 group-hover:text-action-primary transition-colors leading-tight italic decoration-action-primary/20 decoration-2 underline-offset-8 group-hover:underline">
                        {finalPrice.toFixed(2)}€
                    </span>
                    {multiplier !== 1 && (
                        <span className="text-xs text-text-muted line-through opacity-50">
                            {((product.priceInCents ?? 0) / 100).toFixed(2)}€
                        </span>
                    )}
                    <div className="flex items-center gap-3 bg-white/5 rounded-full p-1 border border-white/10">
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            className={cn(
                                "rounded-full bg-text-primary text-white dark:bg-white dark:text-black flex items-center justify-center shadow-premium hover:bg-action-primary hover:text-action-primary-fg transition-all duration-500",
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
}

export function ProductGrid({ categoryFilter, products, isLoading, onAddToCart }: ProductGridProps) {
    const selectedProduct = useAtomValue(posSelectedProductAtom);
    const setSelectedProduct = useSetAtom(posSelectedProductAtom as any);
    const isDialogOpen = useAtomValue(posProductDetailsOpenAtom);
    const setIsDialogOpen = useSetAtom(posProductDetailsOpenAtom);
    const searchQuery = useAtomValue(posSearchQueryAtom);
    const setSearchQuery = useSetAtom(posSearchQueryAtom);
    const { t } = useLanguage();
    const inventory = useInventory();
    const { priceMultiplier } = useNexusFleet();
    const performanceMode = useAtomValue(performanceModeAtom);
    const stockItems = inventory.data || [];

    // Read show_images setting from context (defaults to true)
    const showImages = usePageSetting('pos', 'show_images', true);
    const buttonSize = usePageSetting<'small' | 'medium' | 'large'>('pos', 'button_size', 'medium');

    const filteredProductsWithStatus = useMemo(() => {
        const query = searchQuery.toLowerCase();
        const now = new Date();

        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(query);
            const matchesCategory = categoryFilter === "all" || (p as any).category === categoryFilter || (p as any).categoryId === categoryFilter;
            return matchesSearch && matchesCategory;
        }).map(product => {
            // COMPLIANCE GUARD LOGIC
            // Check if unknown required ingredient is completely unavailable or expired
            let isDisabled = false;
            let disabledReason: 'expired' | 'stockout' | undefined;

            if (product.ingredients && product.ingredients.length > 0) {
                for (const req of product.ingredients) {
                    const relatedStock = (stockItems as any as StockItem[]).filter(s => s.ingredientId === req.ingredientId);
                    
                    const nonExpiredStock = relatedStock.filter(s => {
                        const dlc = new Date(s.dlc);
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
    }, [onAddToCart]);

    return (
        <div className="flex-1 flex flex-col h-full bg-surface-bg transition-colors duration-700 overflow-hidden relative">
            {/* Visual Background Glow */}
            <div className="absolute top-1/4 right-0 w-[40%] h-[40%] rounded-full bg-action-primary/5 blur-[120px] pointer-events-none" />

            {/* Top Toolbar - Precision Nav Tier */}
            <div className="px-8 md:px-14 py-8 md:py-8 flex flex-col md:flex-row items-stretch md:items-center justify-center gap-8 md:gap-14 transition-all duration-700 relative z-20">
                <div className="relative flex-1 md:max-w-2xl group">
                    <Search strokeWidth={1} className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-hover:text-action-primary transition-all duration-500" />
                    <input
                        type="text"
                        placeholder={t('pos.search_placeholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface-card dark:bg-white/5 border border-border-default/50 rounded-[28px] md:rounded-[32px] pl-16 pr-8 py-4 md:py-5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:border-action-primary/50 focus:ring-4 focus:ring-action-primary/5 transition-all duration-700 font-brand italic shadow-premium hover:border-action-primary/30"
                    />
                </div>
            </div>

            {/* Product Grid - Exhibition Deck */}
            <div className="flex-1 p-6 md:p-12 overflow-y-auto scrollbar-hide relative z-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 2xl:grid-cols-3 gap-10 md:gap-14">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <div className="col-span-full flex items-center justify-center py-20">
                                <div className="w-12 h-12 border-4 border-action-primary/20 border-t-action-primary rounded-full animate-spin" />
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
                                <p className="text-text-muted font-brand italic">Aucun produit trouvé dans cette catégorie</p>
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
