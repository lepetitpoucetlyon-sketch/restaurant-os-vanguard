'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Leaf, AlertTriangle, Search, ChefHat, Beef } from 'lucide-react';
import { cn } from '@/lib/ui.foundations';
import { Nexus } from '@/lib/nexus/NexusAdapter';
import { formatCurrency } from '@/lib/formatters';
import { isProductInCategory } from "@/shared/utils/categoryMatcher";

interface ProductItem {
    id: string;
    name: string;
    description?: string;
    priceInMicrounits?: number;
    priceInCents?: number;
    categoryId?: string;
    allergens?: string[];
    faitMaison?: boolean;
    meatOrigin?: string;
    nutrition?: Record<string, unknown>;
    availability?: string;
    imageUrl?: string;
}

interface CategoryItem {
    id: string;
    name: string;
    order?: number;
}

const ALLERGEN_LABELS: Record<string, string> = {
    gluten: 'Gluten', crustaceans: 'Crustacés', eggs: 'Œufs', fish: 'Poisson',
    peanuts: 'Arachides', soy: 'Soja', milk: 'Lait', nuts: 'Fruits à coque',
    celery: 'Céleri', mustard: 'Moutarde', sesame: 'Sésame', sulphites: 'Sulfites',
    lupin: 'Lupin', molluscs: 'Mollusques',
};

export default function PublicMenuPage() {
    const params = useParams();
    const tenantId = params.tenantId as string;
    const tableId = params.tableId as string;

    const [products, setProducts] = useState<ProductItem[]>([]);
    const [categories, setCategories] = useState<CategoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [excludedAllergens, setExcludedAllergens] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!tenantId) return;
        let cancelled = false;
        async function load() {
            const [prods, cats] = await Promise.all([
                Nexus.adapter.query<ProductItem>(`tenants/${tenantId}/products`),
                Nexus.adapter.query<CategoryItem>(`tenants/${tenantId}/categories`),
            ]);
            if (cancelled) return;
            setProducts(prods.filter(p => p.availability !== 'out_of_stock'));
            setCategories(cats.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
            setLoading(false);
        }
        load();
        return () => { cancelled = true; };
    }, [tenantId]);

    const allAllergens = useMemo(() => {
        const set = new Set<string>();
        products.forEach(p => p.allergens?.forEach(a => set.add(a)));
        return Array.from(set).sort();
    }, [products]);

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            if (!isProductInCategory(p, selectedCategory, categories)) return false;
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                if (!p.name.toLowerCase().includes(q) && !(p.description ?? '').toLowerCase().includes(q)) return false;
            }
            if (excludedAllergens.size > 0 && p.allergens?.some(a => excludedAllergens.has(a))) return false;
            return true;
        });
    }, [products, selectedCategory, categories, searchQuery, excludedAllergens]);

    const toggleAllergen = (allergen: string) => {
        setExcludedAllergens(prev => {
            const next = new Set(prev);
            if (next.has(allergen)) next.delete(allergen); else next.add(allergen);
            return next;
        });
    };

    const getPrice = (p: ProductItem): string => {
        if (p.priceInMicrounits) return formatCurrency(p.priceInMicrounits);
        if (p.priceInCents) return `${(p.priceInCents / 100).toFixed(2)} €`;
        return '—';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-bg-primary">
                <div className="w-6 h-6 border-2 border-accent-gold/30 border-t-accent-gold rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bg-primary pb-8">
            {/* Header */}
            <div className="sticky top-0 z-40 bg-surface-card/90 backdrop-blur-xl border-b border-border/50 px-4 py-4">
                <h1 className="text-lg font-black font-serif italic text-text-primary tracking-tight">
                    Menu <span className="text-accent-gold">.</span>
                </h1>
                <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">
                    Table {tableId}
                </p>

                {/* Search */}
                <div className="mt-3 flex items-center gap-2 border border-border rounded-xl px-3 h-10 bg-bg-primary focus-within:border-accent-gold/50 transition-colors">
                    <Search className="w-3.5 h-3.5 text-text-muted" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Rechercher un plat..."
                        className="flex-1 bg-transparent text-[12px] text-text-primary placeholder:text-text-muted/50 focus:outline-none"
                    />
                </div>

                {/* Category strip */}
                <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={cn(
                            'h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all',
                            selectedCategory === 'all' ? 'bg-accent-gold text-text-primary' : 'bg-bg-tertiary text-text-muted'
                        )}
                    >
                        Tout
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setSelectedCategory(cat.id)}
                            className={cn(
                                'h-8 px-4 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all',
                                selectedCategory === cat.id ? 'bg-accent-gold text-text-primary' : 'bg-bg-tertiary text-text-muted'
                            )}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Allergen filters */}
                {allAllergens.length > 0 && (
                    <div className="mt-3">
                        <p className="text-[8px] font-black uppercase tracking-widest text-text-muted mb-1.5 flex items-center gap-1">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Exclure allergènes
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {allAllergens.map(a => (
                                <button
                                    key={a}
                                    onClick={() => toggleAllergen(a)}
                                    className={cn(
                                        'h-6 px-2.5 rounded-full text-[8px] font-bold uppercase tracking-wider transition-all border',
                                        excludedAllergens.has(a)
                                            ? 'bg-status-error/10 border-status-error/30 text-status-error'
                                            : 'bg-bg-tertiary border-border text-text-muted'
                                    )}
                                >
                                    {ALLERGEN_LABELS[a] ?? a}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Products */}
            <div className="px-4 mt-4 space-y-3">
                {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 text-text-muted text-xs">
                        Aucun plat ne correspond à votre recherche
                    </div>
                ) : (
                    filteredProducts.map(product => (
                        <div key={product.id} className="rounded-2xl border border-border bg-surface-card p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-text-primary truncate">{product.name}</h3>
                                        {product.faitMaison && (
                                            <span className="shrink-0 flex items-center gap-1 text-[8px] font-bold text-status-success bg-status-success/10 px-1.5 py-0.5 rounded-full">
                                                <ChefHat className="w-2.5 h-2.5" />
                                                Fait maison
                                            </span>
                                        )}
                                    </div>
                                    {product.description && (
                                        <p className="text-[11px] text-text-muted mt-1 line-clamp-2">{product.description}</p>
                                    )}
                                    {product.meatOrigin && (
                                        <span className="inline-flex items-center gap-1 mt-1 text-[8px] text-text-muted">
                                            <Beef className="w-2.5 h-2.5" />
                                            Origine : {product.meatOrigin}
                                        </span>
                                    )}
                                    {product.allergens && product.allergens.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {product.allergens.map(a => (
                                                <span key={a} className="text-[7px] font-bold uppercase tracking-wider text-amber-600 dark:text-action-primary bg-action-primary/10 px-1.5 py-0.5 rounded">
                                                    {ALLERGEN_LABELS[a] ?? a}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <span className="text-base font-mono font-bold text-accent-gold ml-3 shrink-0">
                                    {getPrice(product)}
                                </span>
                            </div>
                        </div>
                    ))
                )}

                {/* Legal footer */}
                <div className="mt-8 text-center">
                    <p className="text-[9px] text-text-muted">
                        <Leaf className="w-3 h-3 inline-block mr-1" />
                        Tous les prix sont TTC · Allergènes : nous consulter pour toute question
                    </p>
                </div>
            </div>
        </div>
    );
}
