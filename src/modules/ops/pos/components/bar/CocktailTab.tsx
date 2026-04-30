"use client";

import React from "react";
import { 
  Plus, 
  Star, 
  Martini, 
  TrendingUp 
} from "lucide-react";
import { Button } from "@ui/button";
import { Cocktail } from "@domain/types/bar";
import { formatCurrency } from "@/lib/formatters";

interface CocktailTabProps {
  cocktails: Cocktail[];
  setShowCocktailModal: (show: boolean) => void;
  setEditingCocktail: (cocktail: Cocktail | null) => void;
}

export const CocktailTab: React.FC<CocktailTabProps> = ({ 
  cocktails,
  setShowCocktailModal,
  setEditingCocktail
}) => {
  return (
    <div className="animate-in fade-in duration-150">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h2 className="text-2xl font-black text-text-primary">Carte des Cocktails</h2>
                <p className="text-text-muted text-sm mt-1">Recettes et fiches techniques bar</p>
            </div>
            <Button
                onClick={() => {
                    setEditingCocktail(null);
                    setShowCocktailModal(true);
                }}
                className="h-11 bg-accent hover:bg-accent/90 rounded-xl"
            >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau Cocktail
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cocktails.map((cocktail) => (
                <div
                    key={cocktail.id}
                    className="bg-bg-secondary rounded-2xl p-6 border border-border shadow-sm hover:shadow-lg transition-all relative"
                >
                    {cocktail.isSignature && (
                        <div className="absolute top-4 right-4 px-2 py-1 bg-warning-soft dark:bg-warning/10 text-warning text-[10px] font-black rounded-md flex items-center gap-1">
                            <Star className="w-3 h-3 fill-warning" />
                            SIGNATURE
                        </div>
                    )}

                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center mb-4">
                        <Martini className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="font-black text-xl text-text-primary">{cocktail.name}</h3>
                    <p className="text-sm text-text-muted mb-4">{cocktail.category}</p>

                    <div className="space-y-2 mb-4">
                        <p className="text-[11px] font-black text-text-muted uppercase">Ingrédients</p>
                        <div className="flex flex-wrap gap-1">
                            {cocktail.ingredients.map((ing, i) => (
                                <span key={i} className="px-2 py-1 bg-bg-primary dark:bg-bg-tertiary rounded-md text-[11px] font-bold text-text-muted">
                                    {ing}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border/30">
                        <div>
                            <p className="text-2xl font-black text-[#722F37] dark:text-text-primary">{formatCurrency(cocktail.priceInCents)}</p>
                            <p className="text-[10px] text-success font-bold">
                                Marge: {(((cocktail.priceInCents - cocktail.costPriceInCents) / cocktail.priceInCents) * 100).toFixed(0)}%
                            </p>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                            <TrendingUp className="w-4 h-4 text-success" />
                            <span className="font-bold text-text-muted">{cocktail.popularity}%</span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};
