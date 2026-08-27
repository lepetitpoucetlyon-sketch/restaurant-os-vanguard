"use client";

import { motion } from "framer-motion";
import { X, Heart, Share2, Clock, Flame, Minus, Plus, RotateCcw } from "lucide-react";
import type { Recipe } from "@nexus/contracts";

interface RecipeSidebarHeroProps {
    recipe: Recipe;
    basePortions: number;
    currentPortions: number;
    handlePortionChange: (delta: number) => void;
    handleReset: () => void;
    onClose: () => void;
}

import { useState } from "react";
import { toast } from "sonner";

export function RecipeSidebarHero({
    recipe,
    basePortions,
    currentPortions,
    handlePortionChange,
    handleReset,
    onClose,
}: RecipeSidebarHeroProps) {
    const isScaled = currentPortions !== basePortions;
    const [isFavorite, setIsFavorite] = useState(false);

    const handleShare = async () => {
        const shareData = {
            title: `Recette : ${recipe.name}`,
            text: `Fiche technique de ${recipe.name} sur Restaurant OS`,
            url: typeof window !== 'undefined' ? window.location.href : '',
        };

        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch {
                // Annulé par l'utilisateur
            }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(window.location.href);
                toast.success("Lien de la fiche technique copié !");
            } catch {
                toast.error("Impossible de copier le lien");
            }
        }
    };

    const toggleFavorite = () => {
        setIsFavorite(prev => {
            const next = !prev;
            if (next) {
                toast.success(`${recipe.name} ajouté aux favoris`);
            } else {
                toast.info(`${recipe.name} retiré des favoris`);
            }
            return next;
        });
    };

    return (
        <>
            {/* Hero image */}
            <div className="relative h-64 overflow-hidden transition-colors bg-surface-bg">
                <motion.img
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 1.5 }}
                    src={String(recipe.image ?? recipe.imageUrl ?? "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=1000&auto=format&fit=crop")}
                    className="w-full h-full object-cover opacity-80"
                    alt={String(recipe.name)}
                />
                <div className="absolute inset-0 bg-gradient-to-t via-transparent to-transparent transition-colors from-surface-bg" />

                <button
                    onClick={onClose}
                    className="absolute top-8 left-8 w-12 h-12 backdrop-blur-xl rounded-2xl flex items-center justify-center transition-all duration-300 shadow-2xl z-20 group border bg-surface-card/40 hover:bg-surface-card/60 text-primary border-black/10"
                >
                    <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                </button>

                <div className="absolute bottom-6 left-8 right-8 flex justify-between items-center z-10">
                    <div className="flex gap-2">
                        <button 
                            onClick={toggleFavorite}
                            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                            aria-label="Favori"
                            className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center text-error hover:scale-110 transition-all shadow-lg border bg-surface-card/60 border-black/10 cursor-pointer"
                        >
                            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-error text-error' : 'text-text-muted hover:text-error'}`} />
                        </button>
                        <button 
                            onClick={handleShare}
                            title="Partager la fiche technique"
                            aria-label="Partager"
                            className="w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center hover:scale-110 transition-all shadow-lg border bg-surface-card/60 text-primary border-black/10 cursor-pointer"
                        >
                            <Share2 className="w-5 h-5" />
                        </button>
                    </div>
                    <motion.div
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-accent px-4 py-2 rounded-xl text-primary font-serif font-black text-xs tracking-widest shadow-lg shadow-[#C5A059]/20"
                    >
                        SIGNATURE
                    </motion.div>
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <span className="text-nano font-black uppercase tracking-[0.4em] text-accent mb-4 block">SIGNATURE</span>
                <h1 className="text-4xl font-serif font-black leading-[1.1] mb-6 tracking-tight transition-colors text-primary">{String(recipe.name)}</h1>
                <p className="text-[15px] leading-relaxed font-serif italic mb-10 opacity-80 border-l-2 border-accent/30 pl-4 py-1 transition-colors text-secondary">
                    &ldquo;{String(recipe.description ?? "Une création culinaire d'exception pour sublimer votre carte, alliant technique ancestrale et modernité.")}&rdquo;
                </p>
            </motion.div>

            {/* Prep time + difficulty */}
            <div className="grid grid-cols-2 gap-6 mb-8">
                <div className="p-6 rounded-[2rem] border group hover:border-accent/30 transition-all duration-500 bg-surface-card border-border">
                    <span className="text-micro font-black uppercase text-secondary tracking-[0.3em] block mb-2">Prép.</span>
                    <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-accent" />
                        <span className="text-xl font-serif font-black transition-colors text-primary">
                            {recipe.preparationTimeMinutes ?? recipe.prepTime ?? 20} MIN
                        </span>
                    </div>
                </div>
                <div className="p-6 rounded-[2rem] border group hover:border-accent/30 transition-all duration-500 bg-surface-card border-border">
                    <span className="text-micro font-black uppercase text-secondary tracking-[0.3em] block mb-2">Service</span>
                    <div className="flex items-center gap-3">
                        <Flame className="w-5 h-5 text-error" />
                        <span className="text-xl font-serif font-black uppercase text-[15px] transition-colors text-primary">
                            {String(recipe.difficulty ?? 'MOYEN')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Portions scaling spinner */}
            <div className="p-5 rounded-2xl border border-border bg-surface-glass mb-8">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-micro font-black uppercase text-secondary tracking-[0.3em]">
                        Portions
                    </span>
                    {isScaled && (
                        <button
                            onClick={handleReset}
                            className="flex items-center gap-1.5 text-nano font-black text-accent uppercase tracking-wider hover:opacity-70 transition-opacity"
                        >
                            <RotateCcw className="w-3 h-3" strokeWidth={2} />
                            Réinitialiser
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => handlePortionChange(-1)}
                        disabled={currentPortions <= 1}
                        className="w-9 h-9 rounded-xl border border-black/10 bg-surface-card flex items-center justify-center hover:bg-accent hover:text-text-primary hover:border-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed text-primary"
                    >
                        <Minus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    <span className="text-2xl font-serif font-black text-primary min-w-[2rem] text-center">
                        {currentPortions}
                    </span>
                    <button
                        onClick={() => handlePortionChange(1)}
                        className="w-9 h-9 rounded-xl border border-black/10 bg-surface-card flex items-center justify-center hover:bg-accent hover:text-text-primary hover:border-accent transition-all text-primary"
                    >
                        <Plus className="w-4 h-4" strokeWidth={2.5} />
                    </button>
                    {isScaled && (
                        <span className="text-nano font-black text-accent uppercase tracking-widest ml-2">
                            ×{(currentPortions / basePortions).toFixed(2).replace(/\.?0+$/, '')}
                        </span>
                    )}
                </div>
            </div>
        </>
    );
}
