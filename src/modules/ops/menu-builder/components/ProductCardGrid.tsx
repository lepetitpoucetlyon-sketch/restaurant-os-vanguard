"use client";

import { motion } from "framer-motion";
import { Plus, Settings2, ChefHat, Tag, Link2, AlertTriangle } from "lucide-react";
import { SearchInput } from "@components/ui/SearchInput";
import { formatMu } from "@/modules/finance";
import type { Product } from "@nexus/contracts";
import type { JsonObject } from "@/shared/types/json";

interface ProductCardGridProps {
    products: Product[];
    searchQuery: string;
    onSearchChange: (q: string) => void;
    onOpenEditor: (product: Product) => void;
}

export function ProductCardGrid({
    products,
    searchQuery,
    onSearchChange,
    onOpenEditor,
}: ProductCardGridProps) {
    return (
        <div className="flex-1 flex flex-col bg-bg-secondary rounded-[2.5rem] border border-border shadow-premium overflow-hidden">
            <div className="p-6 border-b border-border/50 flex items-center justify-between">
                <h2 className="text-xl font-brand font-black text-text-primary">Produits</h2>
                <div className="flex items-center gap-4">
                    <div className="w-64">
                        <SearchInput
                            value={searchQuery}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
                            placeholder="Rechercher un plat..."
                        />
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-brand-primary text-text-primary rounded-2xl font-bold hover:bg-brand-primary/90 transition-all">
                        <Plus className="w-5 h-5" />
                        Ajouter
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {products.length === 0 && (
                    <p className="text-center text-text-muted py-12 font-medium">Aucun produit dans cette catégorie.</p>
                )}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {products.map(product => {
                        const allergens: string[] = (product as JsonObject).allergens as string[] || [];
                        return (
                            <motion.div
                                key={product.id}
                                layoutId={product.id}
                                className="flex items-center justify-between p-4 bg-bg-tertiary border border-border/50 rounded-2xl hover:border-brand-primary/50 transition-all cursor-pointer group"
                                onClick={() => onOpenEditor(product)}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-bg-primary border border-border flex items-center justify-center">
                                        <Tag className="w-5 h-5 text-text-muted" />
                                    </div>
                                    <div>
                                        <h3 className="font-black text-text-primary">{product.name}</h3>
                                        <p className="text-sm font-bold text-text-muted mt-1">{formatMu(product.priceInMicrounits || 0)}</p>
                                        {allergens.length > 0 && (
                                            <div className="flex items-center gap-1 mt-1">
                                                <AlertTriangle className="w-3 h-3 text-status-warning" />
                                                <span className="text-xs text-status-warning font-bold">
                                                    {allergens.length} allergène{allergens.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {(product as JsonObject).recipeId ? (
                                        <span className="px-3 py-1 bg-status-success/10 text-status-success text-xs font-bold rounded-lg flex items-center gap-1">
                                            <Link2 className="w-3 h-3" />
                                            Lié
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-status-warning/10 text-status-warning text-xs font-bold rounded-lg flex items-center gap-1">
                                            <ChefHat className="w-3 h-3" />
                                            Libre
                                        </span>
                                    )}
                                    <Settings2 className="w-5 h-5 text-text-muted group-hover:text-brand-primary transition-colors" />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
