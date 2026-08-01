"use client";

import { useState, useMemo, useCallback } from "react";
import { formatMu } from "@/modules/finance/components/financeUtils";
import { toMicrounits } from "@/domain/schemas/primitives";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@components/ui/PageHeader";
import { Plus, GripVertical, Settings2, ChefHat, Tag, Link2, AlertTriangle, Loader2, Save } from "lucide-react";
import { SearchInput } from "@components/ui/SearchInput";
import { useProducts } from "@/modules/logistics/stock/inventory/hooks/useProducts";
import { useCategories } from "@/modules/logistics/stock/inventory/hooks/useCategories";
import { Nexus } from "@/lib/nexus/NexusAdapter";
import { Product } from "@nexus/contracts";
import { withPageGuard } from "@/shared/components/rbac/PageGuard";

const COMMON_ALLERGENS = [
    { id: 'gluten', name: 'Gluten', icon: '🌾' },
    { id: 'crustaceans', name: 'Crustacés', icon: '🦐' },
    { id: 'eggs', name: 'Œufs', icon: '🥚' },
    { id: 'fish', name: 'Poisson', icon: '🐟' },
    { id: 'peanuts', name: 'Arachides', icon: '🥜' },
    { id: 'soy', name: 'Soja', icon: '🫘' },
    { id: 'milk', name: 'Lait', icon: '🥛' },
    { id: 'nuts', name: 'Fruits à coque', icon: '🌰' },
    { id: 'celery', name: 'Céleri', icon: '🥬' },
    { id: 'mustard', name: 'Moutarde', icon: '🟡' },
    { id: 'sesame', name: 'Sésame', icon: '⚪' },
    { id: 'sulfites', name: 'Sulfites', icon: '🍷' },
    { id: 'lupin', name: 'Lupin', icon: '🌸' },
    { id: 'molluscs', name: 'Mollusques', icon: '🦪' },
];

interface EditForm {
    name: string;
    priceEuros: string;
    taxRate: string;
    allergens: string[];
    recipeId: string;
}

