"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageHeader } from "@components/ui/PageHeader";
import { Plus, GripVertical, Settings2, ChefHat, Tag, Link2 } from "lucide-react";
import { SearchInput } from "@components/ui/SearchInput";

// Mocks for now - will be replaced by actual data fetching
const mockCategories = [
    { id: 'cat_1', name: 'Plats Principaux', active: true },
    { id: 'cat_2', name: 'Boissons & Cocktails', active: true },
    { id: 'cat_3', name: 'Desserts', active: true },
];

const mockProducts = [
    { id: 'p_1', categoryId: 'cat_1', name: 'Burger Maison', priceInCents: 1500, recipeId: 'rec_1', active: true },
    { id: 'p_2', categoryId: 'cat_1', name: 'Salade César', priceInCents: 1200, recipeId: null, active: true },
    { id: 'p_3', categoryId: 'cat_2', name: 'Mojito Royal', priceInCents: 900, recipeId: 'rec_3', active: true },
    { id: 'p_4', categoryId: 'cat_2', name: 'Coca Cola', priceInCents: 400, recipeId: null, active: true },
];

export default function MenuBuilderPage() {
    const [selectedCategory, setSelectedCategory] = useState<string>('cat_1');
    const [searchQuery, setSearchQuery] = useState("");
    const [editingProduct, setEditingProduct] = useState<{ id: string; categoryId: string; name: string; priceInCents: number; recipeId: string | null; active: boolean } | null>(null);

    const filteredProducts = mockProducts.filter(p => 
        p.categoryId === selectedCategory &&
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-bg-primary">
            <PageHeader 
                title="Menu Builder" 
                subtitle="Gestion de la carte, des prix et liaison avec les recettes du chef."
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
                        {mockCategories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${
                                    selectedCategory === cat.id 
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
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {filteredProducts.map(product => (
                                <motion.div 
                                    key={product.id}
                                    layoutId={product.id}
                                    className="flex items-center justify-between p-4 bg-bg-tertiary border border-border/50 rounded-2xl hover:border-brand-primary/50 transition-all cursor-pointer group"
                                    onClick={() => setEditingProduct(product)}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-bg-primary border border-border flex items-center justify-center">
                                            <Tag className="w-5 h-5 text-text-muted" />
                                        </div>
                                        <div>
                                            <h3 className="font-black text-text-primary">{product.name}</h3>
                                            <p className="text-sm font-bold text-text-muted mt-1">{(product.priceInCents / 100).toFixed(2)} €</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        {product.recipeId ? (
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
                            ))}
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
                            className="w-full max-w-2xl bg-bg-secondary rounded-[2.5rem] shadow-2xl border border-border overflow-hidden"
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
                            
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Nom du produit</label>
                                    <input 
                                        type="text" 
                                        defaultValue={editingProduct.name}
                                        className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                    />
                                </div>
                                
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Prix de vente TTC (€)</label>
                                        <input 
                                            type="number" 
                                            defaultValue={(editingProduct.priceInCents / 100).toFixed(2)}
                                            step="0.01"
                                            className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-text-muted uppercase tracking-wider">Taux de TVA</label>
                                        <select className="w-full bg-bg-tertiary border border-border rounded-xl px-4 py-3 font-bold text-text-primary focus:outline-none focus:border-brand-primary">
                                            <option value="10">10% (Sur Place)</option>
                                            <option value="5.5">5.5% (À Emporter)</option>
                                            <option value="20">20% (Alcool)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-border">
                                    <h3 className="text-lg font-black text-text-primary mb-4 flex items-center gap-2">
                                        <ChefHat className="w-5 h-5 text-brand-primary" />
                                        Liaison Recette & Stock
                                    </h3>
                                    <p className="text-sm text-text-muted mb-4 font-medium">
                                        Pour que le stock soit déduit automatiquement à chaque commande, lier ce plat à une recette.
                                    </p>
                                    
                                    <div className="flex items-center gap-4 p-4 bg-bg-primary rounded-2xl border border-border">
                                        <select className="flex-1 bg-transparent border-none font-bold text-text-primary focus:outline-none">
                                            <option value="">-- Aucune recette liée --</option>
                                            <option value="rec_1" selected={editingProduct.recipeId === 'rec_1'}>Recette Burger v2 (Food Cost: 4.50€)</option>
                                            <option value="rec_2" selected={editingProduct.recipeId === 'rec_2'}>Salade César (Food Cost: 2.10€)</option>
                                            <option value="rec_3" selected={editingProduct.recipeId === 'rec_3'}>Fiche Technique : Mojito (Rhum, Menthe, Sucre) - FC: 1.20€</option>
                                        </select>
                                        <button className="px-6 py-3 bg-brand-primary text-text-primary rounded-xl font-bold">
                                            Lier
                                        </button>
                                    </div>
                                </div>

                            </div>
                            
                            <div className="p-6 border-t border-border bg-bg-tertiary flex justify-end">
                                <button 
                                    onClick={() => {
                                        setEditingProduct(null);
                                    }}
                                    className="px-8 py-4 bg-brand-primary text-text-primary rounded-2xl font-black text-lg hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                                >
                                    Enregistrer les modifications
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
