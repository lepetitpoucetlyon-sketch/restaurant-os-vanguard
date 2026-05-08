"use client";

import React from 'react';
import { Clock, ChefHat, Download, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/ui.foundations";;

interface Ingredient {
    name: string;
    quantity: string;
}

interface PreparationStep {
    order: string;
    instruction: string;
    time: string;
}

interface RecipeProps {
    name: string;
    description: string;
    image: string;
    prepTime: string;
    difficulty: string;
    ingredients: Ingredient[];
    steps: PreparationStep[];
    allergens: string[];
    onClose: () => void;
}

export function RecipeTechnicalSheet({
    name,
    description,
    image,
    prepTime,
    difficulty,
    ingredients,
    steps,
    allergens,
    onClose
}: RecipeProps) {
    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Left Side: Recipe Summary & Ingredients */}
            <div className="w-[380px] bg-[#fdfdfa] dark:bg-bg-secondary border-r border-subtle dark:border-border flex flex-col h-full overflow-y-auto elegant-scrollbar">
                {/* Image Section */}
                <div className="relative h-[300px] w-full mb-10 overflow-hidden">
                    <img
                        src={image}
                        alt={name}
                        className="w-full h-full object-cover rounded-br-[4rem] shadow-xl shadow-black/5"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#fdfdfa] dark:from-bg-secondary to-transparent" />
                </div>

                {/* Header Info */}
                <div className="px-10 space-y-8">
                    <div>
                        <span className="text-[10px] font-black text-accent-gold uppercase tracking-[0.4em] mb-4 block">Recette Signature</span>
                        <h2 className="text-4xl font-serif font-light text-primary dark:text-text-primary leading-tight italic">{name}</h2>
                        <p className="text-sm text-secondary dark:text-text-muted font-serif italic mt-4 leading-relaxed tracking-tight">
                            "{description}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface-card dark:bg-bg-tertiary p-6 rounded-3xl border border-subtle dark:border-border shadow-sm">
                            <p className="text-[8px] font-black text-muted dark:text-text-muted uppercase tracking-widest mb-1.5">Préparation</p>
                            <p className="text-sm font-mono font-bold text-primary dark:text-text-primary italic">{prepTime}</p>
                        </div>
                        <div className="bg-surface-card dark:bg-bg-tertiary p-6 rounded-3xl border border-subtle dark:border-border shadow-sm">
                            <p className="text-[8px] font-black text-muted dark:text-text-muted uppercase tracking-widest mb-1.5">Difficulté</p>
                            <p className="text-sm font-mono font-bold text-primary dark:text-text-primary italic uppercase">{difficulty}</p>
                        </div>
                    </div>

                    {/* Ingredients */}
                    <div className="pt-6 border-t border-subtle dark:border-border">
                        <h3 className="text-[10px] font-black text-primary dark:text-text-primary uppercase tracking-widest mb-8">Ingrédients</h3>
                        <div className="space-y-6">
                            {ingredients.map((ing, i) => (
                                <div key={i} className="flex justify-between items-end border-b border-subtle dark:border-border pb-3 group">
                                    <span className="text-sm font-serif italic text-secondary dark:text-text-muted group-hover:text-primary dark:group-hover:text-text-primary transition-colors">{ing.name}</span>
                                    <span className="text-[12px] font-mono font-bold text-primary dark:text-text-primary">{ing.quantity}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Allergens */}
                    <div className="pt-6">
                        <h3 className="text-[10px] font-black text-primary dark:text-text-primary uppercase tracking-widest mb-4">Allergènes</h3>
                        <div className="flex flex-wrap gap-2 pb-10">
                            {allergens.length > 0 ? allergens.map((allergen, i) => (
                                <span key={i} className="px-5 py-2 rounded-full bg-error/10 text-error text-[9px] font-black uppercase tracking-widest">
                                    {allergen}
                                </span>
                            )) : (
                                <span className="px-5 py-2 rounded-full bg-success/10 text-success text-[9px] font-black uppercase tracking-widest">
                                    AUCUN
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="sticky bottom-0 p-8 bg-gradient-to-t from-[#fdfdfa] dark:from-bg-secondary via-[#fdfdfa] dark:via-bg-secondary to-transparent pt-12">
                    <button className="w-full h-14 bg-surface-card dark:bg-bg-tertiary border border-default dark:border-border text-primary dark:text-text-primary rounded-full text-[10px] font-black uppercase tracking-[0.2em] hover:bg-surface-sidebar dark:hover:bg-accent-gold dark:hover:text-primary hover:text-white transition-all shadow-lg flex items-center justify-center gap-4 group">
                        <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        Télécharger Fiche PDF
                    </button>
                </div>
            </div>

            {/* Right Side: Execution Steps */}
            <div className="flex-1 bg-surface-card dark:bg-bg-tertiary p-14 overflow-y-auto elegant-scrollbar relative">
                <button
                    onClick={onClose}
                    className="absolute top-10 right-10 w-12 h-12 rounded-full bg-surface-bg dark:bg-bg-secondary hover:bg-surface-bg dark:hover:bg-surface-sidebar flex items-center justify-center transition-all z-20 group"
                >
                    <X className="w-6 h-6 text-muted dark:text-text-muted group-hover:text-primary dark:group-hover:text-text-primary transition-colors" />
                </button>

                <div className="max-w-2xl mx-auto py-10 space-y-24">
                    {steps.map((step, i) => (
                        <div key={i} className="relative group">
                            <div className="flex items-center gap-10">
                                <span className="text-6xl font-serif text-muted dark:text-primary group-hover:text-accent-gold transition-colors italic">
                                    {step.order}
                                </span>
                                <div className="h-px flex-1 bg-surface-bg dark:bg-border relative top-2">
                                    <div className="absolute right-0 bottom-3 flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-muted dark:text-text-muted" />
                                        <span className="text-[10px] font-mono font-bold text-secondary dark:text-text-muted uppercase tracking-widest">{step.time}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-10 pl-[85px]">
                                <p className="text-2xl font-serif font-light text-primary dark:text-text-primary leading-relaxed italic">
                                    {step.instruction}
                                </p>
                            </div>
                        </div>
                    ))}

                    <div className="pt-20 text-center">
                        <div className="inline-flex items-center gap-4 px-10 py-4 rounded-full border border-subtle dark:border-border bg-surface-bg/50 dark:bg-bg-secondary/40">
                            <ChefHat className="w-5 h-5 text-accent-gold" />
                            <span className="text-[10px] font-black text-muted dark:text-text-muted uppercase tracking-[0.4em]">Dressage Final</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
