// @ts-nocheck
// @ts-nocheck
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Plus, Edit2, Trash2, Package, Tag, User, Truck, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { cn } from "@/lib/ui.foundations";;
import { cinematicContainer, fadeInUp, cinematicItem } from "@/lib/motion";
import { useInventory } from "@/engines/ops/NexusOpsProvider";

export function IngredientsTab() {
    const { data: ingredients, isLoading, error } = useInventory();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    const categories = ["all", ...Array.from(new Set((ingredients || []).map((i: any) => i.category)))];

    const filteredIngredients = (ingredients || []).filter((ing: any) => {
        const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ing.supplier.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || ing.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    if (isLoading) return <div className="h-96 flex items-center justify-center text-text-muted animate-pulse font-black uppercase tracking-[0.3em]">Synchro Nexus...</div>;
    if (error) return <div className="h-96 flex items-center justify-center text-error border border-error/20 rounded-2xl bg-error/5">Erreur de Réalité : {error}</div>;

    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
            className="space-y-10"
        >
            <motion.div variants={fadeInUp} className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-serif font-semibold text-text-primary tracking-tight">Catalogue Ingrédients</h2>
                    <p className="text-text-muted text-[13px] mt-2 font-medium">Référentiel des matières premières et coûts unitaires.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-bg-secondary p-1 rounded-xl border border-border">
                        {categories.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                                    selectedCategory === cat
                                        ? "bg-accent text-white shadow-lg shadow-accent/20"
                                        : "text-text-muted hover:text-text-primary"
                                )}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <div className="relative w-64">
                        <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-elegant w-full h-12 pl-11 pr-4"
                        />
                    </div>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredIngredients.map((ing) => (
                    <motion.div
                        key={ing.id}
                        variants={cinematicItem}
                        whileHover={{ y: -5 }}
                        className="bg-bg-secondary rounded-2xl border border-border p-6 shadow-sm hover:shadow-xl transition-all duration-300 group"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div className="w-12 h-12 rounded-xl bg-bg-tertiary flex items-center justify-center group-hover:bg-accent transition-colors">
                                <Package className="w-6 h-6 text-text-muted group-hover:text-white transition-colors" />
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 rounded-lg bg-bg-tertiary text-text-muted hover:text-accent border border-border">
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button className="p-2 rounded-lg bg-error/5 text-error hover:bg-error/10 border border-error/10">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-serif font-black text-text-primary tracking-tight truncate">{ing.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <Tag className="w-3 h-3 text-accent" />
                                    <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{ing.category}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 py-4 border-y border-border/50">
                                <div>
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Coût Unitaire</p>
                                    <p className="text-xl font-mono font-black text-text-primary">{formatCurrency(ing.costInCents / 100)}<span className="text-[10px] text-text-muted ml-1">/{ing.unit}</span></p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[9px] font-black text-text-muted uppercase tracking-[0.2em] mb-1">Stock Min</p>
                                    <p className="text-xl font-mono font-black text-text-primary">{ing.minQuantity} <span className="text-[10px] text-text-muted ml-0.5">{ing.unit}</span></p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-text-muted">
                                <Truck className="w-4 h-4" />
                                <span className="text-[11px] font-bold truncate">{ing.supplier}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}

                <motion.button
                    variants={cinematicItem}
                    whileHover={{ scale: 1.02 }}
                    className="h-full min-h-[280px] rounded-2xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-4 hover:border-accent group transition-all"
                >
                    <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center group-hover:bg-accent transition-colors">
                        <Plus className="w-8 h-8 text-accent group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-text-muted group-hover:text-accent">Ajouter au Catalogue</span>
                </motion.button>
            </div>
        </motion.div>
    );
}
