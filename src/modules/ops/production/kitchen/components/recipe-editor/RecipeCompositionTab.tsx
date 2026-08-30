// @wip owner:ops-team échéance:2026-Q4 — composant orphelin à intégrer ou supprimer (audit orphelins 2026-08-30)
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, UtensilsCrossed, DollarSign } from "lucide-react";
import { Button } from "@ui/Button";
import { PremiumSelect } from "@ui/PremiumSelect";
import { Recipe, RecipeIngredient } from "@nexus/contracts";

interface RecipeCompositionTabProps {
    formData: Partial<Recipe>;
    newIngredient: Partial<RecipeIngredient>;
    setNewIngredient: (data: Partial<RecipeIngredient> | ((prev: Partial<RecipeIngredient>) => Partial<RecipeIngredient>)) => void;
    handleAddIngredient: () => void;
    handleRemoveIngredient: (id: string) => void;
}

export function RecipeCompositionTab({
    formData,
    newIngredient,
    setNewIngredient,
    handleAddIngredient,
    handleRemoveIngredient
}: RecipeCompositionTabProps) {
    return (
        <div className="space-y-10">
            <div className="bg-bg-tertiary p-8 rounded-[3rem] border-2 border-dashed border-border">
                <h3 className="font-serif font-black text-xl mb-6">Ajouter un Élement</h3>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                    <div className="sm:col-span-12 md:col-span-8">
                        <input
                            type="text"
                            placeholder="Nom du composant..."
                            value={newIngredient.name}
                            onChange={(e) => setNewIngredient((prev: Partial<RecipeIngredient>) => ({ ...prev, name: e.target.value }))}
                            className="w-full h-14 px-6 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold outline-none"
                        />
                    </div>
                    <div className="sm:col-span-6 md:col-span-2">
                        <input
                            type="number"
                            placeholder="Qté"
                            value={newIngredient.quantity || ''}
                            onChange={(e) => setNewIngredient((prev: Partial<RecipeIngredient>) => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                            className="w-full h-14 px-6 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold outline-none"
                        />
                    </div>
                    <div className="sm:col-span-6 md:col-span-2">
                        <PremiumSelect
                            value={newIngredient.unit || 'g'}
                            onChange={(val) => setNewIngredient((prev: Partial<RecipeIngredient>) => ({ ...prev, unit: val }))}
                            options={['g', 'kg', 'L', 'cl', 'ml', 'pièces'].map(u => ({ value: u, label: u }))}
                        />
                    </div>
                    <div className="sm:col-span-6 md:col-span-4">
                        <div className="relative">
                            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                            <input
                                type="number"
                                placeholder="Coût Unitaire"
                                value={newIngredient.costInCents ? (newIngredient.costInCents / 100) : ''}
                                onChange={(e) => setNewIngredient((prev: Partial<RecipeIngredient>) => ({ ...prev, costInCents: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                                className="w-full h-14 pl-10 pr-6 bg-surface-card rounded-2xl border-2 border-transparent focus:border-accent font-bold outline-none"
                            />
                        </div>
                    </div>
                    <div className="sm:col-span-6 md:col-span-8">
                        <Button onClick={handleAddIngredient} className="w-full h-14 bg-action-primary hover:bg-action-primary-hover text-text-on-primary rounded-2xl font-black uppercase text-nano tracking-widest transition-all">
                            <Plus className="w-4 h-4 mr-2" /> Valider l'Ingrédient
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-nano font-black text-text-muted uppercase tracking-[0.2em] mb-4 block">Nomenclature des Ingrédients</label>
                <AnimatePresence mode="popLayout">
                    {formData.ingredients?.map((ing, idx) => (
                        <motion.div
                            key={String(ing.id || idx)}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="group flex items-center justify-between p-6 bg-surface-card rounded-[2rem] border border-border shadow-sm hover:shadow-md transition-all text-primary"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-10 h-10 rounded-xl bg-bg-tertiary flex items-center justify-center font-black text-nano text-text-muted">
                                    {idx + 1}
                                </div>
                                <div>
                                    <p className="font-black text-text-primary">{ing.name}</p>
                                    <p className="text-nano font-bold text-text-muted uppercase tracking-wider mt-1">{ing.quantity} {ing.unit}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <span className="text-lg font-black text-accent">{(Number(ing.costInCents || 0) / 100).toFixed(2)}€</span>
                                <button
                                    onClick={() => handleRemoveIngredient(String(ing.id || ''))}
                                    className="w-10 h-10 rounded-xl bg-error/5 hover:bg-error/10 text-error flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
                {(!formData.ingredients || formData.ingredients.length === 0) && (
                    <div className="py-20 text-center bg-bg-tertiary rounded-[3rem] border border-border/50">
                        <UtensilsCrossed className="w-12 h-12 text-text-muted/20 mx-auto mb-4" />
                        <p className="text-text-muted font-bold italic">Aucun ingrédient défini pour cette recette.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
