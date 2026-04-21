"use client";

import { motion } from "framer-motion";
import { DollarSign } from "lucide-react";
import { cn } from "@/lib/ui.foundations";
import { Recipe } from "@/types";

interface RecipeAnalyticTabProps {
    formData: Partial<Recipe>;
    setFormDraft: (data: Partial<Recipe> | ((prev: Partial<Recipe>) => Partial<Recipe>)) => void;
    initialFormData: Partial<Recipe>;
    margin: string;
    allergens: string[];
    dietary: string[];
    toggleAllergen: (allergen: string) => void;
    toggleDietary: (diet: string) => void;
}

export function RecipeAnalyticTab({
    formData,
    setFormDraft,
    initialFormData,
    margin,
    allergens,
    dietary,
    toggleAllergen,
    toggleDietary
}: RecipeAnalyticTabProps) {
    return (
        <div className="space-y-12 text-neutral-900">
            <div className="grid grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-border shadow-soft">
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Coût de Revient HT</label>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-serif font-black text-text-primary">{((formData.costPriceInCents || 0) / 100).toFixed(2)}</span>
                        <span className="text-xl font-black text-text-muted">€</span>
                    </div>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border-2 border-accent shadow-xl shadow-accent/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-accent/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
                    <label className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-4 block">Prix de Vente Conseillé</label>
                    <div className="flex items-center gap-2 relative z-10">
                        <input
                            type="number"
                            step="0.01"
                            value={formData.sellingPriceInCents ? (formData.sellingPriceInCents / 100) : ''}
                            onChange={(e) => setFormDraft((prev: Partial<Recipe>) => ({ ...(prev ?? initialFormData), sellingPriceInCents: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                            className="w-full bg-transparent text-4xl font-serif font-black text-text-primary outline-none"
                            placeholder="0.00"
                        />
                        <span className="text-2xl font-black text-text-primary">€</span>
                    </div>
                </div>
                <div className={cn(
                    "p-10 rounded-[3rem] border shadow-soft flex flex-col justify-center",
                    parseFloat(margin) >= 60 ? "bg-success-soft border-success/20" :
                        parseFloat(margin) >= 40 ? "bg-warning-soft border-warning/20" :
                            "bg-error-soft border-error/20"
                )}>
                    <label className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Marge Brute Estimée</label>
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "text-4xl font-serif font-black",
                            parseFloat(margin) >= 60 ? "text-success" :
                                parseFloat(margin) >= 40 ? "text-warning" :
                                    "text-error"
                        )}>{margin}</span>
                        <span className="text-xl font-black text-text-muted">%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-10">
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] px-4">Bioshield Allergen Matrix</h4>
                    <div className="flex flex-wrap gap-3">
                        {allergens.map(a => (
                            <button
                                key={a}
                                onClick={() => toggleAllergen(a)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                    formData.allergens?.includes(a)
                                        ? "bg-error text-white border-error shadow-lg shadow-error/20"
                                        : "bg-white text-text-muted border-border hover:border-text-muted/30"
                                )}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-text-muted uppercase tracking-[0.15em] px-4">Dietary Compliance Shield</h4>
                    <div className="flex flex-wrap gap-3">
                        {dietary.map(d => (
                            <button
                                key={d}
                                onClick={() => toggleDietary(d)}
                                className={cn(
                                    "px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border-2",
                                    formData.dietaryInfo?.includes(d)
                                        ? "bg-success text-white border-success shadow-lg shadow-success/20"
                                        : "bg-white text-text-muted border-border hover:border-text-muted/30"
                                )}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
