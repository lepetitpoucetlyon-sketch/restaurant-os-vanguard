"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ChefHat, AlertTriangle, Loader2, Save } from "lucide-react";
import type { Product } from "@nexus/contracts";
import { COMMON_ALLERGENS, type MenuBuilderEditForm } from "../menuBuilderConstants";

interface ProductEditModalProps {
    editingProduct: Product | null;
    editForm: MenuBuilderEditForm;
    saving: boolean;
    onClose: () => void;
    onFormChange: (updater: (prev: MenuBuilderEditForm) => MenuBuilderEditForm) => void;
    onToggleAllergen: (id: string) => void;
    onSave: () => Promise<void>;
}

export function ProductEditModal({
    editingProduct,
    editForm,
    saving,
    onClose,
    onFormChange,
    onToggleAllergen,
    onSave,
}: ProductEditModalProps) {
    return (
        <AnimatePresence>
            {editingProduct && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                >
                    <motion.div
                        layoutId={editingProduct.id}
                        className="w-full max-w-2xl bg-bg-secondary rounded-[2.5rem] shadow-2xl border border-border overflow-hidden max-h-[90vh] flex flex-col"
                    >
                        <div className="p-6 border-b border-border flex items-center justify-between bg-bg-tertiary">
                            <h2 className="text-2xl font-black text-text-primary">Éditer le produit</h2>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-bg-primary rounded-xl font-bold hover:bg-border transition-colors border border-border"
                            >
                                Fermer
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Nom du produit</label>
                                <input
                                    type="text"
                                    value={editForm.name}
                                    onChange={e => onFormChange(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Prix de vente TTC (EUR)</label>
                                    <input
                                        type="number"
                                        value={editForm.priceEuros}
                                        onChange={e => onFormChange(prev => ({ ...prev, priceEuros: e.target.value }))}
                                        step="0.01"
                                        min="0"
                                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Taux de TVA</label>
                                    <select
                                        value={editForm.taxRate}
                                        onChange={e => onFormChange(prev => ({ ...prev, taxRate: e.target.value }))}
                                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                    >
                                        <option value="0.10">10% (Sur Place)</option>
                                        <option value="0.055">5.5% (A Emporter)</option>
                                        <option value="0.20">20% (Alcool)</option>
                                    </select>
                                </div>
                            </div>

                            {/* ALLERGENS SECTION (INCO) */}
                            <div className="pt-6 mt-2 border-t border-border">
                                <h3 className="text-lg font-black text-text-primary mb-2 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-status-warning" />
                                    Allergènes (INCO)
                                </h3>
                                <p className="text-sm text-text-muted mb-4 font-medium">
                                    Obligation légale : déclarer les 14 allergènes majeurs (Règlement UE 1169/2011).
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {COMMON_ALLERGENS.map(allergen => {
                                        const selected = editForm.allergens.includes(allergen.id);
                                        return (
                                            <button
                                                key={allergen.id}
                                                type="button"
                                                onClick={() => onToggleAllergen(allergen.id)}
                                                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all border ${
                                                    selected
                                                        ? 'bg-status-warning/15 border-status-warning text-status-warning'
                                                        : 'bg-bg-tertiary border-border/50 text-text-muted hover:border-border'
                                                }`}
                                            >
                                                <span>{allergen.icon}</span>
                                                <span>{allergen.name}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* RECIPE LINK */}
                            <div className="pt-6 mt-2 border-t border-border">
                                <h3 className="text-lg font-black text-text-primary mb-4 flex items-center gap-2">
                                    <ChefHat className="w-5 h-5 text-brand-primary" />
                                    Liaison Recette & Stock
                                </h3>
                                <p className="text-sm text-text-muted mb-4 font-medium">
                                    Pour que le stock soit déduit automatiquement à chaque commande, lier ce plat à une recette.
                                </p>

                                <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-2xl border border-border">
                                    <input
                                        type="text"
                                        value={editForm.recipeId}
                                        onChange={e => onFormChange(prev => ({ ...prev, recipeId: e.target.value }))}
                                        placeholder="ID de la recette (optionnel)"
                                        className="flex-1 bg-transparent border-none font-bold text-text-primary focus:outline-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-border bg-bg-tertiary flex justify-end">
                            <button
                                onClick={onSave}
                                disabled={saving}
                                className="px-8 py-4 bg-brand-primary text-text-primary rounded-2xl font-black text-lg hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                                {saving ? 'Enregistrement...' : 'Enregistrer'}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