function MenuBuilderPage() {
    const { data: products, isLoading: productsLoading } = useProducts();
    const { data: categories, isLoading: categoriesLoading } = useCategories();

    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [editForm, setEditForm] = useState<EditForm>({ name: '', priceEuros: '', taxRate: '0.10', allergens: [], recipeId: '' });
    const [saving, setSaving] = useState(false);

    const activeCategory = selectedCategory || categories[0]?.id || '';

    const filteredProducts = useMemo(() =>
        products.filter(p =>
            p.categoryId === activeCategory &&
            p.name.toLowerCase().includes(searchQuery.toLowerCase())
        ),
        [products, activeCategory, searchQuery]
    );

    const openEditor = useCallback((product: Product) => {
        setEditingProduct(product);
        const priceMu = product.priceInMicrounits || 0;
        setEditForm({
            name: product.name,
            priceEuros: (priceMu / 1_000_000).toFixed(2),
            taxRate: (product as any).taxRate || '0.10',
            allergens: (product as any).allergens || [],
            recipeId: (product as any).recipeId || '',
        });
    }, []);

    const toggleAllergen = useCallback((id: string) => {
        setEditForm(prev => ({
            ...prev,
            allergens: prev.allergens.includes(id)
                ? prev.allergens.filter(a => a !== id)
                : [...prev.allergens, id]
        }));
    }, []);

    const saveProduct = useCallback(async () => {
        if (!editingProduct) return;
        setSaving(true);
        try {
            const priceInMicrounits = toMicrounits(parseFloat(editForm.priceEuros) || 0);
            const path = Nexus.getTenantPath(`products/${editingProduct.id}`);
            await Nexus.adapter.update(path, {
                name: editForm.name,
                priceInMicrounits,
                taxRate: editForm.taxRate,
                allergens: editForm.allergens,
                recipeId: editForm.recipeId || null,
                updatedAt: Date.now(),
            });
            setEditingProduct(null);
        } catch (err) {
            console.error('[MenuBuilder] Save failed', err);
        } finally {
            setSaving(false);
        }
    }, [editingProduct, editForm]);

    const isLoading = productsLoading || categoriesLoading;

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-bg-primary items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
                <p className="text-text-muted font-bold">Chargement du menu...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-bg-primary">
            <PageHeader
                title="Menu Builder"
                subtitle="Gestion de la carte, des prix, allergènes et liaison recettes."
                icon={ChefHat}
            />

            <div className="flex flex-1 overflow-hidden mt-6 gap-6 px-6 pb-6">

                {/* CATEGORIES SIDEBAR */}
                <div className="w-80 flex flex-col bg-bg-secondary rounded-[2.5rem] border border-border shadow-premium overflow-hidden">
                    <div className="p-6 border-b border-border/50">
                        <h2 className="text-xl font-brand font-black text-text-primary mb-4">Catégories</h2>
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-primary text-text-primary rounded-2xl font-bold hover:bg-brand-primary/90 transition-all">
                            <Plus className="w-5 h-5" />
                            Nouvelle Catégorie
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2">
                        {categories.length === 0 && (
                            <p className="text-sm text-text-muted p-4 text-center">Aucune catégorie. Créez-en une pour commencer.</p>
                        )}
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                    activeCategory === cat.id
                                        ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                                        : 'bg-bg-tertiary border-transparent text-text-secondary hover:bg-bg-tertiary/80'
                                } border`}
                            >
                                <span className="font-bold">{cat.name}</span>
                                <GripVertical className="w-4 h-4 opacity-30" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* PRODUCTS LIST */}
                <div className="flex-1 flex flex-col bg-bg-secondary rounded-[2.5rem] border border-border shadow-premium overflow-hidden">
                    <div className="p-6 border-b border-border/50 flex items-center justify-between">
                        <h2 className="text-xl font-brand font-black text-text-primary">Produits</h2>
                        <div className="flex items-center gap-4">
                            <div className="w-64">
                                <SearchInput
                                    value={searchQuery}
                                    onChange={(e: any) => setSearchQuery(e.target.value)}
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
                        {filteredProducts.length === 0 && (
                            <p className="text-center text-text-muted py-12 font-medium">Aucun produit dans cette catégorie.</p>
                        )}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredProducts.map(product => {
                                const allergens: string[] = (product as any).allergens || [];
                                return (
                                    <motion.div
                                        key={product.id}
                                        layoutId={product.id}
                                        className="flex items-center justify-between p-4 bg-bg-tertiary border border-border/50 rounded-2xl hover:border-brand-primary/50 transition-all cursor-pointer group"
                                        onClick={() => openEditor(product)}
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
                                            {(product as any).recipeId ? (
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

            </div>

            {/* PRODUCT EDITOR OVERLAY */}
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
                                    onClick={() => setEditingProduct(null)}
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
                                        onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Prix de vente TTC (EUR)</label>
                                        <input
                                            type="number"
                                            value={editForm.priceEuros}
                                            onChange={e => setEditForm(prev => ({ ...prev, priceEuros: e.target.value }))}
                                            step="0.01"
                                            min="0"
                                            className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Taux de TVA</label>
                                        <select
                                            value={editForm.taxRate}
                                            onChange={e => setEditForm(prev => ({ ...prev, taxRate: e.target.value }))}
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
                                                    onClick={() => toggleAllergen(allergen.id)}
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
                                            onChange={e => setEditForm(prev => ({ ...prev, recipeId: e.target.value }))}
                                            placeholder="ID de la recette (optionnel)"
                                            className="flex-1 bg-transparent border-none font-bold text-text-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-border bg-bg-tertiary flex justify-end">
                                <button
                                    onClick={saveProduct}
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
        </div>
    );
}

export default withPageGuard(MenuBuilderPage, "menu_builder");
