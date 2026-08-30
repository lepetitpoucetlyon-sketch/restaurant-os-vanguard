
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChefHat, Book, AlertTriangle, Edit2, Trash2, Loader2 } from "lucide-react";
import { Button } from "@ui/Button";
import { cn } from "@/lib/ui.foundations";;
import { cinematicContainer, fadeInUp, cinematicItem } from "@/shared/utils/motion";
import { RecipeCostBadge } from '../../../recipes/RecipeCostBadge';
import { BarRecipeCard } from '../../../recipes/BarRecipeCard';

interface RecipesTabProps {
    recipes: import('@nexus/contracts').Recipe[];
    onSelectRecipe: (recipe: import('@nexus/contracts').Recipe) => void;
    onEditRecipe: (recipe: import('@nexus/contracts').Recipe) => void;
    onDeleteRecipe?: (id: string) => void;
    onNewRecipe: () => void;
    isLoading?: boolean;
}

export function RecipesTab({ recipes, onSelectRecipe, onEditRecipe, onDeleteRecipe, onNewRecipe, isLoading }: RecipesTabProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const uniqueCategories = Array.from(new Set(recipes.map(r => r.category?.toUpperCase() || 'AUTRE'))).sort();

    const filteredRecipes = recipes.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory ? (r.category?.toUpperCase() || 'AUTRE') === selectedCategory : true;
        return matchesSearch && matchesCategory;
    });

    return (
        <motion.div
            variants={cinematicContainer}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={fadeInUp} className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-serif font-semibold text-text-primary tracking-tight">Livre de Recettes & Fiches</h2>
                    <p className="text-text-muted text-[13px] mt-2 font-medium">Le savoir-faire de votre établissement, centralisé et sécurisé.</p>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search strokeWidth={1.5} className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input-elegant w-full h-12 pl-11 pr-4"
                        />
                    </div>
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="w-full md:w-auto">
                        <Button
                            onClick={onNewRecipe}
                            className="w-full md:w-auto h-12 px-8 bg-accent hover:bg-accent/90 text-text-primary rounded-xl font-bold text-micro uppercase tracking-widest shadow-xl shadow-accent/20"
                        >
                            <ChefHat strokeWidth={1.5} className="w-4 h-4 mr-2" />
                            Nouveau Plat
                        </Button>
                    </motion.div>
                </div>
            </motion.div>

            {/* Category Filter */}
            <motion.div variants={fadeInUp} className="flex overflow-x-auto elegant-scrollbar pb-4 mb-6 gap-2">
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                        "whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-micro uppercase tracking-widest transition-all",
                        selectedCategory === null
                            ? "bg-accent text-text-primary shadow-lg shadow-accent/20"
                            : "bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-tertiary border border-border"
                    )}
                >
                    TOUT AFFICHER
                </button>
                {uniqueCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={cn(
                            "whitespace-nowrap px-6 py-2.5 rounded-xl font-bold text-micro uppercase tracking-widest transition-all",
                            selectedCategory === cat
                                ? "bg-accent text-text-primary shadow-lg shadow-accent/20"
                                : "bg-bg-secondary text-text-muted hover:text-text-primary hover:bg-bg-tertiary border border-border"
                        )}
                    >
                        {cat}
                    </button>
                ))}
            </motion.div>


            {isLoading && recipes.length === 0 ? (
                <div className="flex items-center justify-center py-24 gap-3 text-text-muted">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-micro font-bold uppercase tracking-widest">Chargement des recettes…</span>
                </div>
            ) : filteredRecipes.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <ChefHat strokeWidth={1} className="w-12 h-12 text-text-muted/30 mb-4" />
                    <p className="text-micro font-bold text-text-muted uppercase tracking-widest">
                        {searchQuery ? `Aucun résultat pour "${searchQuery}"` : "Aucune recette enregistrée"}
                    </p>
                </div>
            ) : null}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <AnimatePresence>
                    {filteredRecipes.map(recipe => {
                        // cui-3: Use BarRecipeCard for cocktail / boissons recipes
                        const isBarRecipe =
                            recipe.category === 'boissons' ||
                            recipe.category === 'cocktails' ||
                            recipe.baseSpirit != null;

                        if (isBarRecipe) {
                            return (
                                <div key={recipe.id} className="relative group">
                                    <BarRecipeCard
                                        recipe={recipe}
                                        onClick={() => onSelectRecipe(recipe)}
                                    />
                                    {/* Edit / Delete overlay */}
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }}
                                            className="w-8 h-8 rounded-lg bg-bg-primary/80 flex items-center justify-center border border-border hover:bg-accent hover:text-text-primary transition-all"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteRecipe?.(recipe.id); }}
                                            className="w-8 h-8 rounded-lg bg-error/10 flex items-center justify-center border border-error/20 hover:bg-error hover:text-text-primary transition-all text-error"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return (
                        <motion.div role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (e.currentTarget as HTMLElement).click(); } }}
                            key={recipe.id}
                            variants={cinematicItem}
                            whileHover={{ y: -5 }}
                            onClick={() => onSelectRecipe(recipe)}
                            className="group bg-bg-secondary rounded-xl border border-border shadow-sm hover:shadow-2xl hover:shadow-accent/5 transition-all duration-500 cursor-pointer relative overflow-hidden p-0"
                        >
                            {recipe.image ? (
                                <div className="h-48 w-full overflow-hidden relative">
                                    <img src={String(recipe.image)} alt={String(recipe.name)} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-50" />
                                    <div className="absolute top-4 left-4 flex gap-2 z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }}
                                            className="w-8 h-8 rounded-lg bg-bg-primary/20 backdrop-blur-md flex items-center justify-center border border-default hover:bg-accent hover:text-text-primary transition-all shadow-xl"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteRecipe?.(recipe.id); }}
                                            className="w-8 h-8 rounded-lg bg-error/20 backdrop-blur-md flex items-center justify-center border border-error/20 hover:bg-error hover:text-text-primary transition-all shadow-xl"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="absolute top-4 right-4 w-10 h-10 rounded-lg bg-bg-primary/10 backdrop-blur-md flex items-center justify-center border border-border/20 group-hover:bg-accent group-hover:text-text-primary transition-all duration-300 shadow-xl">
                                        <Book strokeWidth={1.5} className="w-5 h-5 text-bg-primary" />
                                    </div>
                                </div>
                            ) : (
                                /* No Image: Centered Icon Placeholder */
                                <div className="h-32 w-full flex items-center justify-center bg-gradient-to-br from-bg-tertiary/30 to-bg-tertiary/10 relative">
                                    <div
                                        className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                                        style={{ backgroundColor: (recipe.color as string | undefined) ?? "#C5A059" }}
                                    >
                                        <Book strokeWidth={1.5} className="w-8 h-8 text-text-primary" />
                                    </div>
                                    {/* Action buttons for no-image cards */}
                                    <div className="absolute top-3 left-3 flex gap-2 z-20">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onEditRecipe(recipe); }}
                                            className="w-7 h-7 rounded-lg bg-bg-primary/80 flex items-center justify-center border border-border hover:bg-accent hover:text-text-primary transition-all"
                                        >
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onDeleteRecipe?.(recipe.id); }}
                                            className="w-7 h-7 rounded-lg bg-error/10 flex items-center justify-center border border-error/20 hover:bg-error hover:text-text-primary transition-all text-error"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className={cn("p-8", !recipe.image && "text-center")}>
                                <div className={cn("mb-8", !recipe.image && "flex flex-col items-center")}>
                                    <h3 className="font-serif font-semibold text-2xl text-text-primary tracking-tight group-hover:text-accent transition-colors">{String(recipe.name)}</h3>
                                    <p className="text-text-muted text-nano font-bold uppercase tracking-[0.2em] mt-2 font-mono">
                                        {recipe.prepTime} MIN PREP • 4 ITEMS
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    {recipe.allergens && recipe.allergens.length > 0 && (
                                        <div className={cn("flex items-center gap-3 px-4 py-2 bg-warning-soft dark:bg-warning/10 rounded-lg border border-warning/10", !recipe.image && "justify-center")}>
                                            <AlertTriangle strokeWidth={1.5} className="w-4 h-4 text-warning" />
                                            <span className="text-micro font-bold text-warning uppercase tracking-wider">Allergènes Présents</span>
                                        </div>
                                    )}
                                    {/* cui-1: Food cost + margin display */}
                                    <RecipeCostBadge recipe={recipe} compact />
                                    <Button className="w-full h-12 bg-bg-tertiary/50 hover:bg-accent text-text-primary hover:text-text-primary rounded-lg font-bold text-micro uppercase tracking-widest border border-border/50 group-hover:border-accent transition-all duration-300">
                                        Détails Techniques
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
