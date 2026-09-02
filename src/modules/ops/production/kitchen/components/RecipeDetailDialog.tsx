"use client";

import { useState, useCallback } from "react";
import { Printer } from "lucide-react";
import { Button } from "@ui/Button";
import { Modal } from "@ui/Modal";
import type { Recipe } from "@nexus/contracts";
import { printRecipeTechnicalSheet } from './recipe-detail/recipePrintHelper';
import { RecipeSidebarHero } from './recipe-detail/RecipeSidebarHero';
import { RecipeIngredientsSection } from './recipe-detail/RecipeIngredientsSection';
import { RecipeStepsSection } from './recipe-detail/RecipeStepsSection';
import { RecipeCostSummary } from './recipe-detail/RecipeCostSummary';

interface RecipeDetailDialogProps {
    isOpen: boolean;
    onClose: () => void;
    recipe: Recipe;
}

export function RecipeDetailDialog({ isOpen, onClose, recipe }: RecipeDetailDialogProps) {
    const basePortions = Math.max(1, recipe?.portions ?? 1);
    const [currentPortions, setCurrentPortions] = useState(basePortions);

    const handlePortionChange = useCallback((delta: number) => {
        setCurrentPortions(p => Math.max(1, p + delta));
    }, []);

    const handleReset = useCallback(() => {
        setCurrentPortions(basePortions);
    }, [basePortions]);

    if (!recipe) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            forceDesktop
            className="p-0 border-none bg-transparent max-w-7xl"
            showClose={false}
            noPadding
        >
            <div className="w-full h-[85vh] rounded-[3rem] shadow-[0_32px_128px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col md:flex-row relative border transition-colors duration-500 bg-surface-card border-black/5">
                {/* Static Sidebar */}
                <div className="md:w-[450px] border-r flex flex-col h-full shrink-0 relative transition-colors duration-500 bg-surface-bg border-black/5">
                    <RecipeSidebarHero
                        recipe={recipe}
                        basePortions={basePortions}
                        currentPortions={currentPortions}
                        handlePortionChange={handlePortionChange}
                        handleReset={handleReset}
                        onClose={onClose}
                    />

                    <div className="p-10 flex-1 overflow-auto elegant-scrollbar space-y-8">
                        <RecipeIngredientsSection
                            recipe={recipe}
                            basePortions={basePortions}
                            currentPortions={currentPortions}
                        />
                        <div className="border-t border-black/5 pt-6">
                            <h3 className="text-nano font-black text-primary dark:text-text-primary uppercase tracking-widest mb-4">
                                Rentabilité
                            </h3>
                            <RecipeCostSummary recipe={recipe} currentPortions={currentPortions} />
                        </div>
                    </div>

                    {/* Sidebar footer — print button */}
                    <div className="p-10 border-t transition-colors duration-500 border-black/5 bg-surface-bg/50">
                        <Button
                            onClick={() => printRecipeTechnicalSheet(recipe, currentPortions)}
                            className="w-full h-16 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] shadow-lg transition-all transform hover:scale-[1.02] bg-action-primary hover:bg-action-primary-hover text-text-on-primary"
                        >
                            <Printer className="w-5 h-5 mr-3" />
                            Imprimer Fiche Technique
                        </Button>
                    </div>
                </div>

                {/* Main content — recipe steps */}
                <RecipeStepsSection recipe={recipe} />

                {/* Detail texture overlay */}
                <div
                    className="absolute inset-0 pointer-events-none opacity-[0.4] mix-blend-overlay"
                    style={{ backgroundImage: `url("https://www.transparenttextures.com/patterns/carbon-fibre.png")` }}
                />
            </div>
        </Modal>
    );
}
